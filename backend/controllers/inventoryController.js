import Inventory from "../models/inventoryModel.js";

// Helper function to normalize item names - STRICT normalization
const normalizeName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // Remove ALL spaces
    .replace(/[^a-z0-9]/g, ""); // Keep only letters and numbers (remove all special chars, accents, etc)
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
      const newStock = existingItem.stock + stockValue;
      existingItem.stock = newStock;
      existingItem.lastActivityDate = new Date();
      
      const updatedInventory = await existingItem.save();
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
      minStock: minStockValue,
      unit,
      description: description || "",
      supplier: supplier || "",
      unitPrice: unitPrice || 0,
      lastActivityDate: new Date(),
    });

    const savedInventory = await newInventory.save();
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
    if (name) inventory.name = name;
    if (category) inventory.category = category;
    if (stock != null) {
      inventory.stock = Math.max(0, stock);
      inventory.lastActivityDate = new Date();
    }
    if (minStock != null) inventory.minStock = minStock;
    if (unit) inventory.unit = unit;
    if (description != null) inventory.description = description;
    if (supplier != null) inventory.supplier = supplier;
    if (unitPrice != null) inventory.unitPrice = unitPrice;

    const updatedInventory = await inventory.save();
    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Adjust stock (increase or decrease)
export const adjustStock = async (req, res) => {
  try {
    const { type, amount } = req.body;

    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid type or amount" });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Only adjust current stock, not initialStock
    if (type === "increase") {
      inventory.stock = inventory.stock + amount;
    } else if (type === "decrease") {
      inventory.stock = Math.max(0, inventory.stock - amount);
    } else {
      return res.status(400).json({ message: "Invalid adjustment type" });
    }

    // Update lastActivityDate on stock adjustment
    inventory.lastActivityDate = new Date();

    const updatedInventory = await inventory.save();
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
    const updatedInventory = await inventory.save();
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
    const updatedInventory = await inventory.save();
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
    const updatedInventory = await inventory.save();
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
    const lowStock = inventory.filter((item) => item.stock / item.max < 0.2).length;
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
        if (status === "Out of Stock") return item.stock === 0;
        if (status === "Low Stock") return item.stock > 0 && item.stock / item.max < 0.2;
        if (status === "In Stock") return item.stock / item.max >= 0.2;
        return true;
      });
    }

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
