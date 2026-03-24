const Notification = require("../models/Notification");
const User = require("../models/User");

// GET /api/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/:id/read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/read-all
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notifications/save-notification-id
exports.saveNotificationId = async (req, res) => {
  try {
    const { playerId } = req.body || {};
    if (!playerId || typeof playerId !== "string") {
      return res.status(400).json({ message: "playerId is required." });
    }

    await User.findByIdAndUpdate(req.user._id, { notificationId: playerId });
    return res.json({ message: "Saved" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};