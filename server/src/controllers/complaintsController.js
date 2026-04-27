const Complaint = require("../models/Complaint");
const User      = require("../models/User");
const Notification = require("../models/Notification");
const { sendNotificationToUser } = require("../utils/onesignal");

function normalizeComplaintStatus(status) {
  const value = String(status || "").trim().toLowerCase().replace(/\s+/g, "-");
  return value === "inprogress" ? "in-progress" : value;
}

async function createUserNotification(req, userId, payload) {
  const notification = await Notification.create({
    userId,
    message: payload.message,
    complaintId: payload.complaintId || null,
    type: payload.type || "system",
  });

  const io = req.app.locals.io;
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification.toObject());
  }

  sendNotificationToUser(userId, payload.message)
    .catch((err) => console.error("Failed to send OneSignal notification:", err.message));

  return notification;
}

async function notifyParticipants(req, complaint, actorId, payloadBuilder) {
  const participantIds = [complaint.submittedBy, complaint.targetLecturerId]
    .filter(Boolean)
    .map((id) => String(id));
  const uniqueRecipients = [...new Set(participantIds)]
    .filter((id) => id !== String(actorId));

  await Promise.all(uniqueRecipients.map((recipientId) => {
    const payload = payloadBuilder(recipientId);
    return createUserNotification(req, recipientId, payload);
  }));
}

function scopeFilter(user) {
  if (user.role === "school_admin") return { targetSchool: user.school };
  if (user.role === "dept_admin") {
    // Dept admin sees: their dept complaints + personal complaints directed to them
    return {
      $or: [
        { targetSchool: user.school, targetDept: user.department },
        { targetLecturerId: user._id },
      ],
    };
  }
  // staff / student: complaints directed at them OR submitted by them
  return {
    $or: [
      { submittedBy: user._id },
      { targetLecturerId: user._id },
    ],
  };
}

