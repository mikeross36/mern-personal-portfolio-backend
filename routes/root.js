"use strict";
const express = require("express");
const router = express.Router();
const path = require("path");

// regex matches only if the route starts with slash or slash index.html or full index.html
router.get("^/$|/index(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

module.exports = router;
