import mongoose from "mongoose";

const inventoryBatchSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },
    batchCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    initialQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    normalizedUnit: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["Sewing", "Fabric", "Fastener", "Tool", "Notions"],
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    initialStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStock: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "pcs",
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    batches: {
      type: [inventoryBatchSchema],
      default: [],
    },
    nextBatchSequence: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);
