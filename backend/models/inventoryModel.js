import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    max: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
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
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);
