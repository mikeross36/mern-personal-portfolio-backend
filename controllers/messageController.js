"use strict";
const Message = require("../models/messageModel");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

exports.getAllMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find();
  if (!messages) {
    return res.status(404).json({ message: "Messages not found!" });
  }
  return res.status(200).json(messages);
});

exports.getChatMessage = asyncHandler(async (req, res) => {
  const message = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name email photo")
    .populate("chat");

  if (!message) {
    return res.status(404).json({ message: "Messages not found!" });
  }
  return res.status(200).json(message);
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    return res
      .status(400)
      .json({ message: "Cannot send message! Invalid data passed!" });
  }
  await setMessage();

  async function setMessage() {
    const newMessage = {
      sender: req.user._id,
      content: content,
      chat: chatId,
    };
    try {
      let message = await Message.create(newMessage);
      message = await message.populate("sender", "name photo");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.users",
        select: "name email photo",
      });
      await Chat.findByIdAndUpdate(req.body.chatId, {
        latestMessage: message,
      });
      return res.status(200).json(message);
    } catch (err) {
      return res.status(400).json(err.message);
    }
  }
});
