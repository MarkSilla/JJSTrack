import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Check if user is Admin
export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Authorization failed' });
  }
};

// Check if user is Staff or Admin
export const staffMiddleware = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'staff' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Staff access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Staff Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Authorization failed' });
  }
};

// Check if user is User (regular user)
export const userRoleMiddleware = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Authorization failed' });
  }
};
