import mongoose from "mongoose";
import Inventory from "../models/inventoryModel.js";
import InventoryActivity from "../models/inventoryActivityModel.js";
import userModel from "../models/userModel.js";
import {
  createInventoryEventNotification,
  maybeCreateInventoryNotification,
  shouldCreateInventoryRestockNotification,
} from "../utils/notificationHelpers.js";
import { broadcastInventoryChange } from "../utils/inventorySocketServer.js";
import {
  appendInventoryBatch,
  applyFifoDeduction,
  ensureBatchState,
  getInventoryBatchSummary,
  normalizeMoney,
  normalizeQuantity,
  normalizeUnit,
  previewFifoDeduction,
  serializeBatch,
} from "../utils/inventoryBatchHelpers.js";

// Helper function to normalize item names - STRICT normalization
const normalizeName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // Remove ALL spaces
    .replace(/[^a-z0-9]/g, ""); // Keep only letters and numbers (remove all special chars, accents, etc)
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatNumber = (value) => {
  const numericValue = Number(value) || 0;
  if (Number.isInteger(numericValue)) {
    return `${numericValue}`;
  }

  return numericValue.toFixed(2).replace(/\.?0+$/, "");
};

// Resolve per-item stock ceiling used for current/max tracking
const resolveStockCap = (item = {}) => {
  const cap = Math.max(
    Number(item.maxStock) || 0,
    Number(item.initialStock) || 0,
    Number(item.stock) || 0
  );
  return Number.isFinite(cap) && cap > 0 ? cap : 0;
};

const resolveInventoryAlertLevel = (item = {}) => {
  if (item?.archived) return "normal";

  const stock = Math.max(0, Number(item?.stock) || 0);
  const minStock = Math.max(0, Number(item?.minStock) || 5);

  if (stock === 0) return "outOfStock";
  if (stock < minStock) return "lowStock";
  return "normal";
};

const getActorFallback = (role) => {
  if (role === "admin") return "Admin";
  if (role === "staff") return "Staff";
  if (role === "user") return "User";
  return "System";
};

const resolveActorInfo = async (req) => {
  const fallbackRole = req?.userRole || "system";
  const fallbackName = getActorFallback(fallbackRole);

  if (!req?.userId || !mongoose.Types.ObjectId.isValid(req.userId)) {
    return {
      performedByRole: fallbackRole,
      performedByName: fallbackName,
    };
  }

  try {
    const actor = await userModel
      .findById(req.userId)
      .select("fullName firstName lastName email role")
      .lean();

    if (!actor) {
      return {
        performedByRole: fallbackRole,
        performedByName: fallbackName,
      };
    }

    const composedName = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();
    const performedByName = actor.fullName?.trim() || composedName || actor.email || fallbackName;

    return {
      performedById: actor._id,
      performedByRole: actor.role || fallbackRole,
      performedByName,
    };
  } catch (error) {
    console.error("Failed to resolve inventory actor:", error);
    return {
      performedByRole: fallbackRole,
      performedByName: fallbackName,
    };
  }
};

const formatQuantity = (amount, unit) => {
  const qty = formatNumber(amount);
  return unit ? `${qty} ${unit}` : `${qty}`;
};

const mapActivityType = (actionType) => {
  if (actionType === "create" || actionType === "increase" || actionType === "restore") {
    return "add";
  }
  if (actionType === "decrease") {
    return "dec";
  }
  if (actionType === "update") {
    return "edit";
  }
  return "warn";
};

const buildActivityText = (activity) => {
  const actorName = activity.performedByName || getActorFallback(activity.performedByRole);
  const inventoryName = activity.inventoryName || "inventory item";
  const quantity = formatQuantity(activity.amount, activity.unit);

  switch (activity.actionType) {
    case "create":
      return `${actorName} added "${inventoryName}" to inventory`;
    case "increase":
      return `${actorName} added ${quantity} to "${inventoryName}"`;
    case "decrease":
      return `${actorName} removed ${quantity} from "${inventoryName}"`;
    case "update":
      return `${actorName} updated "${inventoryName}" details`;
    case "archive":
      return `${actorName} archived "${inventoryName}"`;
    case "restore":
      return `${actorName} restored "${inventoryName}"`;
    default:
      return `${actorName} updated "${inventoryName}"`;
  }
};

