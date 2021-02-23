const fs = require("fs");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-errors");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

// Get a specific place by place id(pid)
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: p1}

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, couldn't find the place.",
      500
    );
    return next(error); // to stop execution of code because of error!
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id!",
      404
    );
    return next(error); // we can to use "throw" if code only synchronous, but not in this case
  }

  res.json({ place: place.toObject({ getters: true }) }); // => {place} => {place: place}
  // we use here method "toObject" to convert mongoose object to plain javascript object
  // and option "getters: true" to convert object _id of mongoose to property id: string
};

// Retrieve list of all places for a given user id (uid)
const getPlacesByUserId = async (req, res, next) => {
  // the order of middlewares is very important!
  const userId = req.params.uid; // {uid: u1}

  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, couldn't find the places by user id.",
      500
    );
    return next(error); // to stop execution of code because of error!
  }

  if (!places || places.length === 0) {
    const error = new HttpError(
      "Could not find a place for the provided user id!",
      404
    );
    return next(error); // we have to use "next" if code is asynchronous
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
    // we use here method "toObject" to convert mongoose object to plain javascript object
    // and option "getters: true" to convert object _id of mongoose to property id: string
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      // using return to stop execution of function, because "next" don't stop the execution!
      new HttpError("Invalid inputs passed, please check your data.", 422)
    ); // use next because it is async function
  }

  const { title, description, address } = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error); // to stop execution of code because of error!
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    // Executing multiple operations in db which are not directly related to each other.
    // Using sessions and transitions, if one of these operations are failed we want to make sure to undo all operations!
    // When we use this method it is din't create collections automatically in db, you should create it manually.
    const session = await mongoose.startSession(); // creating sessions, build-in method of mongoose
    session.startTransaction();
    await createdPlace.save({ session });
    user.places.push(createdPlace); // push only id of createdPlace
    await user.save({ session }); // saving updated user
    await session.commitTransaction(); // commit - if only all operations are successful it make changes in db!
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error); // to stop execution of code because of error!
  }

  res.status(201).json({ place: createdPlace });
};

// updating place by pid
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data.",
      422
    );
    return next(error);
  }

  const placeId = req.params.pid; // { pid: p1}
  const { title, description } = req.body;

  let updatedPlace;

  try {
    updatedPlace = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place!",
      500
    );
    return next(error);
  }

  if (updatedPlace.creator.toString() !== req.userData.userId) {
    //updatedplace - it is a mongoose object of place,
    // creator - it is mongoose object of user id. We must convert creator to string
    const error = new HttpError("You are not allowed to edit this place!", 401);
    return next(error);
  }

  updatedPlace.title = title;
  updatedPlace.description = description;

  try {
    await updatedPlace.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place!",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
  // we use here method "toObject" to convert mongoose object to plain javascript object
  // and option "getters: true" to convert object _id of mongoose to property id: string
};

// deliting place by pid
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: p1}

  let deletedPlace;

  try {
    deletedPlace = await Place.findById(placeId).populate("creator");
    // method "populate" lets you reference documents in other collections. Population is the process of
    // automatically replacing the specified paths in the document with document(s) from other collection(s).
    // we can do it, because of reference that was created in models of user and place
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place!",
      500
    );
    return next(error);
  }

  if (!deletedPlace) {
    const error = new HttpError(
      "Could not find a place for the provided id!",
      404
    );
    return next(error);
  }

  if (deletedPlace.creator.id !== req.userData.userId) {
    // deletedPlace.creator - it is mongoose object of user, how is creator of the place. We didn't use method toString(), because id getter gives us id as a string.
    const error = new HttpError(
      "You are not allowed to delete this place!",
      401
    );
    return next(error);
  }

  const imagePath = deletedPlace.image;

  try {
    // Executing multiple operations in db which are not directly related to each other.
    // Using sessions and transitions, if one of these operations are failed we want to make sure to undo all operations!
    // When we use this method it is din't create collections automatically in db, you should create it manually.
    const session = await mongoose.startSession(); // creating sessions, build-in method of mongoose
    session.startTransaction();
    await deletedPlace.remove({ session });
    deletedPlace.creator.places.pull(deletedPlace); // pull(delete) only id of deletedPlace from array of places
    // method "populate" give as opportunity to get document "user" through "deletedPlace.creator"
    await deletedPlace.creator.save({ session }); // saving updated user
    await session.commitTransaction(); // commit - if only all operations are successful it make changes in db!
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place!",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => console.log(err)); // deleting the image file from server

  res.status(202).json({ message: "Place was deleted, successfully." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
