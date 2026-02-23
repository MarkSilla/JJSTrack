import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  convertBookingToOrder,
} from '../controllers/bookingController.js';
import { authMiddleware, adminMiddleware, staffMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes - none for bookings

// Protected routes - requires authentication
router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, getBookings);
router.get('/:id', authMiddleware, getBookingById);
router.put('/:id', authMiddleware, updateBooking);
router.put('/:id/status', authMiddleware, updateBookingStatus);

// Admin/Staff only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteBooking);
router.post('/:id/convert', authMiddleware, staffMiddleware, convertBookingToOrder);

export default router;