const serializeActivity = (activity) => ({
  _id: activity._id,
  inventoryId: activity.inventoryId,
  inventoryName: activity.inventoryName,
  inventorySku: activity.inventorySku || "",
  category: activity.category || "",
  actionType: activity.actionType,
  type: mapActivityType(activity.actionType),
  text: buildActivityText(activity),
  amount: activity.amount,
  unit: activity.unit,
  previousStock: Math.max(0, Number(activity.previousStock) || 0),
  newStock: Math.max(0, Number(activity.newStock) || 0),
  performedByName: activity.performedByName,
  performedByRole: activity.performedByRole,
  createdAt: activity.createdAt,
  note: activity.note || "",
  totalCost: Math.max(0, Number(activity.totalCost) || 0),
  batchBreakdown: Array.isArray(activity.batchBreakdown)
    ? activity.batchBreakdown.map((entry) => ({
        batchId: entry.batchId || "",
        batchCode: entry.batchCode || "",
        quantity: Math.max(0, Number(entry.quantity) || 0),
        unitPrice: Math.max(0, Number(entry.unitPrice) || 0),
        lineCost: Math.max(0, Number(entry.lineCost) || 0),
        receivedAt: entry.receivedAt || null,
      }))
    : [],
});

const buildActivityBatchBreakdown = (entries = []) =>
  entries.map((entry) => ({
    batchId: entry.batchId || entry.id || "",
    batchCode: entry.batchCode || "",
    quantity: normalizeQuantity(entry.quantity ?? entry.willUse),
    unitPrice: normalizeMoney(entry.unitPrice),
    lineCost: normalizeMoney(entry.lineCost),
    receivedAt: entry.receivedAt ? new Date(entry.receivedAt) : undefined,
  }));

const buildFifoNote = (breakdown = []) => {
  if (!Array.isArray(breakdown) || breakdown.length === 0) {
    return "";
  }

  return breakdown
    .map((entry) => `${entry.batchCode || "BATCH"}:${formatNumber(entry.quantity ?? entry.willUse)}`)
    .join(", ");
};

const hydrateInventoryForSave = (inventory) => {
  if (!inventory) return getInventoryBatchSummary();

  if (inventory.name) {
    inventory.normalizedName = normalizeName(inventory.name);
  }
  if (inventory.unit != null) {
    inventory.normalizedUnit = normalizeUnit(inventory.unit);
  }
  inventory.unitPrice = normalizeMoney(inventory.unitPrice);

  const summary = ensureBatchState(inventory);
  inventory.stock = summary.stock;
  inventory.maxStock = Math.max(resolveStockCap(inventory), summary.stock);

  return summary;
};

const serializeInventory = (inventory) => {
  const source = inventory?.toObject ? inventory.toObject() : { ...inventory };
  const summary = getInventoryBatchSummary(source);

  return {
    ...source,
    normalizedUnit: normalizeUnit(source.unit),
    stock: summary.stock,
    unitPrice: normalizeMoney(source.unitPrice),
    batchCount: summary.batchCount,
    currentStockValue: summary.currentStockValue,
    averageUnitPrice: summary.averageUnitPrice,
    oldestBatchDate: summary.oldestBatch?.receivedAt
      ? new Date(summary.oldestBatch.receivedAt).toISOString()
      : null,
    newestBatchDate: summary.newestBatch?.receivedAt
      ? new Date(summary.newestBatch.receivedAt).toISOString()
      : null,
    batches: summary.batches.map(serializeBatch),
  };
};

const notifyInventoryClients = ({ actionType, inventory }) => {
  if (!inventory?._id) return;

  broadcastInventoryChange({
    actionType,
    inventoryId: inventory._id.toString(),
    stock: Math.max(0, Number(inventory.stock) || 0),
    minStock: Math.max(0, Number(inventory.minStock) || 5),
    unit: inventory.unit || "",
    name: inventory.name || "",
    sku: inventory.sku || "",
    category: inventory.category || "",
    alertLevel: resolveInventoryAlertLevel(inventory),
    archived: Boolean(inventory.archived),
    updatedAt: new Date().toISOString(),
  });
};

