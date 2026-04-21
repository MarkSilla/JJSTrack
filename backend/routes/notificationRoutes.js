import express from 'express';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.patch('/read-all', authMiddleware, markAllNotificationsAsRead);
router.patch('/:id/read', authMiddleware, markNotificationAsRead);

export default router;
