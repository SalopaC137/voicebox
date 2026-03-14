const express = require("express");
const { register, login, getMe, verifyEmail, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me",        protect, getMe);

module.exports = router;
