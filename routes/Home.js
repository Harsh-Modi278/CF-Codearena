const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Get Home page
router.get("/", (req, res) => {
  res.render("userForm");
});

// Post Home page
router.post("/", (req, res) => {
  if (!req.body.isuser) {
    req.flash("error_msg", "Please enter correct cf handle");
    res.json({ redirect: "/" });
  } else {
    var token = jwt.sign({ handle: req.body.user }, process.env.JWT_key);
    req.flash("success_msg", "Entered Successfully");
    res.json({ redirect: `/rooms`, token: token });
  }
});

module.exports = router;
