import crypto from "crypto";
import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  nickname: String,
  surname: String,
  firstName: String,
  number: String,
  jerseySize: String,
  shortSize: String,
  pockets: {
    type: Boolean,
    default: false,
  },
  productType: String,
  addOns: {
    type: [String],
    default: [],
  },
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
  notes: String,
});

// ✅ Same step schema as orderModel
const bookingStepSchema = new mongoose.Schema({
  label:  { type: String, required: true },
  done:   { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  date:   String,
  time:   String,
  worker: String,
});

const staffAssignmentsSchema = new mongoose.Schema({
  tailor: { type: String, default: '' },
  presser: { type: String, default: '' },
  layoutArtist: { type: String, default: '' },
}, { _id: false });

const formatBookingDateSegment = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const createRandomSegment = (length = 6) =>
  crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();

export const generateUniqueBookingId = async (BookingModel) => {
  const Model = BookingModel || mongoose.models.Booking;

  if (!Model) {
    throw new Error('Booking model is not initialized');
  }

  const dateSegment = formatBookingDateSegment();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `ORD-${dateSegment}-${createRandomSegment(6)}`;
    const existingBooking = await Model.exists({ bookingId: candidate });

    if (!existingBooking) {
      return candidate;
    }
  }

  throw new Error('Failed to generate a unique bookingId');
};

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    immutable: true,
  },
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


  steps: {
    type: [bookingStepSchema],
    default: [],
  },

  // Repair specific
  selectedOptions: [{
    name: String,
    price: Number,
    quantity: Number,
    notes: String,
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

  // Invoice items with pricing
  items: [bookingItemSchema],

  // Total price for the booking
  totalPrice: {
    type: Number,
    default: 0,
  },

  // Pickup details  
  pickupDate: String,
  pickupSlot: String,

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Released', 'Cancelled'],
    default: 'Pending',
  },

  // Archive tracking
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedAt: Date,
  archivedBy: String,

  notes: String,
  adminNotes: String,
  assignedTailor: String,
  staffAssignments: {
    type: staffAssignmentsSchema,
    default: () => ({
      tailor: '',
      presser: '',
      layoutArtist: '',
    }),
  },

  // QR Code and pickup tracking
  qrCode: String,
  isPickedUp: {
    type: Boolean,
    default: false,
  },
  pickedUpAt: Date,
  paid: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
},
{
  timestamps: true,
});

bookingSchema.pre('save', async function preSave() {
  if (!this.bookingId) {
    this.bookingId = await generateUniqueBookingId(this.constructor);
  }

  // Initialize steps based on bookingType if not already set
  if (!this.steps || this.steps.length === 0) {
    if (this.bookingType === 'repair') {
      this.steps = [
        { label: 'Dropped Off', done: false, active: false },
        { label: 'Sewing',      done: false, active: false },
        { label: 'Pick-up',     done: false, active: false },
      ];
    } else if (this.bookingType === 'jersey' || this.bookingType === 'organizational') {
      this.steps = [
        { label: 'Dropped Off', done: false, active: false },
        { label: 'Layout',      done: false, active: false },
        { label: 'Printing',    done: false, active: false },
        { label: 'Pressing',    done: false, active: false },
        { label: 'Sewing',      done: false, active: false },
        { label: 'Pick-up',     done: false, active: false },
      ];
    }
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
