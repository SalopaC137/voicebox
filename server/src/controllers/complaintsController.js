const Complaint = require("../models/Complaint");
const User      = require("../models/User");
const Notification = require("../models/Notification");
const { sendNotificationToUser } = require("../utils/onesignal");

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
    complaints = complaints.map(c => {
      if (c.isAnonymous && !isAdmin && String(c.submittedBy?._id) !== String(req.user._id)) {
        c = c.toObject(); // strip mongoose helpers so we can mutate
        c.submittedBy = null;
        c.submitterUid = null;
      }
      return c;
    });

    res.json(complaints);
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

    const complaint = await Complaint.create({
      submittedBy: req.user._id,
      submitterUid: req.user.uniqueId,
      isAnonymous: !!isAnonymous,
      type, title, description, category, priority,
      targetSchool, targetDept, targetLecturerId, targetLecturerUid,
    });

    const submitterName = `${req.user.firstName} ${req.user.lastName}`;
    const reportType = type === "suggestion" ? "suggestion" : "complaint";
    const complaintMessage = `New ${reportType} from ${submitterName}: ${title}`;

    await Notification.create({
      userId: targetLecturerId,
      message: complaintMessage,
      complaintId: complaint._id,
      type: "complaint",
    });

    await sendNotificationToUser(targetLecturerId, complaintMessage);

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/complaints/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });

    const u = req.user;
    const isSubmitter = String(c.submittedBy) === String(u._id);
    const canModerate =
      (u.role === "school_admin" && c.targetSchool === u.school) ||
      (u.role === "dept_admin"   && c.targetDept   === u.department) ||
      String(c.targetLecturerId) === String(u._id) ||
      isSubmitter;  // Allow submitter to change status

    if (!canModerate) return res.status(403).json({ message: "Forbidden." });

    c.status = req.body.status;
    await c.save();

    if (String(c.submittedBy) !== String(req.user._id)) {
      const statusMessage = `Your complaint "${c.title}" is now ${c.status}.`;
      await Notification.create({
        userId: c.submittedBy,
        message: statusMessage,
        complaintId: c._id,
        type: "complaint",
      });
      await sendNotificationToUser(c.submittedBy, statusMessage);
    }
    
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
    
    c.replies.push({
      senderId:   req.user._id,
      senderUid:  req.user.uniqueId,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      senderRole: req.user.role,
      senderDesignation: req.user.designation,
      message:    req.body.message,
    });
    
    // Auto-change status from "open" to "in-progress" on first reply
    // but only if the person replying is the receiver (target lecturer or
    // department admin).  We don't want the complainant's own comments to
    // immediately push the ticket into progress.
    const senderIsReceiver = isTarget || isDeptAdmin;
    if (c.status === "open" && c.replies.length === 1 && senderIsReceiver) {
      c.status = "in-progress";
    }
    
    // Reset readBy array so everyone sees the new reply as unread
    c.readBy = [];
    
    await c.save();

    const replyRecipientId = isSubmitter ? c.targetLecturerId : c.submittedBy;
    if (replyRecipientId && String(replyRecipientId) !== String(req.user._id)) {
      const replyMessage = `New reply on complaint "${c.title}".`;
      await Notification.create({
        userId: replyRecipientId,
        message: replyMessage,
        complaintId: c._id,
        type: "complaint",
      });
      await sendNotificationToUser(replyRecipientId, replyMessage);
    }
    
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
