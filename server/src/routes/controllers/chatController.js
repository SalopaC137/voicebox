const Message = require("../models/Message");

// GET /api/chat/messages?room=dept:CIN
exports.getMessages = async (req, res) => {
  try {
    const { room } = req.query;
    if (!room) return res.status(400).json({ message: "room query param required." });

    // Scope guard: users can only read rooms they belong to
    const allowed = allowedRooms(req.user);
    if (!allowed.includes(room)) return res.status(403).json({ message: "Room not in your scope." });

    const messages = await Message.find({ room })
      .populate("sender", "firstName lastName uniqueId role")
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/messages  (fallback REST — real-time via Socket.io)
exports.postMessage = async (req, res) => {
  try {
    const { room, message, isAnonymous } = req.body;
    const allowed = allowedRooms(req.user);
    if (!allowed.includes(room)) return res.status(403).json({ message: "Room not in your scope." });

    const msg = await Message.create({
      sender:      req.user._id,
      senderUid:   req.user.uniqueId,
      senderName:  `${req.user.firstName} ${req.user.lastName}`,
      senderRole:  req.user.role,
      isAnonymous: !!isAnonymous,
      room,
      message,
    });
    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: rooms a user is allowed to access
function allowedRooms(user) {
  const { role, school, department } = user;
  if (role === "school_admin") {
    const { SCHOOLS } = require("../utils/constants");
    const schoolDepts = SCHOOLS.find(s => s.code === school)?.departments || [];
    return [
      `school:${school}`,
      ...schoolDepts.map(d => `dept:${d.code}`),
    ];
  }
  if (role === "dept_admin") return [`dept:${department}`, `school:${school}`];
  if (role === "staff")      return [`dept:${department}`];
  if (role === "student")    return [`dept:${department}`];
  return [];
}

module.exports.allowedRooms = allowedRooms;
