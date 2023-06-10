"use strict";
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendGeneratedToken = (user, req, res, statusCode) => {
  const token = generateToken(user._id);
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development" ? false : true,
    sameSite: process.env.NODE_ENV === "development" ? true : "None",
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  });
  user.password = undefined;

  res.status(statusCode).json({
    token,
    user,
  });
};

exports.registerUser = asyncHandler(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  if (!newUser) {
    return res.status(400).json({ message: "Invalid user data received!" });
  }
  sendGeneratedToken(newUser, req, res, 201);
});

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All the fields are mandatory!" });
  }
  const checkUser = async () => {
    const user = await User.findOne({ email: email });
    if (!user || !(await user.matchPassword(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }
    return user;
  };
  const user = await checkUser();
  sendGeneratedToken(user, req, res, 200);
});

exports.logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "None",
    expires: new Date(Date.now() + 1 * 1000),
  });
  res.clearCookie("jwt");
  res.status(200).json({ status: "LOGGED OUT!" });
});

exports.tokenProtect = asyncHandler(async (req, res, next) => {
  const checkToken = async () => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return res.status(401).json({ message: "You are not logged in!" });
    }
    const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    return verified;
  };

  const verified = await checkToken();

  const checkUser = async () => {
    const currUser = await User.findById(verified.id);
    if (!currUser) {
      return res.status(400).json({ message: "User not logged in!" });
    }
    if (currUser.changedPasswordAfter(verified.iat)) {
      return res
        .status(401)
        .json({ message: "Password is changed! Login again" });
    }
    return currUser;
  };
  const currUser = await checkUser();
  req.user = currUser;

  next();
});
