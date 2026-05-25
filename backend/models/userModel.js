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
    trim: true,
  },

  address: {
    type: String,
  },

  firstName: {
    type: String,
    trim: true,
  },

  lastName: {
    type: String,
    trim: true,
  },

  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },

  employmentType: {
    type: String,
    enum: ["Full Time", "Part Time", "Contractual"],
    default: "Full Time",
  },

  position: {
    type: String,
    trim: true,
  },

  accountStatus: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active",
  },

  systemRole: {
    type: String,
    enum: ["Employee", "Manager"],
    default: "Employee",
  },

  hiredDate: {
    type: Date,
  },

  dob: {
    type: Date,
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Male",
  },

  emergencyContact: {
    name: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    contact: { type: String, trim: true, default: "" },
  },

  regionCode: {
    type: String,
    trim: true,
  },

  regionName: {
    type: String,
    trim: true,
  },

  provinceCode: {
    type: String,
    trim: true,
  },

  provinceName: {
    type: String,
    trim: true,
  },

  cityCode: {
    type: String,
    trim: true,
  },

  cityName: {
    type: String,
    trim: true,
  },

  brgyCode: {
    type: String,
    trim: true,
  },

  brgyName: {
    type: String,
    trim: true,
  },

  street: {
    type: String,
    trim: true,
  },
  
  zipCode: {
    type: String,
    trim: true,
  },

  tasks: {
    type: [String],
    default: [],
  },

  ordersCompleted: {
    type: Number,
    default: 0,
  },

  productivityScore: {
    type: Number,
    default: 0,
  },

  lastLoginAt: {
    type: Date,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

  accountDeletionToken: {
    type: String,
  },

  accountDeletionTokenExpiry: {
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

userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneNumber: { $type: "string", $gt: "" },
    },
  }
);

export default mongoose.model("User", userSchema);
