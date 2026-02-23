import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderSteps,
  deleteOrder,
  getOrderStats,
} from '../controllers/orderController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes - none for orders

// Protected routes - requires authentication
router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/stats', authMiddleware, getOrderStats);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id', authMiddleware, updateOrderStatus);
router.put('/:id/steps', authMiddleware, updateOrderSteps);

// Admin only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteOrder);

export default router;
