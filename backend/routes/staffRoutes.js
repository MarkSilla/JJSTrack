import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createStaff,
  deactivateStaff,
  getMyStaff,
  getStaff,
  updateStaff,
} from "../controllers/staffController.js";

const router = express.Router();

router.get("/", authMiddleware, getStaff);
router.get("/my-staff", authMiddleware, getMyStaff);
router.post("/", authMiddleware, createStaff);
router.put("/:id", authMiddleware, updateStaff);
router.patch("/:id/deactivate", authMiddleware, deactivateStaff);

export default router;
