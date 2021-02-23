const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-errors");

module.exports = (req, res, next) => {
  // frontent - first send "OPTIONS" request & only after getting permission it send actual request
  // to prevent it we use if statement
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed!");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    // we got an object (payload) which has this user I.D. and which has this email
    req.userData = { userId: decodedToken.userId };
    // we add to request a property userData, all requests after this middleware will have access to userId
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed!", 403);
    return next(error);
  }
};
