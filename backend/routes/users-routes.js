const express = require("express");
const { check } = require("express-validator");

const {
  getAllUsers,
  createNewUser,
  loginUser,
} = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-uploade");

const router = express.Router();

// Get list of all users
router.get("/", getAllUsers);

// Creating a new user and log user in
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").isLength({ min: 2 }),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  createNewUser
);

// Login existing user
router.post(
  "/:login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  loginUser
);

module.exports = router;
