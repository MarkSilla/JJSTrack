import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  convertBookingToOrder,
  cancelBooking,
  getAvailableSlots,
  getSlotSummary,
  getBookingQR,
  markAsPickedUp,
  generateMissingBookingQRCodes,
  archiveBooking,
  unarchiveBooking,
} from '../controllers/bookingController.js';
import { authMiddleware, adminMiddleware, staffMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/slots/available/:date', getAvailableSlots);
router.get('/slots/summary', getSlotSummary);

// Protected routes - requires authentication
router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, getBookings);

// More specific routes before generic /:id routes
router.put('/:id/cancel', authMiddleware, cancelBooking);
router.get('/:id/qr', authMiddleware, getBookingQR);

// Admin only - archive/unarchive bookings
router.post('/:id/archive', authMiddleware, adminMiddleware, archiveBooking);
router.post('/:id/unarchive', authMiddleware, adminMiddleware, unarchiveBooking);

// QR code scanning - mark booking as picked up
router.post('/qr/pickup', authMiddleware, markAsPickedUp);

// Admin only - generate missing QR codes
router.post('/admin/generate-qr', authMiddleware, adminMiddleware, generateMissingBookingQRCodes);

// Less specific routes
router.get('/:id', authMiddleware, getBookingById);
router.put('/:id', authMiddleware, updateBooking);
router.put('/:id/status', authMiddleware, updateBookingStatus);

// Admin/Staff only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteBooking);
router.post('/:id/convert', authMiddleware, staffMiddleware, convertBookingToOrder);

export default router;