// GET /api/complaints
exports.getComplaints = async (req, res) => {
  try {
    const filter = scopeFilter(req.user);
    let complaints = await Complaint.find(filter)
      .populate("submittedBy", "firstName lastName uniqueId")
      .populate("targetLecturerId", "firstName lastName uniqueId designation")
      .sort({ createdAt: -1 });

    // enforce anonymity at the API level: only admins and the original submitter
    // should ever see the real submitter info.  Everyone else gets a blank.
    const isAdmin = req.user.role === "school_admin" || req.user.role === "dept_admin";
    complaints = complaints.map((complaint) => {
      const submitterId = String(complaint.submittedBy?._id || complaint.submittedBy || "");
      if (complaint.isAnonymous && !isAdmin && submitterId !== String(req.user._id)) {
        const c = complaint.toObject(); // strip mongoose helpers so we can mutate safely
        c.submittedBy = null;
        c.submitterUid = null;
        if (Array.isArray(c.replies)) {
          c.replies = c.replies.map((reply) => {
            const isSubmitterReply = String(reply.senderId || "") === submitterId;
            if (reply.isAnonymousSender || isSubmitterReply) {
              return {
                ...reply,
                senderName: "Anonymous",
                senderUid: null,
                senderDesignation: null,
                isAnonymousSender: true,
              };
            }
            return reply;
          });
        }
        return c;
      }
      return complaint;
    });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/complaints/reports/cumulative
exports.getCumulativeReport = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "school_admin" && user.role !== "dept_admin") {
      return res.status(403).json({ message: "Only admins can generate reports." });
    }

    const scopeMatch =
      user.role === "school_admin"
        ? { targetSchool: user.school }
        : { targetSchool: user.school, targetDept: user.department };

    const complaints = await Complaint.find(scopeMatch).select("status type priority category createdAt");

    const status = { open: 0, "in-progress": 0, resolved: 0 };
    const byType = {};
    const byPriority = {};
    const byCategory = {};
    const monthly = {};

    complaints.forEach((complaint) => {
      const normalizedStatus = normalizeComplaintStatus(complaint.status);
      if (normalizedStatus in status) status[normalizedStatus] += 1;

      const typeKey = complaint.type || "unknown";
      const priorityKey = complaint.priority || "unknown";
      const categoryKey = complaint.category || "unknown";
      byType[typeKey] = (byType[typeKey] || 0) + 1;
      byPriority[priorityKey] = (byPriority[priorityKey] || 0) + 1;
      byCategory[categoryKey] = (byCategory[categoryKey] || 0) + 1;

      if (complaint.createdAt) {
        const date = new Date(complaint.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthly[key] = (monthly[key] || 0) + 1;
      }
    });

    const total = complaints.length;
    const resolutionRate = total > 0 ? Math.round((status.resolved / total) * 100) : 0;

    res.json({
      scope: {
        role: user.role,
        school: user.school || null,
        department: user.role === "dept_admin" ? user.department || null : null,
      },
      totals: {
        total,
        open: status.open,
        inProgress: status["in-progress"],
        resolved: status.resolved,
        resolutionRate,
      },
      breakdowns: {
        byType: Object.entries(byType).map(([key, count]) => ({ key, count })),
        byPriority: Object.entries(byPriority).map(([key, count]) => ({ key, count })),
        byCategory: Object.entries(byCategory).map(([key, count]) => ({ key, count })),
      },
      monthlyTrend: Object.entries(monthly).map(([key, count]) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month, count };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/complaints
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, type, isAnonymous,
            targetSchool, targetDept, targetLecturerId, targetLecturerUid } = req.body;

    if (!targetLecturerId) return res.status(400).json({ message: "A specific recipient is required." });

    // Guard against accidental double-submit of the exact same complaint payload.
    const recentDuplicate = await Complaint.findOne({
      submittedBy: req.user._id,
      targetLecturerId,
      title,
      description,
      type,
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
    })
      .populate("submittedBy", "firstName lastName uniqueId")
      .populate("targetLecturerId", "firstName lastName uniqueId designation");

    if (recentDuplicate) {
      return res.status(200).json(recentDuplicate);
    }

    const complaint = await Complaint.create({
      submittedBy: req.user._id,
      submitterUid: req.user.uniqueId,
      isAnonymous: !!isAnonymous,
      type, title, description, category, priority,
      targetSchool, targetDept, targetLecturerId, targetLecturerUid,
    });

    const complaintWithRefs = await complaint.populate([
      { path: "submittedBy", select: "firstName lastName uniqueId" },
      { path: "targetLecturerId", select: "firstName lastName uniqueId designation" },
    ]);

    const io = req.app.locals.io;
    if (io) {
      // Recipient gets instant complaint card, just like instant chat/reply updates.
      io.to(`user:${targetLecturerId}`).emit("complaint-created", complaintWithRefs.toObject());
      if (targetSchool) io.to(`school:${targetSchool}`).emit("complaint-created", complaintWithRefs.toObject());
      if (targetDept) io.to(`dept:${targetDept}`).emit("complaint-created", complaintWithRefs.toObject());
    }

    const entryType = type === "suggestion" ? "suggestion" : "complaint";
    const senderName = isAnonymous ? "Anonymous user" : `${req.user.firstName} ${req.user.lastName}`;
    const message = `New ${entryType} from ${senderName}: ${title}`;
    createUserNotification(req, targetLecturerId, {
      message,
      complaintId: complaint._id,
      type: entryType,
    }).catch((err) => console.error("Failed to create notification:", err.message));

    res.status(201).json(complaintWithRefs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/complaints/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });

    const requestedStatus = normalizeComplaintStatus(req.body.status);
    const validStatuses = ["open", "in-progress", "resolved"];
    if (!validStatuses.includes(requestedStatus)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const u = req.user;
    const isSubmitter = String(c.submittedBy) === String(u._id);
    const currentStatus = normalizeComplaintStatus(c.status);
    const canModerate =
      (u.role === "school_admin" && c.targetSchool === u.school) ||
      (u.role === "dept_admin"   && c.targetDept   === u.department) ||
      String(c.targetLecturerId) === String(u._id) ||
      isSubmitter;  // Allow submitter to change status

    if (!canModerate) return res.status(403).json({ message: "Forbidden." });

    if (requestedStatus === "resolved") {
      if (!isSubmitter) {
        return res.status(403).json({ message: "Only the complaint initiator can mark as resolved." });
      }
    }

    c.status = requestedStatus;
    await c.save();

    // Notify the other participant(s) that status has changed.
    notifyParticipants(req, c, req.user._id, () => ({
      message: `Status changed: \"${c.title}\" is now ${c.status}.`,
      complaintId: c._id,
      type: c.type === "suggestion" ? "suggestion" : "complaint",
    })).catch((err) => console.error("Failed to notify status change:", err.message));
    
    // Emit real-time event
    const io = req.app.locals.io;
    if (io) {
      io.emit("complaint-updated", c);
    }
    
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/complaints/:id/reply  (target lecturer or submitter can reply)
exports.addReply = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });
    
    const isTarget = String(c.targetLecturerId) === String(req.user._id);
    const isSubmitter = String(c.submittedBy) === String(req.user._id);
    const isDeptAdmin = req.user.role === "dept_admin" && c.targetDept === req.user.department;
    
    if (!isTarget && !isSubmitter && !isDeptAdmin) {
      return res.status(403).json({ message: "Only the recipient, sender, or department admin can reply." });
    }
    
    const isAnonymousSubmitterReply = c.isAnonymous && isSubmitter;
    c.replies.push({
      senderId:   req.user._id,
      senderUid:  isAnonymousSubmitterReply ? null : req.user.uniqueId,
      senderName: isAnonymousSubmitterReply ? "Anonymous" : `${req.user.firstName} ${req.user.lastName}`,
      senderRole: req.user.role,
      senderDesignation: isAnonymousSubmitterReply ? null : req.user.designation,
      isAnonymousSender: isAnonymousSubmitterReply,
      message:    req.body.message,
    });
    
    // Auto-change status from "open" to "in-progress" when the receiver
    // (target lecturer or scoped dept admin) sends their first response.
    // This should still happen even if the submitter replied earlier.
    const senderIsReceiver = isTarget || isDeptAdmin;
    const hadReceiverReplyBefore = c.replies.slice(0, -1).some((reply) => {
      const senderRole = reply.senderRole;
      const senderId = String(reply.senderId || "");
      return senderId === String(c.targetLecturerId) || senderRole === "dept_admin";
    });

    if (normalizeComplaintStatus(c.status) === "open" && senderIsReceiver && !hadReceiverReplyBefore) {
      c.status = "in-progress";
    }
    
    // Reset readBy array so everyone sees the new reply as unread
    c.readBy = [];
    
    await c.save();

    const actorName = `${req.user.firstName} ${req.user.lastName}`;
    const senderIsSubmitter = String(c.submittedBy) === String(req.user._id);
    const senderLabel = senderIsSubmitter
      ? "The submitter"
      : req.user.role === "dept_admin"
        ? `${actorName} (Department Admin)`
        : actorName;

    notifyParticipants(req, c, req.user._id, () => ({
      message: `${senderLabel} replied on \"${c.title}\".`,
      complaintId: c._id,
      type: c.type === "suggestion" ? "suggestion" : "complaint",
    })).catch((err) => console.error("Failed to notify new reply:", err.message));
    
    // Emit real-time event with full complaint data
    const io = req.app.locals.io;
    if (io) {
      io.emit("reply-added", {
        complaintId: c._id,
        replies: c.replies,
        status: c.status,
        readBy: c.readBy,
      });
    }
    
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/complaints/:id/admin-note  (admin → staff message)
exports.addAdminNote = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });

    const u = req.user;
    const inScope =
      (u.role === "school_admin" && c.targetSchool === u.school) ||
      (u.role === "dept_admin"   && c.targetDept   === u.department && c.targetSchool === u.school);
    if (!inScope) return res.status(403).json({ message: "Outside your scope." });

    c.adminNotes.push({
      senderId:   u._id,
      senderUid:  u.uniqueId,
      senderName: `${u.firstName} ${u.lastName}`,
      message:    req.body.message,
    });
    await c.save();
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/complaints/:id/read  (mark as read by current user)
exports.markAsRead = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });
    
    // Add user to readBy if not already there
    if (!c.readBy.includes(req.user._id)) {
      c.readBy.push(req.user._id);
      await c.save();
      
      // Emit real-time event to update all clients
      const io = req.app.locals.io;
      if (io) {
        io.emit("complaint-updated", c);
      }
    }
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/complaints/:id  (admin, target lecturer, or submitter)
exports.deleteComplaint = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });
    
    const u = req.user;
    const isSubmitter = String(c.submittedBy) === String(u._id);
    const isTarget = String(c.targetLecturerId) === String(u._id);
    const isAdmin = (u.role === "school_admin" && c.targetSchool === u.school) ||
                    (u.role === "dept_admin" && c.targetDept === u.department);
    
    if (!isAdmin && !isTarget && !isSubmitter) {
      return res.status(403).json({ message: "You can only delete your own complaints or complaints directed to you." });
    }
    
    await c.deleteOne();
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
