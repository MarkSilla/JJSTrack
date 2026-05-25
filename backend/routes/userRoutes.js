import express from 'express';
import {
  googleAuth,
  register,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  requestAccountRemoval,
  confirmAccountRemoval,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  completeGoogleProfile,
  adminLogin,
  staffLogin,
  adminLogout,
  verifyAdminToken,
  getStaffSession,
  deleteUserByEmail,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes 
router.post('/google-auth', googleAuth);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Development: Delete test user (remove in production)
router.post('/dev/delete-user', deleteUserByEmail);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/account-removal/confirm', confirmAccountRemoval);

// Admin routes
router.post('/admin/login', adminLogin);
router.post('/staff/login', staffLogin);
router.post('/admin/logout', adminLogout);
router.post('/admin/verify-token', verifyAdminToken);
router.get('/staff/session', authMiddleware, getStaffSession);

// Protected routes 
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.post('/account-removal/request', authMiddleware, requestAccountRemoval);
router.post('/complete-google-profile', authMiddleware, completeGoogleProfile);

export default router;
