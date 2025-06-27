const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId :{
    type: String,
    required: true,
  },
  refId :{
    type: String,
    required: true,
  },
  userWalletAddress:{
    type: String,
    required: true,
  },
  kycActive: {
     type: Boolean,
     default: true 
  }
});

module.exports = mongoose.model("UserModel", userSchema);