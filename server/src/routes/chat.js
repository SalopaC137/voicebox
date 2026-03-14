const express = require("express");
const { getAllMessages, getMessages, postMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/",         getAllMessages);  // Get all messages for accessible rooms
router.get("/messages",  getMessages);     // Get messages for specific room
router.post("/messages", postMessage);

module.exports = router;
