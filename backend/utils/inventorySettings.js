import InventorySettings from "../models/inventorySettingsModel.js";

export const DEFAULT_INVENTORY_THRESHOLDS = {
  pcs: 5,
  yards: 5,
  meters: 5,
};

const UNIT_ALIASES = {
  pc: "pcs",
  pcs: "pcs",
  piece: "pcs",
  pieces: "pcs",
  yard: "yards",
  yards: "yards",
  yd: "yards",
  yds: "yards",
  meter: "meters",
  meters: "meters",
  m: "meters",
};

export const normalizeInventoryUnitKey = (unit = "") => {
  const normalizedUnit = String(unit || "").trim().toLowerCase();
  return UNIT_ALIASES[normalizedUnit] || normalizedUnit || "pcs";
};

export const normalizeInventoryThresholds = (thresholds = {}) => ({
  pcs: Math.max(0, Number(thresholds?.pcs) || 0),
  yards: Math.max(0, Number(thresholds?.yards) || 0),
  meters: Math.max(0, Number(thresholds?.meters) || 0),
});

export const resolveInventoryUnitThreshold = (unit = "", thresholds = {}) => {
  const normalizedThresholds = {
    ...DEFAULT_INVENTORY_THRESHOLDS,
    ...normalizeInventoryThresholds(thresholds),
  };
  const unitKey = normalizeInventoryUnitKey(unit);
  return normalizedThresholds[unitKey] ?? DEFAULT_INVENTORY_THRESHOLDS.pcs;
};

export const getInventoryStockSettings = async () => {
  const settings = await InventorySettings.findOne().lean();

  return {
    thresholds: settings?.thresholds
      ? {
          ...DEFAULT_INVENTORY_THRESHOLDS,
          ...normalizeInventoryThresholds(settings.thresholds),
        }
      : { ...DEFAULT_INVENTORY_THRESHOLDS },
  };
};

export const saveInventoryStockSettings = async (settingsInput = {}) => {
  const normalizedThresholds = normalizeInventoryThresholds(
    settingsInput?.thresholds ?? settingsInput
  );

  const settings = await InventorySettings.findOneAndUpdate(
    {},
    {
      $set: {
        thresholds: normalizedThresholds,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return {
    thresholds: settings?.thresholds
      ? {
          ...DEFAULT_INVENTORY_THRESHOLDS,
          ...normalizeInventoryThresholds(settings.thresholds),
        }
      : { ...DEFAULT_INVENTORY_THRESHOLDS, ...normalizedThresholds },
  };
};
