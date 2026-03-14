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
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
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
    res.json({ user: target });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
