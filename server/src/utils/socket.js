const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Message = require("../models/Message");
const { allowedRooms } = require("../controllers/chatController");

module.exports = function registerSocket(io) {
  // Authenticate socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select("-password");
      if (!socket.user || socket.user.isSuspended) return next(new Error("Unauthorized."));
      next();
    } catch {
      next(new Error("Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌  ${user.firstName} ${user.lastName} (${user.uniqueId}) connected`);

    // Join allowed rooms automatically
    const rooms = allowedRooms(user);
    rooms.forEach((room) => socket.join(room));

    // Allow dynamic room joining
    socket.on("join-room", ({ room }) => {
      if (rooms.includes(room)) {
        socket.join(room);
        console.log(`✓ ${user.uniqueId} joined ${room}`);
      }
    });

    // Allow user-specific room
    socket.on("join-user", ({ userId }) => {
      if (String(user._id) === String(userId)) {
        socket.join(`user:${user._id}`);
        console.log(`✓ ${user.uniqueId} joined personal room`);
      }
    });

    // Handle chat message (text or voice)
    socket.on("send_message", async ({ room, message, isAnonymous, isVoice, audioData, audioDuration }) => {
      if (!rooms.includes(room)) return; // scope guard
      try {
        const msg = await Message.create({
          sender:      user._id,
          senderUid:   user.uniqueId,
          senderFirstName: user.firstName,
          senderLastName:  user.lastName,
          senderRole:  user.role,
          isAnonymous: !!isAnonymous,
          room,
          message:     isVoice ? "🎤 Voice message" : (message || ""),
          isVoice:     !!isVoice,
          audioData:   isVoice ? audioData : null,
          audioDuration: isVoice ? audioDuration : 0,
        });
        io.to(room).emit("new_message", msg.toObject());
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌  ${user.uniqueId} disconnected`);
    });
  });
};
