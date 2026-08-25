const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    refId: {
      type: String,
      required: true,
      unique: true,
    },
    userWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    kycActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
