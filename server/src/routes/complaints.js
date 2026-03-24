const express = require("express");
const {
  getComplaints, createComplaint, updateStatus,
  addReply, addAdminNote, markAsRead, deleteComplaint,
} = require("../controllers/complaintsController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/",    getComplaints);
router.post("/",   createComplaint);

router.patch("/:id/status",     updateStatus);
router.patch("/:id/read",       markAsRead);
router.post("/:id/reply",       addReply);
router.post("/:id/admin-note",  addAdminNote);
router.delete("/:id",           deleteComplaint);

module.exports = router;
