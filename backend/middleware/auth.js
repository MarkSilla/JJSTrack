import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

export const authMiddleware = (req, res, next) => {
  try {
    console.log('AuthMiddleware: Checking authorization...');
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
      console.log('Auth Error: No token provided');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    console.log('Auth: Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.userId = decoded.id;
    console.log('Auth Success: userId =', req.userId, '| Calling next()...');
    
    if (typeof next !== 'function') {
      console.error('ERROR: next is not a function in authMiddleware!');
      throw new Error('next is not a function');
    }
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
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
