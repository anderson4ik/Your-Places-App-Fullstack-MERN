const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const placeShema = new Schema({
  title: { type: String, required: true, minlength: 2 },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // creating reference to user _id
});

module.exports = mongoose.model("Place", placeShema);
