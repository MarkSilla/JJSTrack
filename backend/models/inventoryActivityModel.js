import mongoose from "mongoose";

const inventoryActivitySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    inventoryName: {
      type: String,
      required: true,
      trim: true,
    },
    inventorySku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      trim: true,
    },
    actionType: {
      type: String,
      enum: ["create", "increase", "decrease", "update", "archive", "restore"],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "",
    },
    previousStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    newStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    performedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    performedByName: {
      type: String,
      trim: true,
      default: "System",
    },
    performedByRole: {
      type: String,
      enum: ["admin", "staff", "user", "system"],
      default: "system",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

inventoryActivitySchema.index({ createdAt: -1 });

export default mongoose.model("InventoryActivity", inventoryActivitySchema);
