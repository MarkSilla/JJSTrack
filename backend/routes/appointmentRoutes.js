import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAvailableSlots,
  getAppointmentStats,
} from '../controllers/appointmentController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/slots', getAvailableSlots);

// Protected routes - requires authentication
router.post('/', authMiddleware, createAppointment);
router.get('/', authMiddleware, getAppointments);
router.get('/stats', authMiddleware, getAppointmentStats);
router.get('/:id', authMiddleware, getAppointmentById);
router.put('/:id', authMiddleware, updateAppointment);
router.put('/:id/status', authMiddleware, updateAppointmentStatus);

// Admin only routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteAppointment);

export default router;
