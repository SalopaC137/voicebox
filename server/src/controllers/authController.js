const jwt  = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const { sendVerificationEmail, sendAccountDeletionCodeEmail } = require("../utils/sendEmail");
const { sendResetEmail } = require("../utils/sendResetEmail");

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

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

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
      isVerified: false,
      verificationToken,
    });

    // Do not return token yet, user needs to verify
    // const token = signToken(user._id);

    // fire a real-time event so administrators currently connected see the new
    // account immediately.  We broadcast to the school's room and to the
    // department room if applicable; client-side will filter by its own scope.
    const io = req.app?.locals?.io;
    if (io) {
      const payload = { ...user.toObject(), password: undefined };
      io.to(`school:${user.school}`).emit("user-added", payload);
      if (user.department) io.to(`dept:${user.department}`).emit("user-added", payload);
    }

    // Respond immediately — don't wait for the email
    res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });

    // Send verification email in the background
    sendVerificationEmail(user.email, verificationToken)
      .then(() => console.log("Verification email sent to:", user.email))
      .catch((emailErr) => console.error("Failed to send verification email:", emailErr));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required." });

    if (!isDbReady()) {
      return res.status(503).json({ message: "Database not ready. Please try again." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (user.isSuspended) return res.status(403).json({ message: "Your account has been suspended by an administrator for malpractice." });
    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email before logging in." });

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

// PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, regNumber, yearOfStudy, programType } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();

    if (user.role === "student" && typeof regNumber !== "undefined") {
      user.regNumber = regNumber.trim();
    }

    if (user.role === "student" && typeof yearOfStudy !== "undefined") {
      const yearNum = Number(yearOfStudy);
      if (![1, 2, 3, 4].includes(yearNum)) {
        return res.status(400).json({ message: "Year of study must be between 1 and 4." });
      }
      user.yearOfStudy = yearNum;
    }

    if (user.role === "student" && typeof programType !== "undefined") {
      if (!["degree", "diploma"].includes(programType)) {
        return res.status(400).json({ message: "Program type must be degree or diploma." });
      }
      if (programType === "diploma" && Number(user.yearOfStudy || 0) > 3) {
        return res.status(400).json({ message: "Diploma students can only be in years 1 to 3." });
      }
      user.programType = programType;
    }

    if (user.role === "student" && user.programType === "diploma" && Number(user.yearOfStudy || 0) > 3) {
      return res.status(400).json({ message: "Diploma students can only be in years 1 to 3." });
    }

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/delete-account/code
exports.requestDeleteAccountCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    user.deletionCodeHash = codeHash;
    user.deletionCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendAccountDeletionCodeEmail(user.email, code);

    res.json({ message: "Verification code sent to your email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/delete-account
exports.deleteAccount = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !/^\d{4}$/.test(String(code))) {
      return res.status(400).json({ message: "A valid 4-digit code is required." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.deletionCodeHash || !user.deletionCodeExpire || user.deletionCodeExpire < new Date()) {
      return res.status(400).json({ message: "Code expired. Request a new code." });
    }

    const incomingHash = crypto.createHash("sha256").update(String(code)).digest("hex");
    if (incomingHash !== user.deletionCodeHash) {
      return res.status(400).json({ message: "Invalid deletion code." });
    }

    await User.deleteOne({ _id: user._id });

    const io = req.app?.locals?.io;
    if (io) {
      io.to(`user:${user._id}`).emit("force-logout", {
        message: "Your account has been deleted.",
      });
    }

    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentPasswordMatches = await user.comparePassword(currentPassword);
    if (!currentPasswordMatches) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify/:token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired verification token." });
    if (user.isVerified) return res.status(400).json({ message: "Account already verified." });

    user.isVerified = true;
    user.verificationToken = undefined; // Clear token
    await user.save();

    const authToken = signToken(user._id);

    res.json({ message: "Email verified successfully.", token: authToken, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isDbReady()) {
      return res.status(503).json({ message: "Database not ready. Please try again." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 1000 * 60 * 15; // 15 minutes

    await user.save();

    const resetLink = `https://voicebox.qzz.io/reset-password/${resetToken}`;

    await sendResetEmail(user.email, resetLink);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    // Reset link is delivered to mailbox owner, so we can trust email ownership.
    user.isVerified = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export for server initialization
exports.initializeCounters = initializeCounters;
