import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
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

const billToSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['Gcash', 'Cash', 'Bank Transfer', 'Credit Card'],
  },
  transactionId: {
    type: String,
  },
  paymentDate: {
    type: String,
  },
});

const discountSchema = new mongoose.Schema({
  label: {
    type: String,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  invoiceId: {
    type: String,
    required: true,
    unique: true,
  },
  teamName: {
    type: String,
  },
  date: {
    type: String,
    required: true,
  },
  dueDate: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending',
  },
  billTo: billToSchema,
  payment: paymentSchema,
  items: [invoiceItemSchema],
  taxRate: {
    type: Number,
    default: null,
  },
  discount: discountSchema,
  subtotal: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
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

// Auto-generate invoice ID before saving
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceId) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    this.invoiceId = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.qty * item.unitPrice) + ((item.addOnPrice || 0) * item.qty);
  }, 0);
  
  this.tax = this.taxRate ? this.subtotal * this.taxRate : 0;
  const discountAmount = this.discount?.amount || 0;
  this.total = this.subtotal + this.tax - discountAmount;
  
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
