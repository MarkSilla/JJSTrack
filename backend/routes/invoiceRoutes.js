import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceStats,
} from '../controllers/invoiceController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes - none for invoices

// Protected routes - requires authentication
router.post('/', authMiddleware, createInvoice);
router.get('/', authMiddleware, getInvoices);
router.get('/stats', authMiddleware, getInvoiceStats);
router.get('/:id', authMiddleware, getInvoiceById);
router.put('/:id', authMiddleware, updateInvoice);
router.put('/:id/status', authMiddleware, updateInvoiceStatus);

// Admin only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteInvoice);

export default router;
