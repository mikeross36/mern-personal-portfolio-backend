"use strict";
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post("/register-user", authController.registerUser);
router.post("/login-user", authController.loginUser);
router.post("/logout-user", authController.logoutUser);

router.use(authController.tokenProtect);

router.get("/", userController.getAllUsers);
router.get("/search-users", userController.searchUsers);
// router.get("/search-users/:userName", userController.searchUsers);
router.get("/user-profile", userController.getUserProfile);
router.patch("/update-user-profile", userController.updateUserProfile);
router.delete("/delete-user", userController.deleteUser);

module.exports = router;
