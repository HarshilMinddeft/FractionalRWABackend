const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  propertyId :{
    type: String,
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },
  propertyPrice: {
    type: Number,
    required: true,
  },
  propertySize: {
    type: Number,
    required: true,
  },
  propertyOwnerWallet: {
    type: String,
    required: true,
  },
  propertyFeatures: {
    type: String,
    required: true,
  },
  offringDetailes: {
    type: String,
    required: true,
  },
  propertyDetailes: {
    type: String,
    required: true,
  },
  propertyManagement: {
    type: String,
    required: true,
  },
  locationDetailes: {
    type: String,
    required: true,
  },
  propertyDocuments: {
    type: [String],
    required: true,
  },
  propertyImages: {
    type: [String],
    required: true,
  },
  propertyThumbImages: {
    type: [String],
    required: true,
  },
  active: {
     type: Boolean,
     default: true 
  }
});

module.exports = mongoose.model("Property", propertySchema);