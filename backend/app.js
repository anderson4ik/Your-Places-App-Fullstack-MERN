const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-errors");

const app = express();

// parse any incoming requests body and extract any JSON data which is in there,
// convert it to regular Javascript data structures like objects and arrays
app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

//CORS policy, to allow our client to communicate with server we should to set couple headers to response from server
// means the server on another port
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes); // only requiests that starts from '/api/places/...', not exect path

app.use("/api/users", usersRoutes); // only requiests that starts from '/api/users/...', not exect path

// handling errors for unsupported
app.use((req, res, next) => {
  const error = new HttpError("Could not found this route.", 404);
  throw error;
});

// special middleware function with 4 parammeters recognaized by express as a "special"
// error handling middleware for routes that are supported
app.use((error, req, res, next) => {
  // deleting the image file if we get an error by sign up
  if (req.file) {
    fs.unlink(req.file.path, (err) => console.log(err));
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bvqw4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
  )
  .then(() => {
    console.log("Database is connected... ");
    app.listen(process.env.PORT || 5000, (error) => {
      // use first argument if port provided by environment, instead use default port 5000
      if (error) {
        console.log("Error: " + error);
      } else {
        console.log("Server is RUN on port: 5000");
      }
    });
  })
  .catch((err) => {
    console.log(err);
  });
