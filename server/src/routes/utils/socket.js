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

    // Handle chat message
    socket.on("send_message", async ({ room, message, isAnonymous }) => {
      if (!rooms.includes(room)) return; // scope guard
      try {
        const msg = await Message.create({
          sender:      user._id,
          senderUid:   user.uniqueId,
          senderName:  `${user.firstName} ${user.lastName}`,
          senderRole:  user.role,
          isAnonymous: !!isAnonymous,
          room,
          message,
        });
        io.to(room).emit("new_message", {
          ...msg.toObject(),
          sender: { _id: user._id, firstName: isAnonymous ? "Anonymous" : user.firstName, lastName: isAnonymous ? "" : user.lastName, uniqueId: user.uniqueId, role: user.role },
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌  ${user.uniqueId} disconnected`);
    });
  });
};
