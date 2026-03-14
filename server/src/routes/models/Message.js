const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderUid:  String,
    senderName: String,
    senderRole: String,
    isAnonymous:{ type: Boolean, default: false },
    room:       { type: String, required: true },  // e.g. "dept:CIN" | "school:SAT"
    message:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Index for fast room queries
messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
