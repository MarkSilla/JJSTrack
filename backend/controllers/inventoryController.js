import Inventory from "../models/inventoryModel.js";

// Get all inventory items
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

// Create new inventory item
export const createInventory = async (req, res) => {
  try {
    const { name, category, stock, max, unit, description, supplier, unitPrice } = req.body;

    // Validation
    if (!name || !category || max == null || !unit) {
      return res.status(400).json({ message: "Please provide required fields: name, category, max, unit" });
    }

    const newInventory = new Inventory({
      name,
      category,
      stock: stock || 0,
      max,
      unit,
      description: description || "",
      supplier: supplier || "",
      unitPrice: unitPrice || 0,
    });

    const savedInventory = await newInventory.save();
    res.status(201).json(savedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update inventory item
export const updateInventory = async (req, res) => {
  try {
    const { name, category, stock, max, unit, description, supplier, unitPrice } = req.body;

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Update fields if provided
    if (name) inventory.name = name;
    if (category) inventory.category = category;
    if (stock != null) inventory.stock = Math.max(0, Math.min(stock, inventory.max));
    if (max) inventory.max = max;
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

    if (type === "increase") {
      inventory.stock = Math.min(inventory.max, inventory.stock + amount);
    } else if (type === "decrease") {
      inventory.stock = Math.max(0, inventory.stock - amount);
    } else {
      return res.status(400).json({ message: "Invalid adjustment type" });
    }

    const updatedInventory = await inventory.save();
    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete inventory item
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.status(200).json({ message: "Inventory item deleted successfully" });
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
