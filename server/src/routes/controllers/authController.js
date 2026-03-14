const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── UID counters (in-memory; replace with DB sequence in production) ──
const counters = { SAD:{}, DAD:{}, STF:{}, STU:{} };
function genUID(role, school, dept) {
  if (role === "school_admin") { const k = school||"GEN"; counters.SAD[k]=(counters.SAD[k]||0)+1; return `SAD-${k}-${String(counters.SAD[k]).padStart(4,"0")}`; }
  if (role === "dept_admin")   { const k = dept||"GEN";   counters.DAD[k]=(counters.DAD[k]||0)+1; return `DAD-${k}-${String(counters.DAD[k]).padStart(4,"0")}`; }
  if (role === "staff")        { const k = dept||"GEN";   counters.STF[k]=(counters.STF[k]||0)+1; return `STF-${k}-${String(counters.STF[k]).padStart(4,"0")}`; }
  const k = school||"GEN"; counters.STU[k]=(counters.STU[k]||0)+1; return `STU-${k}-${String(counters.STU[k]).padStart(5,"0")}`;
}

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { role, firstName, lastName, email, phone, password,
            school, department, unitGroup, unitName,
            regNumber, staffId, designation } = req.body;

    // Validate activation code for admin roles
    if (role === "school_admin" && req.body.activationCode !== process.env.SCHOOL_ADMIN_CODE) {
      return res.status(400).json({ message: "Invalid school admin activation code." });
    }
    if (role === "dept_admin" && req.body.activationCode !== process.env.DEPT_ADMIN_CODE) {
      return res.status(400).json({ message: "Invalid department admin activation code." });
    }

    // Check duplicate email
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const uniqueId = genUID(role, school, department);

    const user = await User.create({
      uniqueId, role, firstName, lastName, email, phone, password,
      school: school || null,
      department: department || null,
      unitGroup: unitGroup || null,
      unitName: unitName || null,
      regNumber: regNumber || null,
      staffId: staffId || null,
      designation: designation || "",
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (user.isSuspended) return res.status(403).json({ message: "Account suspended." });

    const token = signToken(user._id);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
