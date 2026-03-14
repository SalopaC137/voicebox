const express = require("express");
const { getUsers, getStaff, suspendUser } = require("../controllers/usersController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// Public staff endpoint (accessible to all authenticated users)
router.get("/staff/all", protect, getStaff);

// Admin-only endpoints
router.use(protect);
router.use(restrictTo("school_admin","dept_admin"));

router.get("/",              getUsers);
router.patch("/:id/suspend", suspendUser);

module.exports = router;
