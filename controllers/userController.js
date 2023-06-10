"use strict";
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  if (!users) {
    return res.status(404).json({ message: "Users not found!" });
  }
  return res.status(200).json(users);
});

exports.searchUsers = asyncHandler(async (req, res) => {
  const querySearch = () => {
    return req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};
  };
  const users = await User.find(querySearch()).find({
    _id: { $ne: req.user._id },
  });
  if (!users) {
    return res.status(404).json({ message: "No search results!" });
  }
  return res.status(200).json(users);
});

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
    });
  } else {
    return res.status(404).json({ message: "User not found!" });
  }
});

exports.updateUserProfile = asyncHandler(async (req, res) => {
  if (req.body.password) {
    throw new Error("Not allowed to update password by this route!");
  }
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  const updatedProfile = await User.findByIdAndUpdate(
    req.user._id,
    filteredBody,
    { new: true }
  );
  return res.status(200).json(updatedProfile);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "User ID required!" });
  }
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const result = await user.deleteOne();
  const replay = `User ${result.name} with ID ${result._id} deleted`;
  return res.json(replay);
});
