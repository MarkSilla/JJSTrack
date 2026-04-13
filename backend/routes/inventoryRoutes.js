import express from "express";
import {
  getAllInventory,
  getInventoryActivity,
  getInventoryById,
  getInventoryByCategory,
  createInventory,
  updateInventory,
  adjustStock,
  deleteInventory,
  archiveInventory,
  restoreInventory,
  getInventoryStats,
  searchInventory,
} from "../controllers/inventoryController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes (no auth required for now, add authMiddleware if needed)
router.get("/", getAllInventory);
router.get("/activity", authMiddleware, getInventoryActivity);
router.get("/stats", getInventoryStats);
router.get("/search", searchInventory);
router.get("/category/:category", getInventoryByCategory);
router.get("/:id", getInventoryById);

// Protected routes
router.post("/", authMiddleware, createInventory);
router.put("/:id", authMiddleware, updateInventory);
router.patch("/:id/adjust", authMiddleware, adjustStock);
router.patch("/:id/archive", authMiddleware, archiveInventory);
router.patch("/:id/restore", authMiddleware, restoreInventory);
router.delete("/:id", authMiddleware, deleteInventory);

export default router;
