import express from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderSteps,
  deleteOrder,
  cancelOrder,
  getOrderStats,
} from '../controllers/orderController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes - none for orders

// Protected routes - requires authentication
router.get('/', authMiddleware, getOrders);
router.get('/stats', authMiddleware, getOrderStats);

// More specific routes must come before generic /:id routes
router.put('/:id/cancel', authMiddleware, cancelOrder);
router.put('/:id/steps', authMiddleware, updateOrderSteps);

// Less specific routes
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id', authMiddleware, updateOrderStatus);

// Admin only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteOrder);

export default router;
