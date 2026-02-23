import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Service', 'Custom', 'Repair'],
    default: 'Service',
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
  },
  addOn: {
    type: String,
  },
  addOnPrice: {
    type: Number,
    default: 0,
  },
});

const orderStepSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  done: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  item: {
    type: String,
    required: true,
  },
  customer: {
    type: String,
  },
  date: {
    type: String,
    required: true,
  },
  estimatedCompletion: {
    type: String,
  },
  serviceType: {
    type: String,
    enum: ['Custom', 'Repair', 'Team Jersey', 'Service'],
    default: 'Service',
  },
  assignedTailor: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  steps: [orderStepSchema],
  players: [{
    name: String,
    number: String,
    size: String,
    hasPocketShorts: Boolean,
  }],
  notes: {
    type: String,
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

// Auto-generate order ID before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    const year = new Date().getFullYear();
    this.orderId = `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Order', orderSchema);
