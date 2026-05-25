import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.userId = decoded.id;
    req.userRole = decoded.role;

    if (decoded.id !== 'admin') {
      const user = await userModel.findById(decoded.id).select('activeSessionId role');

      if (!user) {
        return res.status(401).json({ success: false, message: 'Account no longer exists' });
      }

      if (user.activeSessionId && user.activeSessionId !== decoded.sessionId) {
        return res.status(401).json({
          success: false,
          code: 'SESSION_REPLACED',
          message: 'This account was signed in on another device. Please sign in again.',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
