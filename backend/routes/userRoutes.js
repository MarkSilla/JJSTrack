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
  completeGoogleProfile,
  adminLogin,
  adminLogout,
  verifyAdminToken,
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

// Admin routes
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.post('/admin/verify-token', verifyAdminToken);

// Protected routes 
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.post('/complete-google-profile', authMiddleware, completeGoogleProfile);

export default router;
