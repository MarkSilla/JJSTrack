import mongoose from "mongoose";

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