const logInventoryActivity = async ({
  req,
  inventory,
  actionType,
  amount = 0,
  previousStock = 0,
  newStock = 0,
  note = "",
  batchBreakdown = [],
  totalCost = 0,
}) => {
  if (!inventory?._id || !actionType) return;

  try {
    const actor = await resolveActorInfo(req);

    await InventoryActivity.create({
      inventoryId: inventory._id,
      inventoryName: inventory.name,
      inventorySku: inventory.sku,
      category: inventory.category,
      actionType,
      amount: Number(amount) || 0,
      unit: inventory.unit || "",
      previousStock: Math.max(0, Number(previousStock) || 0),
      newStock: Math.max(0, Number(newStock ?? inventory.stock) || 0),
      performedById: actor.performedById,
      performedByName: actor.performedByName,
      performedByRole: actor.performedByRole,
      note,
      batchBreakdown: buildActivityBatchBreakdown(batchBreakdown),
      totalCost: normalizeMoney(totalCost),
    });
  } catch (error) {
    console.error("Failed to log inventory activity:", error);
  }
};

// Helper function to generate SKU
const generateSKU = async (category) => {
  // Get category abbreviation (first 3 letters, uppercase)
  const categoryAbbr = category.substring(0, 3).toUpperCase();
  
  // Find the highest number for this category
  const lastItem = await Inventory.findOne({ category })
    .sort({ sku: -1 })
    .lean();
  
  let nextNumber = 1;
  if (lastItem && lastItem.sku) {
    // Extract number from existing SKU (e.g., "SEW-001" → 1)
    const match = lastItem.sku.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }
  
  // Format: "SEW-001", "SEW-002", etc.
  return `${categoryAbbr}-${String(nextNumber).padStart(3, "0")}`;
};

