"use strict";
const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authController = require("../controllers/authController");

router.use(authController.tokenProtect);

router.get("/", messageController.getAllMessages);
router.get("/:chatId", messageController.getChatMessage);
router.post("/send-message", messageController.sendMessage);

module.exports = router;
