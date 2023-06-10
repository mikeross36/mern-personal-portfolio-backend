"use strict";
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authController = require("../controllers/authController");

router.use(authController.tokenProtect);

router.post("/create-chat", chatController.createChat);
router.get("/", chatController.getUsersChats);
router.post("/group-chat", chatController.createGroupChat);
router.patch("/rename-chat", chatController.renameGroupChat);
router.patch("/add-user", chatController.addUserToGroupChat);
router.patch("/remove-user", chatController.removeUserFromGroupChat);

module.exports = router;
