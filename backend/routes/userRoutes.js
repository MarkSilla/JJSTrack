import express from 'express';
import {
  googleAuth,
  register,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes 
router.post('/google-auth', googleAuth);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes 
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

export default router;
