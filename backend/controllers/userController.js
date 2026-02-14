import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import admin from 'firebase-admin'; // TODO: Install firebase-admin for full verification

// Google Auth (accepts Firebase user data from frontend)
// Note: Server-side token verification requires Firebase Admin SDK
export const googleAuth = async (req, res) => {
  try {
    const { uid, email, fullName, photoURL } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let user = await userModel.findOne({ firebaseUID: uid });

    if (!user) {
      user = new userModel({
        firebaseUID: uid,
        email,
        fullName: fullName || email.split('@')[0],
        photoURL: photoURL || '',
        username: email.split('@')[0],
        isVerified: true,
      });
      await user.save();
    } else {
      user.fullName = fullName || user.fullName;
      user.photoURL = photoURL || user.photoURL;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, firebaseUID: uid },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        photoURL: user.photoURL,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, username } = req.body;
    const user = await userModel.findByIdAndUpdate(
      req.userId,
      { fullName, phoneNumber, username },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

// Register with Email & Password
export const register = async (req, res) => {
  try {
    const { email, password, fullName, username } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      email,
      fullName,
      username: username || email.split('@')[0],
      password: hashedPassword,
      isVerified: false, 
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        photoURL: user.photoURL,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
export const logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};