export const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json(inventory.map(serializeInventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryActivity = async (req, res) => {
  try {
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 500)
      : 20;

    const activities = await InventoryActivity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json(activities.map(serializeActivity));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory by ID
export const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.status(200).json(serializeInventory(inventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const previewInventoryFifo = async (req, res) => {
  try {
    const requestedQuantity = normalizeQuantity(
      req.query.quantity ?? req.body?.quantity
    );

    if (requestedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const preview = previewFifoDeduction(inventory, requestedQuantity);

    res.status(200).json({
      inventoryId: inventory._id,
      itemName: inventory.name,
      unit: inventory.unit || "",
      ...preview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory by category
export const getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const inventory = await Inventory.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(inventory.map(serializeInventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new inventory item or update if exists
export const createInventory = async (req, res) => {
  try {
    const {
      name,
      category,
      stock,
      minStock,
      unit,
      description,
      supplier,
      unitPrice,
      receivedAt,
    } = req.body;

    // Validation
    if (!name || !category || !unit) {
      return res.status(400).json({ message: "Please provide required fields: name, category, unit" });
    }

    const normalizedName = normalizeName(name);
    const normalizedUnit = normalizeUnit(unit);
    const unitMatcher = new RegExp(`^${escapeRegExp(String(unit).trim())}$`, "i");
    const stockValue = normalizeQuantity(stock);
    const hasMinStock = minStock != null && minStock !== "";
    const hasUnitPrice = unitPrice != null && unitPrice !== "";
    const minStockValue = hasMinStock ? Math.max(0, Number(minStock) || 0) : 5;
    const unitPriceValue = hasUnitPrice ? normalizeMoney(unitPrice) : 0;

    // Check if item already exists by normalizedName + normalizedUnit
    const existingItem = await Inventory.findOne({
      normalizedName,
      archived: false,
      $or: [
        { normalizedUnit },
        { unit: unitMatcher },
      ],
    });

    if (existingItem) {
      const previousSummary = hydrateInventoryForSave(existingItem);
      const previousStock = previousSummary.stock;
      const previousMinStock = existingItem.minStock;

      existingItem.name = name.trim();
      existingItem.category = category;
      existingItem.unit = unit;
      existingItem.normalizedName = normalizedName;
      existingItem.normalizedUnit = normalizedUnit;
      if (hasMinStock) existingItem.minStock = minStockValue;
      existingItem.description = description ?? existingItem.description ?? "";
      existingItem.supplier = supplier ?? existingItem.supplier ?? "";
      if (hasUnitPrice) {
        existingItem.unitPrice = unitPriceValue;
      } else {
        existingItem.unitPrice = normalizeMoney(existingItem.unitPrice);
      }

      let createdBatch = null;
      if (stockValue > 0) {
        createdBatch = appendInventoryBatch(existingItem, {
          quantity: stockValue,
          unitPrice: hasUnitPrice ? unitPriceValue : normalizeMoney(existingItem.unitPrice),
          receivedAt,
          supplier: supplier ?? existingItem.supplier ?? "",
          note: "Received through create inventory flow",
        });
      }

      existingItem.lastActivityDate = new Date();

      const updatedSummary = hydrateInventoryForSave(existingItem);
      existingItem.maxStock = Math.max(resolveStockCap(existingItem), updatedSummary.stock);

      const updatedInventory = await existingItem.save();
      await logInventoryActivity({
        req,
        inventory: updatedInventory,
        actionType: stockValue > 0 ? "increase" : "update",
        amount: stockValue,
        previousStock,
        newStock: updatedSummary.stock,
        note:
          stockValue > 0
            ? `New FIFO batch received${createdBatch ? ` (${createdBatch.batchCode})` : ""}`
            : "Inventory item details updated through create inventory flow",
        batchBreakdown: createdBatch
          ? [
              {
                batchId: createdBatch._id?.toString?.(),
                batchCode: createdBatch.batchCode,
                quantity: createdBatch.quantity,
                unitPrice: createdBatch.unitPrice,
                lineCost: normalizeMoney(createdBatch.quantity * createdBatch.unitPrice),
                receivedAt: createdBatch.receivedAt,
              },
            ]
          : [],
        totalCost: createdBatch
          ? normalizeMoney(createdBatch.quantity * createdBatch.unitPrice)
          : 0,
      });
      if (
        stockValue > 0 &&
        shouldCreateInventoryRestockNotification({
          inventory: updatedInventory,
          previousStock,
          previousMinStock,
        })
      ) {
        await createInventoryEventNotification({
          req,
          inventory: updatedInventory,
          event: "restocked",
          previousStock,
          amount: stockValue,
        });
      }
      await maybeCreateInventoryNotification({
        req,
        inventory: updatedInventory,
        previousStock,
        previousMinStock,
      });
      notifyInventoryClients({
        actionType: stockValue > 0 ? "increase" : "update",
        inventory: updatedInventory,
      });
      return res.status(200).json({
        ...serializeInventory(updatedInventory),
        message:
          stockValue > 0
            ? "Existing item restocked as a new FIFO batch."
            : "Existing item details updated.",
        isUpdate: true
      });
    }

    // Auto-generate SKU
    const generatedSKU = await generateSKU(category);

    // Item doesn't exist - create new one
    const newInventory = new Inventory({
      name: name.trim(),
      sku: generatedSKU,
      normalizedName,
      normalizedUnit,
      category,
      stock: 0,
      initialStock: stockValue,
      maxStock: stockValue,
      minStock: minStockValue,
      unit,
      description: description || "",
      supplier: supplier || "",
      unitPrice: hasUnitPrice ? unitPriceValue : 0,
      batches: [],
      nextBatchSequence: 1,
      lastActivityDate: new Date(),
    });

    let openingBatch = null;
    if (stockValue > 0) {
      openingBatch = appendInventoryBatch(newInventory, {
        quantity: stockValue,
        unitPrice: hasUnitPrice ? unitPriceValue : 0,
        receivedAt,
        supplier: supplier || "",
        note: "Opening stock batch",
      });
    }

    hydrateInventoryForSave(newInventory);

    const savedInventory = await newInventory.save();
    await logInventoryActivity({
      req,
      inventory: savedInventory,
      actionType: "create",
      amount: stockValue,
      previousStock: 0,
      newStock: normalizeQuantity(savedInventory.stock),
      note: "New inventory item created",
      batchBreakdown: openingBatch
        ? [
            {
              batchId: openingBatch._id?.toString?.(),
              batchCode: openingBatch.batchCode,
              quantity: openingBatch.quantity,
              unitPrice: openingBatch.unitPrice,
              lineCost: normalizeMoney(openingBatch.quantity * openingBatch.unitPrice),
              receivedAt: openingBatch.receivedAt,
            },
          ]
        : [],
      totalCost: openingBatch
        ? normalizeMoney(openingBatch.quantity * openingBatch.unitPrice)
        : 0,
    });
    await createInventoryEventNotification({
      req,
      inventory: savedInventory,
      event: "created",
      amount: stockValue,
    });
    await maybeCreateInventoryNotification({
      req,
      inventory: savedInventory,
      previousStock: 0,
      previousMinStock: minStockValue,
    });
    notifyInventoryClients({
      actionType: "create",
      inventory: savedInventory,
    });
    res.status(201).json({
      ...serializeInventory(savedInventory),
      message: "New item created.",
      isUpdate: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update inventory item
export const updateInventory = async (req, res) => {
  try {
    const {
      name,
      category,
      stock,
      minStock,
      unit,
      description,
      supplier,
      unitPrice,
      receivedAt,
    } = req.body;

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const previousSummary = hydrateInventoryForSave(inventory);
    const previousStock = previousSummary.stock;
    const previousMinStock = inventory.minStock;
    const hasUnitPrice = unitPrice != null && unitPrice !== "";

    const nextName = name ? name.trim() : inventory.name;
    const nextUnit = unit ?? inventory.unit;
    const nextNormalizedName = normalizeName(nextName);
    const nextNormalizedUnit = normalizeUnit(nextUnit);
    const nextUnitMatcher = new RegExp(
      `^${escapeRegExp(String(nextUnit).trim())}$`,
      "i"
    );

    const conflictingInventory = await Inventory.findOne({
      _id: { $ne: inventory._id },
      normalizedName: nextNormalizedName,
      archived: false,
      $or: [
        { normalizedUnit: nextNormalizedUnit },
        { unit: nextUnitMatcher },
      ],
    }).lean();

    if (conflictingInventory) {
      return res.status(400).json({
        message: "Another active inventory item already uses the same name and unit.",
      });
    }

    inventory.name = nextName;
    inventory.normalizedName = nextNormalizedName;
    inventory.unit = nextUnit;
    inventory.normalizedUnit = nextNormalizedUnit;
    if (category) inventory.category = category;
    if (minStock != null) inventory.minStock = Math.max(0, Number(minStock) || 0);
    if (description != null) inventory.description = description;
    if (supplier != null) inventory.supplier = supplier;
    if (hasUnitPrice) inventory.unitPrice = normalizeMoney(unitPrice);

    let batchBreakdown = [];
    let totalCost = 0;

    if (stock != null) {
      const nextStock = normalizeQuantity(stock);

      if (nextStock > previousStock) {
        const addedQuantity = normalizeQuantity(nextStock - previousStock);
        const addedBatch = appendInventoryBatch(inventory, {
          quantity: addedQuantity,
          unitPrice:
            hasUnitPrice
              ? normalizeMoney(unitPrice)
              : normalizeMoney(inventory.unitPrice),
          receivedAt,
          supplier: supplier ?? inventory.supplier ?? "",
          note: "Stock synced through update inventory flow",
        });

        if (addedBatch) {
          batchBreakdown = [
            {
              batchId: addedBatch._id?.toString?.(),
              batchCode: addedBatch.batchCode,
              quantity: addedBatch.quantity,
              unitPrice: addedBatch.unitPrice,
              lineCost: normalizeMoney(addedBatch.quantity * addedBatch.unitPrice),
              receivedAt: addedBatch.receivedAt,
            },
          ];
          totalCost = normalizeMoney(addedBatch.quantity * addedBatch.unitPrice);
        }
      } else if (nextStock < previousStock) {
        const deduction = applyFifoDeduction(
          inventory,
          normalizeQuantity(previousStock - nextStock)
        );

        if (!deduction.success) {
          return res.status(400).json({
            message: "Unable to reduce stock below available FIFO batches.",
            ...deduction,
          });
        }

        batchBreakdown = deduction.breakdown.map((entry) => ({
          batchId: entry.batchId,
          batchCode: entry.batchCode,
          quantity: entry.willUse,
          unitPrice: entry.unitPrice,
          lineCost: entry.lineCost,
          receivedAt: entry.receivedAt,
        }));
        totalCost = normalizeMoney(deduction.totalCost);
      }
    }

    inventory.lastActivityDate = new Date();

    const updatedSummary = hydrateInventoryForSave(inventory);
    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: "update",
      amount: Math.abs(updatedSummary.stock - previousStock),
      previousStock,
      newStock: updatedSummary.stock,
      note:
        batchBreakdown.length > 0
          ? `Inventory item updated with FIFO batch impact (${buildFifoNote(batchBreakdown)})`
          : "Inventory item updated",
      batchBreakdown,
      totalCost,
    });
    if (
      shouldCreateInventoryRestockNotification({
        inventory: updatedInventory,
        previousStock,
        previousMinStock,
      })
    ) {
      await createInventoryEventNotification({
        req,
        inventory: updatedInventory,
        event: "restocked",
        previousStock,
        amount: Math.max(0, updatedInventory.stock - previousStock),
      });
    }
    await maybeCreateInventoryNotification({
      req,
      inventory: updatedInventory,
      previousStock,
      previousMinStock,
    });
    notifyInventoryClients({
      actionType: "update",
      inventory: updatedInventory,
    });
    res.status(200).json(serializeInventory(updatedInventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Adjust stock (increase or decrease)
export const adjustStock = async (req, res) => {
  try {
    const { type, amount, unitPrice, receivedAt, supplier } = req.body;
    const adjustmentAmount = normalizeQuantity(amount);
    const hasUnitPrice = unitPrice != null && unitPrice !== "";

    if (!type || !adjustmentAmount || adjustmentAmount <= 0) {
      return res.status(400).json({ message: "Invalid type or amount" });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const previousSummary = hydrateInventoryForSave(inventory);
    const previousStock = previousSummary.stock;
    const previousMinStock = inventory.minStock;
    const currentCap = resolveStockCap(inventory);
    let batchBreakdown = [];
    let totalCost = 0;

    if (type === "increase") {
      const incomingUnitPrice =
        hasUnitPrice
          ? normalizeMoney(unitPrice)
          : normalizeMoney(inventory.unitPrice);

      const addedBatch = appendInventoryBatch(inventory, {
        quantity: adjustmentAmount,
        unitPrice: incomingUnitPrice,
        receivedAt,
        supplier: supplier ?? inventory.supplier ?? "",
        note: "Received through adjust stock flow",
      });

      inventory.unitPrice = incomingUnitPrice;
      inventory.maxStock = Math.max(currentCap, normalizeQuantity(previousStock + adjustmentAmount));

      if (addedBatch) {
        batchBreakdown = [
          {
            batchId: addedBatch._id?.toString?.(),
            batchCode: addedBatch.batchCode,
            quantity: addedBatch.quantity,
            unitPrice: addedBatch.unitPrice,
            lineCost: normalizeMoney(addedBatch.quantity * addedBatch.unitPrice),
            receivedAt: addedBatch.receivedAt,
          },
        ];
        totalCost = normalizeMoney(addedBatch.quantity * addedBatch.unitPrice);
      }
    } else if (type === "decrease") {
      const deduction = applyFifoDeduction(inventory, adjustmentAmount);
      if (!deduction.success) {
        return res.status(400).json({
          message: "Insufficient stock available across FIFO batches.",
          ...deduction,
        });
      }

      batchBreakdown = deduction.breakdown.map((entry) => ({
        batchId: entry.batchId,
        batchCode: entry.batchCode,
        quantity: entry.willUse,
        unitPrice: entry.unitPrice,
        lineCost: entry.lineCost,
        receivedAt: entry.receivedAt,
      }));
      totalCost = normalizeMoney(deduction.totalCost);
      inventory.maxStock = currentCap;
    } else {
      return res.status(400).json({ message: "Invalid adjustment type" });
    }

    // Update lastActivityDate on stock adjustment
    inventory.lastActivityDate = new Date();

    const updatedSummary = hydrateInventoryForSave(inventory);
    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: type,
      amount: adjustmentAmount,
      previousStock,
      newStock: updatedSummary.stock,
      note:
        type === "decrease" && batchBreakdown.length > 0
          ? `Stock deducted with FIFO batches (${buildFifoNote(batchBreakdown)})`
          : type === "increase" && batchBreakdown.length > 0
            ? `New FIFO batch received (${batchBreakdown[0].batchCode})`
            : `Stock ${type}d through adjust stock flow`,
      batchBreakdown,
      totalCost,
    });
    if (
      type === "increase" &&
      shouldCreateInventoryRestockNotification({
        inventory: updatedInventory,
        previousStock,
        previousMinStock,
      })
    ) {
      await createInventoryEventNotification({
        req,
        inventory: updatedInventory,
        event: "restocked",
        previousStock,
        amount: adjustmentAmount,
      });
    }
    await maybeCreateInventoryNotification({
      req,
      inventory: updatedInventory,
      previousStock,
      previousMinStock,
    });
    notifyInventoryClients({
      actionType: type,
      inventory: updatedInventory,
    });
    res.status(200).json({
      ...serializeInventory(updatedInventory),
      lastAdjustment: {
        type,
        amount: adjustmentAmount,
        totalCost,
        batchBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Archive inventory item (instead of delete)
export const archiveInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    hydrateInventoryForSave(inventory);
    inventory.archived = true;
    inventory.lastActivityDate = new Date();
    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: "archive",
      previousStock: updatedInventory.stock,
      newStock: updatedInventory.stock,
      note: "Inventory item archived",
    });
    await createInventoryEventNotification({
      req,
      inventory: updatedInventory,
      event: "archived",
    });
    notifyInventoryClients({
      actionType: "archive",
      inventory: updatedInventory,
    });
    res.status(200).json(serializeInventory(updatedInventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore inventory item (from archive)
export const restoreInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    hydrateInventoryForSave(inventory);
    inventory.archived = false;
    inventory.lastActivityDate = new Date();
    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: "restore",
      previousStock: updatedInventory.stock,
      newStock: updatedInventory.stock,
      note: "Inventory item restored",
    });
    await createInventoryEventNotification({
      req,
      inventory: updatedInventory,
      event: "restored",
    });
    notifyInventoryClients({
      actionType: "restore",
      inventory: updatedInventory,
    });
    res.status(200).json(serializeInventory(updatedInventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete inventory item (kept for backwards compatibility)
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    hydrateInventoryForSave(inventory);
    inventory.archived = true;
    inventory.lastActivityDate = new Date();
    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: "archive",
      previousStock: updatedInventory.stock,
      newStock: updatedInventory.stock,
      note: "Inventory item archived through delete flow",
    });
    await createInventoryEventNotification({
      req,
      inventory: updatedInventory,
      event: "archived",
    });
    notifyInventoryClients({
      actionType: "archive",
      inventory: updatedInventory,
    });
    res.status(200).json(serializeInventory(updatedInventory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    const inventory = (await Inventory.find()).map(serializeInventory);

    const totalItems = inventory.length;
    const lowStock = inventory.filter((item) => {
      const stockCap = Math.max(1, resolveStockCap(item));
      return item.stock > 0 && item.stock / stockCap < 0.2;
    }).length;
    const outOfStock = inventory.filter((item) => item.stock === 0).length;
    const totalValue = inventory.reduce(
      (sum, item) => sum + normalizeMoney(item.currentStockValue),
      0
    );

    res.status(200).json({
      totalItems,
      lowStock,
      outOfStock,
      totalValue: normalizeMoney(totalValue),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search inventory
export const searchInventory = async (req, res) => {
  try {
    const { query, category, status } = req.query;
    let filter = {};

    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const results = (await Inventory.find(filter).sort({ createdAt: -1 })).map(
      serializeInventory
    );

    // Filter by status if provided
    let filtered = results;
    if (status && status !== "All") {
      filtered = results.filter((item) => {
        const stockCap = Math.max(1, resolveStockCap(item));
        if (status === "Out of Stock") return item.stock === 0;
        if (status === "Low Stock") return item.stock > 0 && item.stock / stockCap < 0.2;
        if (status === "In Stock") return item.stock / stockCap >= 0.2;
        return true;
      });
    }

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
