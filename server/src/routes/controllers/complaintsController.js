const Complaint = require("../models/Complaint");
const User      = require("../models/User");

function scopeFilter(user) {
  if (user.role === "school_admin") return { targetSchool: user.school };
  if (user.role === "dept_admin")   return { targetSchool: user.school, targetDept: user.department };
  // staff / dept_admin personal: complaints directed at them OR submitted by them
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
    const complaints = await Complaint.find(filter)
      .populate("submittedBy", "firstName lastName uniqueId")
      .populate("targetLecturerId", "firstName lastName uniqueId designation")
      .sort({ createdAt: -1 });
    res.json({ complaints });
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

    res.status(201).json({ complaint });
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
    const canModerate =
      (u.role === "school_admin" && c.targetSchool === u.school) ||
      (u.role === "dept_admin"   && c.targetDept   === u.department) ||
      String(c.targetLecturerId) === String(u._id);

    if (!canModerate) return res.status(403).json({ message: "Forbidden." });

    c.status = req.body.status;
    await c.save();
    res.json({ complaint: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/complaints/:id/reply  (staff / dept_admin reply to sender)
exports.addReply = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });
    if (String(c.targetLecturerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the recipient can reply." });
    }
    c.replies.push({
      senderId:   req.user._id,
      senderUid:  req.user.uniqueId,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      message:    req.body.message,
    });
    await c.save();
    res.json({ complaint: c });
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
    res.json({ complaint: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/complaints/:id  (admin only)
exports.deleteComplaint = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Complaint not found." });
    const u = req.user;
    const inScope =
      (u.role === "school_admin" && c.targetSchool === u.school) ||
      (u.role === "dept_admin"   && c.targetDept   === u.department);
    if (!inScope) return res.status(403).json({ message: "Outside your scope." });
    await c.deleteOne();
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
