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
  label:  { type: String, required: true },
  done:   { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  date:   String,
  time:   String,
});

const orderSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  orderId:  { type: String, required: true, unique: true },
  item:     { type: String, required: true },
  customer: String,
  date:     { type: String, required: true },
  estimatedCompletion: String,
  serviceType: {
    type: String,
    enum: ['Custom', 'Repair', 'Team Jersey', 'Service'],
    default: 'Service',
  },
  assignedTailor: String,
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
  },

  steps: {
    type: [orderStepSchema],
    default: () => [
      { label: 'Dropped Off', done: false, active: false },
      { label: 'Layout',      done: false, active: false },
      { label: 'Printing',    done: false, active: false },
      { label: 'Sewing',      done: false, active: false },
      { label: 'Pick-up',     done: false, active: false },
    ],
  },

  players: [{
    name: String, number: String, size: String, hasPocketShorts: Boolean,
  }],
  notes: String,
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    const year  = new Date().getFullYear();
    this.orderId = `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);