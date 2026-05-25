import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    enum: ['repair', 'jersey', 'organizational'],
    required: true,
    unique: true,
  },
  baseFee: {
    type: Number,
    default: 0,
  },
  basePerPlayer: {
    type: Number,
    default: 0,
  },
  basePerItem: {
    type: Number,
    default: 0,
  },
  pocketPrice: {
    type: Number,
    default: 0,
  },
  repairOptions: {
    type: Map,
    of: Number,
    default: {},
  },
  jerseyProducts: {
    type: Map,
    of: Number,
    default: {},
  },
  jerseyAddOns: {
    type: Map,
    of: Number,
    default: {},
  },
  organizationalProducts: {
    type: Map,
    of: Number,
    default: {},
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

export default mongoose.model('Pricing', pricingSchema);
