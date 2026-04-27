const express = require("express");
const {
	register,
	login,
	getMe,
	verifyEmail,
	forgotPassword,
	resetPassword,
	updateProfile,
	changePassword,
	requestDeleteAccountCode,
	deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me",        protect, getMe);
router.patch("/profile",  protect, updateProfile);
router.patch("/password", protect, changePassword);
router.post("/delete-account/code", protect, requestDeleteAccountCode);
router.post("/delete-account", protect, deleteAccount);

module.exports = router;
