const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-errors");
const User = require("../models/user");

// Get list of all users
const getAllUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password"); // getting all users without password property
  } catch (err) {
    const error = new HttpError("Fetching users failed, please try again", 500);
    return next(error);
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
    // we use here method "toObject" to convert mongoose object to plain javascript object
    // and option "getters: true" to convert object _id of mongoose to property id: string
  });
};

// Creating a new user and log user in
const createNewUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data.",
      422
    );
    return next(error);
  }

  const { name, email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signing Up is failed, please try again.", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exist already, please login instead.",
      500
    );
    return next(error);
  }

  // encrypting of the password
  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing Up failed, please try again.", 500);
    return next(error); // to stop execution of code because of error!
  }

  // creating json web token
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email }, // coding some data about user to the token
      process.env.JWT_KEY, // Private Key Secret!!!
      { expiresIn: "1h" } // time of expiration a token
    );
  } catch (err) {
    const error = new HttpError("Signing Up failed, please try again.", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

// Login existing user
const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { email, password } = req.body;

  // cheking if email exist in DB
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Logging in is failed, please try again.", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Email or password is invalid, please try again!",
      403 // Forbidden
    );
    return next(error);
  }

  // checking if password is valid
  let isValidPassword;
  try {
    isValidPassword = bcrypt.compare(password, existingUser.password); //return bollean value
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Email or password is invalid, please try again!",
      403 // Forbidden
    );
    return next(error);
  }

  // creating json web token
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email }, // coding some data about user to the token
      process.env.JWT_KEY, // Private Key Secret!!!
      { expiresIn: "1h" } // time of expiration a token
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again.", 500);
    return next(error);
  }

  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getAllUsers = getAllUsers;
exports.createNewUser = createNewUser;
exports.loginUser = loginUser;
