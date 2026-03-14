const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    uniqueId:    { type: String, required: true, unique: true },
    role:        { type: String, enum: ["school_admin","dept_admin","staff","student"], required: true },
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:       { type: String, required: true },
    password:    { type: String, required: true, minlength: 8, select: false },
    designation: { type: String, default: "" },
    // Academic placement
    school:      { type: String, default: null },   // SAT | EDU | HDS | SBE
    department:  { type: String, default: null },   // CIN | MTH | BBS | …
    // Non-academic staff
    unitGroup:   { type: String, default: null },   // DIR | SUP | FRM
    unitName:    { type: String, default: null },
    // Student only
    regNumber:   { type: String, default: null },
    yearOfStudy: { type: Number, enum: [1, 2, 3, 4], default: null },  // For students: 1-4
    programType: { type: String, enum: ["degree", "diploma"], default: null }, // diploma vs degree
    course:      { type: String, default: null },  // course code (e.g. "CIN:CS")
    // optional list of course codes the user is enrolled in (e.g. "CIN:CS")
    courses:     [{ type: String }],
    // Staff only
    staffId:     { type: String, default: null },
    // Status
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password
userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);
