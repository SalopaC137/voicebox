const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── UID counters (initialized from DB on startup) ──
const counters = { SAD:{}, DAD:{}, STF:{}, STU:{} };

// Initialize counters from existing users in DB
async function initializeCounters() {
  try {
    const users = await User.find().select("uniqueId");
    for (const user of users) {
      if (!user.uniqueId) continue;
      const [prefix, code, num] = user.uniqueId.split("-");
      const n = parseInt(num, 10);
      
      if (prefix === "SAD") {
        counters.SAD[code] = Math.max(counters.SAD[code] || 0, n);
      } else if (prefix === "DAD") {
        counters.DAD[code] = Math.max(counters.DAD[code] || 0, n);
      } else if (prefix === "STF") {
        counters.STF[code] = Math.max(counters.STF[code] || 0, n);
      } else if (prefix === "STU") {
        counters.STU[code] = Math.max(counters.STU[code] || 0, n);
      }
    }
    console.log("✅  UID counters initialized:", JSON.stringify(counters));
  } catch (err) {
    console.error("⚠️  Error initializing counters:", err.message);
  }
}

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
            regNumber, yearOfStudy, programType, staffId, designation } = req.body;

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
    // Validate phone: exactly 10 digits
    const phoneClean = phone.replace(/\D/g, "");
    if (phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits." });
    }
    // If student make sure year/program are provided and valid
    if (role === "student") {
      if (!yearOfStudy || ![1,2,3,4].includes(Number(yearOfStudy))) {
        return res.status(400).json({ message: "Invalid or missing year of study." });
      }
      if (!programType || !["degree","diploma"].includes(programType)) {
        return res.status(400).json({ message: "Invalid or missing program type." });
      }
      // Diploma students max year 3, degree students max year 4
      if (programType === "diploma" && yearOfStudy > 3) {
        return res.status(400).json({ message: "Diploma students max year is 3." });
      }
    }

    const uniqueId = genUID(role, school, department);

    const user = await User.create({
      uniqueId, role, firstName, lastName, email, phone, password,
      school: school || null,
      department: department || null,
      unitGroup: unitGroup || null,
      unitName: unitName || null,
      regNumber: regNumber || null,
      yearOfStudy: yearOfStudy || null,
      programType: programType || null,
      staffId: staffId || null,
      designation: designation || "",
    });

    const token = signToken(user._id);

    // fire a real-time event so administrators currently connected see the new
    // account immediately.  We broadcast to the school's room and to the
    // department room if applicable; client-side will filter by its own scope.
    const io = req.app?.locals?.io;
    if (io) {
      const payload = { ...user.toObject(), password: undefined };
      io.to(`school:${user.school}`).emit("user-added", payload);
      if (user.department) io.to(`dept:${user.department}`).emit("user-added", payload);
    }

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
    if (user.isSuspended) return res.status(403).json({ message: "Your account has been suspended by an administrator for malpractice." });

    const token = signToken(user._id);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// Export for server initialization
exports.initializeCounters = initializeCounters;
