const express = require("express");
const {
  getComplaints, createComplaint, updateStatus,
  addReply, addAdminNote, deleteComplaint,
} = require("../controllers/complaintsController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/",    getComplaints);
router.post("/",   createComplaint);

router.patch("/:id/status",     updateStatus);
router.post("/:id/reply",       addReply);
router.post("/:id/admin-note",  addAdminNote);
router.delete("/:id",           restrictTo("school_admin","dept_admin"), deleteComplaint);

module.exports = router;
