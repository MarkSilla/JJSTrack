import mongoose from "mongoose";

const inventoryActivityBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      trim: true,
      default: "",
    },
    batchCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    receivedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const inventoryUsageContextSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      trim: true,
      default: "",
    },
    orderDisplayId: {
      type: String,
      trim: true,
      default: "",
    },
    orderLabel: {
      type: String,
      trim: true,
      default: "",
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    serviceType: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

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
    batchBreakdown: {
      type: [inventoryActivityBatchSchema],
      default: [],
    },
    usageContext: {
      type: inventoryUsageContextSchema,
      default: () => ({}),
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

inventoryActivitySchema.index({ createdAt: -1 });

export default mongoose.model("InventoryActivity", inventoryActivitySchema);
