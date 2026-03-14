const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and attach user to req
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Not authenticated. Please log in." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User no longer exists." });
    if (req.user.isSuspended) return res.status(403).json({ message: "Account suspended." });
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this action." });
  }
  next();
};

// Only allow access to data within the admin's scope
exports.scopeGuard = (req, res, next) => {
  req.scope = {};
  if (req.user.role === "school_admin") {
    req.scope = { type: "school", school: req.user.school };
  } else if (req.user.role === "dept_admin") {
    req.scope = { type: "dept", school: req.user.school, dept: req.user.department };
  }
  next();
};
