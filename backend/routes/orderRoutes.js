import express from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderSteps,
  deleteOrder,
  cancelOrder,
  getOrderStats,
  assignEmployee,
  markAsReleased,
  getOrderQR,
  getOrderForQRScan,
  generateMissingQRCodes,
} from '../controllers/orderController.js';
import { authMiddleware, adminMiddleware, staffMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes - none for orders

// Protected routes - requires authentication
router.get('/', authMiddleware, getOrders);
router.get('/stats', authMiddleware, getOrderStats);

// More specific routes must come before generic /:id routes
router.put('/:id/cancel', authMiddleware, cancelOrder);
router.put('/:id/steps', authMiddleware, updateOrderSteps);
router.put('/:id/assign', authMiddleware, assignEmployee);
router.get('/:id/qr', authMiddleware, getOrderQR);

// QR code scanning - lookup and mark order as released
router.get('/qr/:id', authMiddleware, staffMiddleware, getOrderForQRScan);
router.post('/qr/release', authMiddleware, markAsReleased);

// Admin only - generate missing QR codes
router.post('/admin/generate-qr', authMiddleware, adminMiddleware, generateMissingQRCodes);

// Less specific routes
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id', authMiddleware, updateOrderStatus);

// Admin only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteOrder);

export default router;
