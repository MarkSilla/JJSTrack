import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  getOrCreateOrderConversationForSubject,
  getOrCreateSupportConversationForTargetUser,
  editMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, listConversations);
router.post('/conversations/order', authMiddleware, getOrCreateOrderConversationForSubject);
router.post('/conversations/support', authMiddleware, getOrCreateSupportConversationForTargetUser);
router.get('/messages', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.patch('/messages/read', authMiddleware, markConversationRead);

// Message actions
router.patch('/messages/:messageId', authMiddleware, editMessage);
router.delete('/messages/:messageId/everyone', authMiddleware, deleteMessageForEveryone);
router.delete('/messages/:messageId/me', authMiddleware, deleteMessageForMe);

export default router;
