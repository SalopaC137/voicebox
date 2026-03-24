const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  saveNotificationId,
} = require("../controllers/notificationsController");

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.post("/save-notification-id", saveNotificationId);
router.patch("/:id/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);

module.exports = router;