import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  getOrCreateOrderConversationForSubject,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, listConversations);
router.post('/conversations/order', authMiddleware, getOrCreateOrderConversationForSubject);
router.get('/messages', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.patch('/messages/read', authMiddleware, markConversationRead);

export default router;
