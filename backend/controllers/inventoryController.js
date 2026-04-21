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

// Helper function to normalize item names - STRICT normalization
const normalizeName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // Remove ALL spaces
    .replace(/[^a-z0-9]/g, ""); // Keep only letters and numbers (remove all special chars, accents, etc)
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
  const qty = Number(amount) || 0;
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
  actionType: activity.actionType,
  type: mapActivityType(activity.actionType),
  text: buildActivityText(activity),
  amount: activity.amount,
  unit: activity.unit,
  performedByName: activity.performedByName,
  performedByRole: activity.performedByRole,
  createdAt: activity.createdAt,
  note: activity.note || "",
});

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
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryActivity = async (req, res) => {
  try {
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
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
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory by category
export const getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const inventory = await Inventory.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new inventory item or update if exists
export const createInventory = async (req, res) => {
  try {
    const { name, category, stock, minStock, unit, description, supplier, unitPrice } = req.body;

    // Validation
    if (!name || !category || !unit) {
      return res.status(400).json({ message: "Please provide required fields: name, category, unit" });
    }

    const normalizedName = normalizeName(name);
    const stockValue = parseInt(stock) || 0;
    const minStockValue = parseInt(minStock) || 5;

    // Check if item already exists by normalizedName
    const existingItem = await Inventory.findOne({
      normalizedName,
      archived: false
    });

    if (existingItem) {
      // Item exists - update stock instead of creating new one
      const previousStock = existingItem.stock;
      const newStock = previousStock + stockValue;
      existingItem.stock = newStock;
      existingItem.maxStock = Math.max(resolveStockCap(existingItem), newStock);
      existingItem.lastActivityDate = new Date();
      
      const updatedInventory = await existingItem.save();
      await logInventoryActivity({
        req,
        inventory: updatedInventory,
        actionType: "increase",
        amount: stockValue,
        previousStock,
        newStock,
        note: "Stock increased through create inventory flow",
      });
      if (
        shouldCreateInventoryRestockNotification({
          inventory: updatedInventory,
          previousStock,
          previousMinStock: existingItem.minStock,
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
        previousMinStock: existingItem.minStock,
      });
      notifyInventoryClients({
        actionType: "increase",
        inventory: updatedInventory,
      });
      return res.status(200).json({
        ...updatedInventory.toObject(),
        message: "Item already exists. Stock updated.",
        isUpdate: true
      });
    }

    // Auto-generate SKU
    const generatedSKU = await generateSKU(category);

    // Item doesn't exist - create new one
    const newInventory = new Inventory({
      name,
      sku: generatedSKU,
      normalizedName,
      category,
      stock: stockValue,
      initialStock: stockValue,
      maxStock: stockValue,
      minStock: minStockValue,
      unit,
      description: description || "",
      supplier: supplier || "",
      unitPrice: unitPrice || 0,
      lastActivityDate: new Date(),
    });

    const savedInventory = await newInventory.save();
    await logInventoryActivity({
      req,
      inventory: savedInventory,
      actionType: "create",
      amount: stockValue,
      previousStock: 0,
      newStock: savedInventory.stock,
      note: "New inventory item created",
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
      ...savedInventory.toObject(),
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
    const { name, category, stock, minStock, unit, description, supplier, unitPrice } = req.body;

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Update fields if provided
    const previousStock = inventory.stock;
    const previousMinStock = inventory.minStock;
    if (name) inventory.name = name;
    if (category) inventory.category = category;
    if (stock != null) {
      const nextStock = Math.max(0, Number(stock) || 0);
      inventory.stock = nextStock;
      inventory.maxStock = Math.max(resolveStockCap(inventory), nextStock);
      inventory.lastActivityDate = new Date();
    }
    if (minStock != null) inventory.minStock = minStock;
    if (unit) inventory.unit = unit;
    if (description != null) inventory.description = description;
    if (supplier != null) inventory.supplier = supplier;
    if (unitPrice != null) inventory.unitPrice = unitPrice;

    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: "update",
      amount: Math.abs(updatedInventory.stock - previousStock),
      previousStock,
      newStock: updatedInventory.stock,
      note: "Inventory item updated",
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
    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Adjust stock (increase or decrease)
export const adjustStock = async (req, res) => {
  try {
    const { type, amount } = req.body;
    const adjustmentAmount = Number(amount);

    if (!type || !adjustmentAmount || adjustmentAmount <= 0) {
      return res.status(400).json({ message: "Invalid type or amount" });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Adjust current stock and keep maxStock as highest reached value
    const previousStock = inventory.stock;
    const previousMinStock = inventory.minStock;
    const currentCap = resolveStockCap(inventory);

    if (type === "increase") {
      inventory.stock = inventory.stock + adjustmentAmount;
      inventory.maxStock = Math.max(currentCap, inventory.stock);
    } else if (type === "decrease") {
      inventory.stock = Math.max(0, inventory.stock - adjustmentAmount);
      inventory.maxStock = currentCap;
    } else {
      return res.status(400).json({ message: "Invalid adjustment type" });
    }

    // Update lastActivityDate on stock adjustment
    inventory.lastActivityDate = new Date();

    const updatedInventory = await inventory.save();
    await logInventoryActivity({
      req,
      inventory: updatedInventory,
      actionType: type,
      amount: adjustmentAmount,
      previousStock,
      newStock: updatedInventory.stock,
      note: `Stock ${type}d through adjust stock flow`,
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
    res.status(200).json(updatedInventory);
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
    res.status(200).json(updatedInventory);
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
    res.status(200).json(updatedInventory);
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
    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    const inventory = await Inventory.find();

    const totalItems = inventory.length;
    const lowStock = inventory.filter((item) => {
      const stockCap = Math.max(1, resolveStockCap(item));
      return item.stock > 0 && item.stock / stockCap < 0.2;
    }).length;
    const outOfStock = inventory.filter((item) => item.stock === 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.unitPrice, 0);

    res.status(200).json({
      totalItems,
      lowStock,
      outOfStock,
      totalValue,
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

    const results = await Inventory.find(filter).sort({ createdAt: -1 });

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
