import mongoose from "mongoose";

const inventorySettingsSchema = new mongoose.Schema(
  {
    thresholds: {
      pcs: {
        type: Number,
        default: 5,
        min: 0,
      },
      yards: {
        type: Number,
        default: 5,
        min: 0,
      },
      meters: {
        type: Number,
        default: 5,
        min: 0,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("InventorySettings", inventorySettingsSchema);
