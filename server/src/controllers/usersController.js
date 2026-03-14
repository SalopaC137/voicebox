const User = require("../models/User");

// Build a Mongoose filter that respects admin scope
function scopeFilter(user) {
  if (user.role === "school_admin") return { school: user.school };
  if (user.role === "dept_admin")   return { school: user.school, department: user.department };
  return null; // non-admin — should not call this
}

// GET /api/users  (admin only, scoped)
exports.getUsers = async (req, res) => {
  try {
    const filter = scopeFilter(req.user);
    if (!filter) return res.status(403).json({ message: "Forbidden." });
    // hide suspended accounts from the normal listing by default – they are
    // effectively "erased" from the system as far as admins are concerned.
    // however, callers can request the full set using ?includeSuspended=true
    const includeSuspended = req.query.includeSuspended === "true";
    const query = { ...filter };
    if (!includeSuspended) query.isSuspended = { $ne: true };

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/staff/all (anyone authenticated, see ALL staff across university)
exports.getStaff = async (req, res) => {
  try {
    // All authenticated users can see all staff/admins across all departments/schools
    // This allows students and staff to file complaints to anyone in the university
    const staff = await User.find({
      $or: [
        { role: "staff" },
        { role: "dept_admin" },
        { role: "school_admin" }
      ]
    }).sort({ firstName: 1, lastName: 1 });
    
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/:id/suspend  (admin only, scoped)
exports.suspendUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });

    // Scope check
    if (req.user.role === "school_admin" && target.school !== req.user.school) {
      return res.status(403).json({ message: "Outside your scope." });
    }
    if (req.user.role === "dept_admin" && (target.school !== req.user.school || target.department !== req.user.department)) {
      return res.status(403).json({ message: "Outside your scope." });
    }

    target.isSuspended = req.body.isSuspended;
    await target.save();

    // Notify real-time listeners.  Broadcast to any admin rooms that might care.
    const io = req.app.locals.io;
    if (io) {
      const payload = { ...target.toObject(), password: undefined };
      // force the suspended user to drop their socket (if connected)
      if (target.isSuspended) {
        io.to(`user:${target._id}`).emit("force-logout", {
          message: "Your account has been suspended by an administrator for malpractice."
        });
        io.to(`school:${target.school}`).emit("user-removed", target._id);
        if (target.department) io.to(`dept:${target.department}`).emit("user-removed", target._id);
      } else {
        io.to(`school:${target.school}`).emit("user-updated", payload);
        if (target.department) io.to(`dept:${target.department}`).emit("user-updated", payload);
      }
    }

    res.json({ user: target });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
