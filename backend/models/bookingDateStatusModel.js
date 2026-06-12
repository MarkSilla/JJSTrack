import mongoose from 'mongoose';

const bookingDateStatusSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    status: {
      type: String,
      enum: ['full_slots', 'holiday', 'closed', null],
      default: null,
      required: false,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    manualRepairBooked: {
      type: Number,
      default: null,
      min: 0,
      max: 7,
    },
    manualJerseyOrgBooked: {
      type: Number,
      default: null,
      min: 0,
      max: 3,
    },
    updatedBy: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const BookingDateStatus = mongoose.model('BookingDateStatus', bookingDateStatusSchema);

export default BookingDateStatus;
