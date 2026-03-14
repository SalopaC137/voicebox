const express = require("express");
const { getUsers, suspendUser } = require("../controllers/usersController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.use(restrictTo("school_admin","dept_admin"));

router.get("/",              getUsers);
router.patch("/:id/suspend", suspendUser);

module.exports = router;
