import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: String,
  number: String,
  size: String,
  hasPocketShorts: {
    type: Boolean,
    default: false,
  },
});

const bookingItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  type: { type: String, enum: ['Service', 'Custom', 'Repair'], default: 'Service' },
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  size: String,
  addOn: String,
  addOnPrice: { type: Number, default: 0 },
});

// ✅ Same step schema as orderModel
const bookingStepSchema = new mongoose.Schema({
  label:  { type: String, required: true },
  done:   { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  date:   String,
  time:   String,
});

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  bookingType: {
    type: String,
    enum: ['repair', 'jersey', 'organizational'],
    required: true,
  },
  service: {
    type: String,
    required: true,
  },

  // ✅ Steps — same order as orderModel so icons work
  steps: {
    type: [bookingStepSchema],
    default: () => [
      { label: 'Dropped Off', done: false, active: false },
      { label: 'Layout',      done: false, active: false },
      { label: 'Printing',    done: false, active: false },
      { label: 'Sewing',      done: false, active: false },
      { label: 'Pick-up',     done: false, active: false },
    ],
  },

  // Repair specific
  selectedOptions: [{
    name: String,
    price: Number,
    quantity: Number,
  }],
  repairDescription: String,
  photos: [String],

  // Team Jersey specific
  teamName: String,
  players: [playerSchema],
  designFile: String,
  driveLink: String,

  // Organizational specific
  orgName: String,
  members: [playerSchema],
  orgDesignFile: String,
  orgDriveLink: String,

  // Contact details
  contact: {
    fullName: String,
    phone: String,
    email: String,
    facebook: String,
    address: String,
    city: String,
  },

  // Pickup details
  pickupDate: String,
  pickupSlot: String,

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
  },

  notes: String,
  adminNotes: String,
},
{
  // ✅ timestamps:true replaces manual createdAt/updatedAt
  timestamps: true,
});

export default mongoose.model('Booking', bookingSchema);