"use strict";
const Chat = require("../models/chatModel");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

exports.createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(401).json({ message: "You are not logged in!" });
  }

  let chatExists = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: req.userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (!chatExists) {
    return res.status(404).json({ message: "Chat does not exist!" });
  }
  chatExists = await User.populate(chatExists, {
    path: "latestMessage.sender",
    select: "name email photo",
  });
  if (chatExists.length > 0) {
    return res.send(chatExists[0]);
  } else {
    await createNewChat();
  }

  async function createNewChat() {
    const chatData = {
      chatName: req.body.chatName,
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const newChat = await Chat.create(chatData);
      const currChat = await Chat.findById({ _id: newChat._id }).populate(
        "users",
        "-password"
      );
      return res.status(201).json(currChat);
    } catch (err) {
      return res.status(400).json(err.message);
    }
  }
});

exports.getUsersChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (usersChats) => {
        usersChats = await User.populate(usersChats, {
          path: "latestMessage.sender",
          select: "name email photo",
        });
        res.status(200).json(usersChats);
      });
  } catch (err) {
    res.status(404).json(err.message);
  }
});

exports.createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.groupChatName || !req.body.users) {
    res.status(400);
    throw new error("All the fields are mandatory!");
  }
  const users = JSON.parse(req.body.users);
  if (users.length < 2) {
    res.status(401);
    throw new Error("At least 2 users are required!");
  }
  users.push(req.user);
  await setGroupChat();

  async function setGroupChat() {
    try {
      const newGroupChat = await Chat.create({
        chatName: req.body.groupChatName,
        isGroupChat: true,
        users: users,
        groupAdmin: req.user,
      });
      const currGroupChat = await Chat.findById({ _id: newGroupChat._id })
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      res.status(201).json(currGroupChat);
    } catch (err) {
      res.status(400).json(err.message);
    }
  }
});

exports.renameGroupChat = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  if (!chatName) {
    res.status(400);
    throw new Error("Chat name is mandatory!");
  }
  const renamedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!renamedChat) {
    res.status(401);
    throw new Error("Cannot rename this chat!");
  }
  res.status(200).json(renamedChat);
});

exports.addUserToGroupChat = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    res.status(400);
    throw new Error("Cannot add user! Required data missing");
  }
  const addedUser = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!addedUser) {
    res.status(400);
    throw new Error("Cannot add user to the group!");
  }
  res.status(200).json(addedUser);
});

exports.removeUserFromGroupChat = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    res.status(400);
    throw new Error("Cannot remove user! Required data missing");
  }
  const removedUser = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removedUser) {
    res.status(400);
    throw new Error("Cannot remove user from group!");
  }
  res.status(200).json(removedUser);
});
