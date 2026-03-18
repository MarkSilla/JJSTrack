import express from "express";
import {
  getAllInventory,
  getInventoryById,
  getInventoryByCategory,
  createInventory,
  updateInventory,
  adjustStock,
  deleteInventory,
  getInventoryStats,
  searchInventory,
} from "../controllers/inventoryController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes (no auth required for now, add authMiddleware if needed)
router.get("/", getAllInventory);
router.get("/stats", getInventoryStats);
router.get("/search", searchInventory);
router.get("/category/:category", getInventoryByCategory);
router.get("/:id", getInventoryById);

// Protected routes
router.post("/", createInventory);
router.put("/:id", updateInventory);
router.patch("/:id/adjust", adjustStock);
router.delete("/:id", deleteInventory);

export default router;
