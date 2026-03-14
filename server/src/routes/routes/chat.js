const express = require("express");
const { getMessages, postMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/messages",  getMessages);
router.post("/messages", postMessage);

module.exports = router;
