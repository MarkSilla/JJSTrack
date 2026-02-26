import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    unique: true,
    sparse: true,
  },

  fullName: {
    type: String,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
  },

  photoURL: {
    type: String,
  },

  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user",
  },

  phoneNumber: {
    type: String,
  },

  address: {
    type: String,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  verificationCode: {
    type: String,
  },

  verificationCodeExpiry: {
    type: Date,
  },

  resetCode: {
    type: String,
  },

  resetCodeExpiry: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);