const express = require("express");
const { check } = require("express-validator");

const {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-uploade");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// Get a specific place by place id(pid)
router.get("/:pid", getPlaceById);

// Retrieve list of all places for a given user id (uid)
router.get("/user/:uid", getPlacesByUserId);

// middleware for checking auth, all routes before this checking are free connected by any user
router.use(checkAuth);

// Creating a new place
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  createPlace
);

// Updating place by pid
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  updatePlace
);

// Delete place by pid
router.delete("/:pid", deletePlace);

module.exports = router;
