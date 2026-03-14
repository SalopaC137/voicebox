const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderUid:  String,
    senderName: String,
    senderRole: String,
    senderDesignation: String,
    message:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const adminNoteSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderUid:  String,
    senderName: String,
    message:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    submittedBy:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submitterUid:       String,
    isAnonymous:        { type: Boolean, default: false },
    type:               { type: String, enum: ["complaint","suggestion"], default: "complaint" },
    title:              { type: String, required: true, trim: true },
    description:        { type: String, required: true, trim: true },
    category:           { type: String, enum: ["Academic","Infrastructure","Welfare","Administration","Finance","Other"], default: "Academic" },
    priority:           { type: String, enum: ["low","medium","high","urgent"], default: "medium" },
    status:             { type: String, enum: ["open","in-progress","resolved"], default: "open" },
    // Target
    targetSchool:       String,
    targetDept:         String,
    targetLecturerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetLecturerUid:  String,
    // Replies & admin notes
    replies:            [replySchema],
    adminNotes:         [adminNoteSchema],
    readBy:             [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // Track who has read this complaint
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
