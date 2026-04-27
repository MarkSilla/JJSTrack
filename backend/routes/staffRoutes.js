import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createStaff,
  deactivateStaff,
  reactivateStaff,
  resetStaffPassword,
  getMyStaff,
  getStaff,
  updateStaff,
  suspendStaff,
} from "../controllers/staffController.js";

const router = express.Router();

router.get("/", authMiddleware, getStaff);
router.get("/my-staff", authMiddleware, getMyStaff);
router.post("/", authMiddleware, createStaff);
router.put("/:id", authMiddleware, updateStaff);
router.patch("/:id/deactivate", authMiddleware, deactivateStaff);
router.patch("/:id/suspend", authMiddleware, suspendStaff);
router.patch("/:id/reactivate", authMiddleware, reactivateStaff);
router.patch("/:id/reset-password", authMiddleware, resetStaffPassword);

export default router;
