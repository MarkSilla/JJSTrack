import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  type: { type: String, enum: ['Service', 'Custom', 'Repair'], default: 'Service' },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  size: String,
  addOn: String,
  addOnPrice: { type: Number, default: 0 },
});

const orderStepSchema = new mongoose.Schema({
  label: { type: String, required: true },
  done: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  date: String,
  time: String,
  worker: String,
});

const staffAssignmentsSchema = new mongoose.Schema({
  tailor: { type: String, default: '' },
  presser: { type: String, default: '' },
  layoutArtist: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  orderId: { type: String, required: true, unique: true },
  item: { type: String, required: true },
  customer: String,
  date: { type: String, required: true },
  estimatedCompletion: String,
  pickupDate: String,
  pickupSlot: String,
  serviceType: {
    type: String,
    enum: ['Custom', 'Repair', 'Team Jersey', 'Service'],
    default: 'Service',
  },
  assignedTailor: String,
  staffAssignments: {
    type: staffAssignmentsSchema,
    default: () => ({
      tailor: '',
      presser: '',
      layoutArtist: '',
    }),
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Released', 'Cancelled'],
    default: 'Pending',
  },
  isReleased: {
    type: Boolean,
    default: false,
  },
  releasedAt: Date,
  releaseProofImage: String,
  releaseNotes: String,
  paid: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
  qrCode: String,

  steps: {
    type: [orderStepSchema],
    default: () => [
      { label: 'Dropped Off', done: false, active: false },
      { label: 'Layout', done: false, active: false },
      { label: 'Printing', done: false, active: false },
      { label: 'Pressing', done: false, active: false },
      { label: 'Sewing', done: false, active: false },
      { label: 'Pick-up', done: false, active: false },
    ],
  },

  players: [{
    name: String,
    nickname: String,
    surname: String,
    firstName: String,
    number: String,
    size: String,
    jerseySize: String,
    shortSize: String,
    hasPocketShorts: Boolean,
    pockets: Boolean,
    productType: String,
    addOns: { type: [String], default: [] },
    useManualjerseySize: { type: Boolean, default: false },
    jerseyLength: String,
    jerseyBody: String,
    useManualsShortSize: { type: Boolean, default: false },
    shortHips: String,
    shortLength: String,
    useManualSize: { type: Boolean, default: false },
    manualBody: String,
    manualLength: String,
    manualSleeveLength: String,
  }],
  notes: String,
  qrCode: String,
  isReleased: { type: Boolean, default: false },
  releasedAt: Date,
  isArchived: { type: Boolean, default: false },
  archivedAt: Date,
  archivedBy: String,
  releasedBy: String,
  completedAt: Date,
}, { timestamps: true });

orderSchema.pre('save', async function preSave() {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    const year = new Date().getFullYear();
    this.orderId = `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
  }
});

export default mongoose.model('Order', orderSchema);
