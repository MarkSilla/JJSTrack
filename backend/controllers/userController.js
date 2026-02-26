import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send 6-digit verification code email
const sendVerificationEmail = async (email, code, fullName) => {
  const mailOptions = {
    from: `"JJS Track" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your JJS Track Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; font-family: 'Playfair Display', serif; }
          .content { padding: 40px 30px; text-align: center; }
          .code-box { background: #f8fafc; border: 2px solid #3b82f6; border-radius: 8px; padding: 25px; margin: 30px 0; }
          .code { font-size: 40px; font-weight: bold; color: #1e293b; letter-spacing: 6px; font-family: 'Courier New', monospace; }
          .message { color: #64748b; line-height: 1.6; margin: 20px 0; font-size: 16px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
          .timer { color: #ef4444; font-size: 14px; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>JJS Track</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Where Every Stitch Reflects Quality and Craftsmanship</p>
          </div>
          <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 10px;">Welcome, ${fullName}!</h2>
            <p class="message">Your account has been created successfully. Use the code below to verify your email:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p class="message" style="margin-bottom: 5px;">Enter this code in the app to complete your registration.</p>
            <div class="timer">⏰ This code expires in 10 minutes</div>
          </div>
          <div class="footer">
            <p>If you didn't create an account with JJS Track, please ignore this email.</p>
            <p style="margin-top: 10px;">© 2026 DevMinds • JJS Track</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

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
        phoneNumber: user.phoneNumber,
        address: user.address,
        photoURL: user.photoURL,
        role: user.role,
        isGoogleUser: true,
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
    const { fullName, phoneNumber, address, email } = req.body;
    
    // Build update object with all provided fields
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;
    if (email) updateData.email = email;
    
    const user = await userModel.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update User Profile Error:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

// Register with Email & Password (Firebase)
export const register = async (req, res) => {
  try {
    const { uid, email, fullName } = req.body;
    
    if (!email || !fullName || !uid) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    let user = await userModel.findOne({ firebaseUID: uid });

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (!user) {
      // Create new user
      user = new userModel({
        firebaseUID: uid,
        email,
        fullName,
        isVerified: false,
        verificationCode,
        verificationCodeExpiry: codeExpiry,
      });
      await user.save();
    } else {
      // Update existing user
      user.fullName = fullName || user.fullName;
      user.verificationCode = verificationCode;
      user.verificationCodeExpiry = codeExpiry;
      user.isVerified = false;
      await user.save();
    }

    // Send verification code email
    const emailSent = await sendVerificationEmail(email, verificationCode, fullName);

    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code. Please try again.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, firebaseUID: uid },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. A 6-digit verification code has been sent to your email.',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// Verify email with 6-digit code
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Check if code expired
    if (new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Resend verification code
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = codeExpiry;
    await user.save();

    // Send email
    const emailSent = await sendVerificationEmail(email, verificationCode, user.fullName);

    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code' 
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    console.error('Resend Code Error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend code' });
  }
};

// Login
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

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in',
        requiresVerification: true 
      });
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
        phoneNumber: user.phoneNumber,
        address: user.address,
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

// Logout
export const logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Send password reset code
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();

    // Send password reset email
    const mailOptions = {
      from: `"JJS Track" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'JJS Track Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; font-family: 'Playfair Display', serif; }
            .content { padding: 40px 30px; text-align: center; }
            .code-box { background: #f8fafc; border: 2px solid #ef4444; border-radius: 8px; padding: 25px; margin: 30px 0; }
            .code { font-size: 40px; font-weight: bold; color: #1e293b; letter-spacing: 6px; font-family: 'Courier New', monospace; }
            .message { color: #64748b; line-height: 1.6; margin: 20px 0; font-size: 16px; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
            .timer { color: #ef4444; font-size: 14px; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>JJS Track</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Where Every Stitch Reflects Quality and Craftsmanship</p>
            </div>
            <div class="content">
              <h2 style="color: #1e293b; margin-bottom: 10px;">Password Reset Request</h2>
              <p class="message">We received a request to reset your password. Use the code below:</p>
              
              <div class="code-box">
                <div class="code">${resetCode}</div>
              </div>
              
              <p class="message" style="margin-bottom: 5px;">Enter this code on the password reset page.</p>
              <div class="timer">⏰ This code expires in 10 minutes</div>
              <p class="message" style="color: #ef4444; margin-top: 20px;">If you didn't request this, you can ignore this email.</p>
            </div>
            <div class="footer">
              <p style="margin-top: 10px;">© 2026 DevMinds • JJS Track</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset code email' 
      });
    }

    res.json({
      success: true,
      message: 'Password reset code sent to your email',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset code' });
  }
};

// Reset password with code
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if reset code exists and hasn't expired
    if (!user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ success: false, message: 'No reset code found. Request a new one.' });
    }

    if (new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ success: false, message: 'Reset code has expired' });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully!',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

// Complete Google user profile (add phone number, address, last name)
export const completeGoogleProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!firstName || !lastName || !phoneNumber || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, phone number, and address are required' 
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user profile with both firstName and lastName
    user.fullName = `${firstName} ${lastName}`.trim();
    user.phoneNumber = phoneNumber;
    user.address = address;
    await user.save();

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        photoURL: user.photoURL,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Complete Google Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete profile' });
  }
};
