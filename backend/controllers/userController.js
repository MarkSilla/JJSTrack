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
  pool: {
    maxConnections: 1,
  },
});

// Verify email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error.message);
  } else {
    console.log('Email transporter configured successfully');
  }
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeEmail = (email) => String(email).trim().toLowerCase();

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
    console.log(`📧 Attempting to send verification email to: ${email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}. Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Email sending failed for ${email}:`, error.message);
    console.error('Full error:', error);
    return false;
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { uid, email, fullName, photoURL } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const normalizedEmail = normalizeEmail(email);
    let user = await userModel.findOne({ firebaseUID: uid });

    if (!user) {
      // Check if user with this email already exists
      user = await userModel.findOne({ email: normalizedEmail });
      
      if (!user) {
        // Create new user
        user = new userModel({
          firebaseUID: uid,
          email: normalizedEmail,
          fullName: fullName || email.split('@')[0],
          photoURL: photoURL || '',
          isVerified: true,
        });
      } else {
        // Link Firebase to existing email account
        user.firebaseUID = uid;
        user.fullName = fullName || user.fullName;
        user.photoURL = photoURL || user.photoURL;
        user.isVerified = true;
      }
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

// Register with Email & Password (backend only)
export const register = async (req, res) => {
  try {
    const { email, password, fullName, firstName, lastName, phone, address } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = normalizeEmail(email);
    let user = await userModel.findOne({ email: normalizedEmail });

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedPassword = await bcrypt.hash(String(password), 10);

    if (user?.isVerified) {
      return res.status(409).json({
        success: false,
        message: user.password
          ? 'Email is already registered. Please log in instead.'
          : 'This email is already linked to Google sign-in. Please continue with Google.',
      });
    }

    if (!user) {
      // Create new user
      user = new userModel({
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber: phone || '',
        address: address || '',
        isVerified: false,
        verificationCode,
        verificationCodeExpiry: codeExpiry,
      });
      await user.save();
    } else {
      // Refresh an existing unverified account and resend a new code.
      user.email = normalizedEmail;
      user.password = hashedPassword;
      user.fullName = fullName || user.fullName;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phoneNumber = phone || user.phoneNumber;
      user.address = address || user.address;
      user.verificationCode = verificationCode;
      user.verificationCodeExpiry = codeExpiry;
      user.isVerified = false;
      await user.save();
    }

    // Send verification code email (non-blocking, errors are logged but don't fail registration)
    sendVerificationEmail(email, verificationCode, fullName).catch((err) => {
      console.error('Failed to send verification email:', err.message);
      // Email failure is not critical - user can request resend on verify page
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for a 6-digit verification code.',
      email: user.email,
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// Verify email with 6-digit code
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const user = await userModel.findOne({ email: normalizeEmail(email) });

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

    const user = await userModel.findOne({ email: normalizeEmail(email) });

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
    const user = await userModel.findOne({ email: normalizeEmail(email) });
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

    // Accounts without a local password should continue through Google sign-in.
    if (!user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'This account uses Google sign-in. Please continue with Google.',
        isGoogleUser: true
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

    const user = await userModel.findOne({ email: normalizeEmail(email) });

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

    const user = await userModel.findOne({ email: normalizeEmail(email) });

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

// Complete Google user profile using the same core profile fields as signup.
export const completeGoogleProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      address,
      street,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      brgyCode,
      brgyName,
    } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!firstName || !lastName || !phoneNumber || !address || !street || !provinceName || !cityName || !brgyName) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, phone number, and full address details are required' 
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.firstName = String(firstName).trim();
    user.lastName = String(lastName).trim();
    user.fullName = `${user.firstName} ${user.lastName}`.trim();
    user.phoneNumber = String(phoneNumber).trim();
    user.address = String(address).trim();
    user.street = String(street).trim();
    user.provinceCode = String(provinceCode || '').trim();
    user.provinceName = String(provinceName).trim();
    user.cityCode = String(cityCode || '').trim();
    user.cityName = String(cityName).trim();
    user.brgyCode = String(brgyCode || '').trim();
    user.brgyName = String(brgyName).trim();
    await user.save();

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        street: user.street,
        provinceCode: user.provinceCode,
        provinceName: user.provinceName,
        cityCode: user.cityCode,
        cityName: user.cityName,
        brgyCode: user.brgyCode,
        brgyName: user.brgyName,
        photoURL: user.photoURL,
        role: user.role,
        isGoogleUser: true,
      },
    });
  } catch (error) {
    console.error('Complete Google Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete profile' });
  }
};

// Admin Login with Email & Password validation
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Validation: Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Validation: Check password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // 1) Admin login via .env credentials
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      const isAdminEmailMatch = normalizedEmail === String(ADMIN_EMAIL).trim().toLowerCase();
      const isAdminPasswordMatch = password === ADMIN_PASSWORD;

      if (isAdminEmailMatch && isAdminPasswordMatch) {
        const token = jwt.sign(
          { 
            id: 'admin',
            email: ADMIN_EMAIL,
            role: 'admin'
          },
          process.env.JWT_SECRET || 'secret_key',
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Admin login successful',
          token,
          admin: {
            id: 'admin',
            email: ADMIN_EMAIL,
            role: 'admin',
          },
        });
      }
    }

    // 2) Admin login via DB credentials (admin accounts only)
    const adminAccount = await userModel.findOne({
      email: normalizedEmail,
      role: 'admin',
    });

    if (!adminAccount || !adminAccount.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, adminAccount.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    adminAccount.lastLoginAt = new Date();
    await adminAccount.save();

    const token = jwt.sign(
      { 
        id: adminAccount._id,
        email: adminAccount.email,
        role: adminAccount.role
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: adminAccount._id,
        email: adminAccount.email,
        role: adminAccount.role,
        fullName: adminAccount.fullName,
      },
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Admin login failed. Please try again.' 
    });
  }
};

// Staff Login with Email & Password validation
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const staffAccount = await userModel.findOne({
      email: normalizedEmail,
      role: 'staff',
    });

    if (!staffAccount || !staffAccount.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (staffAccount.accountStatus && staffAccount.accountStatus !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your staff account is not active. Please contact admin.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, staffAccount.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    staffAccount.lastLoginAt = new Date();
    await staffAccount.save();

    const token = jwt.sign(
      {
        id: staffAccount._id,
        email: staffAccount.email,
        role: 'staff'
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Staff login successful',
      token,
      staff: {
        id: staffAccount._id,
        email: staffAccount.email,
        role: staffAccount.role,
        fullName: staffAccount.fullName,
      },
    });
  } catch (error) {
    console.error('Staff Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Staff login failed. Please try again.'
    });
  }
};

// Admin Logout
export const adminLogout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    console.error('Admin Logout Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
};

// Verify Admin Token
export const verifyAdminToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized as admin' 
      });
    }

    if (decoded.id !== 'admin') {
      const account = await userModel.findById(decoded.id).select('email role fullName accountStatus');
      if (!account || account.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Account no longer has admin access' 
        });
      }

      return res.json({
        success: true,
        message: 'Token verified',
        admin: {
          id: account._id,
          email: account.email,
          role: account.role,
          fullName: account.fullName,
        }
      });
    }

    res.json({
      success: true,
      message: 'Token verified',
      admin: decoded
    });
  } catch (error) {
    console.error('Token Verification Error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// DELETE TEST USER (for development only)
export const deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await userModel.deleteOne({ email: email.trim().toLowerCase() });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User with email ${email} has been deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
