import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEmailConfig } from '../utils/emailConfig.js';

const { emailFrom, transport: emailTransportConfig } = getEmailConfig();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '../assets/jjstrack-logo.png');
const logoCid = 'jjstrack-logo';

// Email transporter configuration
const transporter = nodemailer.createTransport(emailTransportConfig);

// Verify email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      message: error.message,
    });
  } else {
    console.log('Email transporter configured successfully');
  }
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeEmail = (email) => String(email).trim().toLowerCase();
const normalizePhoneNumber = (phoneNumber) => String(phoneNumber || '').replace(/\D/g, '').trim();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const isValidPhilippineMobile = (phoneNumber) => /^09\d{9}$/.test(phoneNumber);
const VERIFICATION_CODE_TTL_MS = Number(process.env.VERIFICATION_CODE_TTL_MS || 60 * 1000);

const isDuplicateKeyError = (error) => error?.code === 11000 || error?.code === 11001;

const getDuplicateAccountMessage = (error) => {
  const duplicateField = Object.keys(error?.keyPattern || error?.keyValue || {})[0];

  if (duplicateField === 'email') {
    return 'Email is already registered. Please use another email or log in instead.';
  }

  if (duplicateField === 'phoneNumber') {
    return 'Phone number is already registered. Please use another phone number.';
  }

  return 'Account details already exist. Please use different information.';
};

const sendVerificationEmailWithTimeout = async (email, code, fullName) => {
  const timeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 8000);
  let timeoutId;

  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`Verification email timed out for ${email}`);
      resolve(false);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      sendVerificationEmail(email, code, fullName),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildClientUser = (user, extra = {}) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  phoneNumber: user.phoneNumber,
  address: user.address,
  street: user.street,
  regionCode: user.regionCode,
  regionName: user.regionName,
  provinceCode: user.provinceCode,
  provinceName: user.provinceName,
  cityCode: user.cityCode,
  cityName: user.cityName,
  brgyCode: user.brgyCode,
  brgyName: user.brgyName,
  zipCode: user.zipCode,
  photoURL: user.photoURL,
  role: user.role,
  isVerified: user.isVerified,
  isGoogleUser: Boolean(user.firebaseUID),
  ...extra,
});

const buildStaffClientUser = (user, extra = {}) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  fullName: user.fullName,
  firstName: user.firstName,
  lastName: user.lastName,
  employeeId: user.employeeId,
  employmentType: user.employmentType,
  position: user.position,
  systemRole: user.systemRole,
  accountStatus: user.accountStatus,
  phoneNumber: user.phoneNumber,
  address: user.address,
  hiredDate: user.hiredDate,
  dob: user.dob,
  gender: user.gender,
  emergencyContact: {
    name: user.emergencyContact?.name || '',
    relationship: user.emergencyContact?.relationship || '',
    contact: user.emergencyContact?.contact || '',
  },
  regionCode: user.regionCode,
  regionName: user.regionName,
  provinceCode: user.provinceCode,
  provinceName: user.provinceName,
  cityCode: user.cityCode,
  cityName: user.cityName,
  brgyCode: user.brgyCode,
  brgyName: user.brgyName,
  street: user.street,
  zipCode: user.zipCode,
  photoURL: user.photoURL,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  ...extra,
});

const buildFullAddressFromParts = ({
  street = '',
  brgyName = '',
  cityName = '',
  provinceName = '',
  regionName = '',
  zipCode = '',
}) => {
  const parts = [
    street,
    brgyName,
    cityName,
    provinceName,
    regionName,
    zipCode ? `${zipCode}, Philippines` : 'Philippines',
  ].filter(Boolean);

  return parts.join(', ');
};

const sendVerificationEmail = async (email, code, fullName) => {
  const mailOptions = {
    from: `"JJSTrack" <${emailFrom}>`,
    to: email,
    subject: 'Your JJSTrack Verification Code',
    attachments: [
      {
        filename: 'jjstrack-logo.png',
        path: logoPath,
        cid: logoCid,
      },
    ],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; color: white; }
          .logo { width: 86px; height: 86px; object-fit: contain; border-radius: 999px; background: white; padding: 8px; margin-bottom: 14px; }
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
            <img src="cid:${logoCid}" alt="JJSTrack Logo" class="logo" />
            <h1>JJSTrack</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Where Every Stitch Reflects Quality and Craftsmanship</p>
          </div>
          <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 10px;">Welcome, ${fullName}!</h2>
            <p class="message">Your account has been created successfully. Use the code below to verify your email:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p class="message" style="margin-bottom: 5px;">Enter this code in the app to complete your registration.</p>
            <div class="timer">This code expires in 60 seconds</div>
          </div>
          <div class="footer">
            <p>If you didn't create an account with JJSTrack, please ignore this email.</p>
            <p style="margin-top: 10px;">&copy; 2026 DevMinds &bull; JJSTrack</p>
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
    console.error('Email provider details:', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });
    return false;
  }
};

const validateUniquePhoneNumber = async (phoneNumber, currentUserId = null) => {
  if (!phoneNumber) return null;

  const query = { phoneNumber };

  if (currentUserId) {
    query._id = { $ne: currentUserId };
  }

  return userModel.findOne(query).select('_id email');
};

export const googleAuth = async (req, res) => {
  try {
    const { uid, email, fullName, photoURL } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
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
        if (!user.fullName) {
          user.fullName = fullName || user.email.split('@')[0];
        }
        user.photoURL = photoURL || user.photoURL;
        user.isVerified = true;
      }
      await user.save();
    } else {
      if (!user.fullName) {
        user.fullName = fullName || user.email.split('@')[0];
      }
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
      user: buildClientUser(user, { isGoogleUser: true }),
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
    res.json({ success: true, user: buildClientUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      firstName,
      lastName,
      phoneNumber,
      address,
      street,
      regionCode,
      regionName,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      brgyCode,
      brgyName,
      zipCode,
    } = req.body;

    const hasStructuredProfileUpdate = [
      firstName,
      lastName,
      street,
      regionCode,
      regionName,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      brgyCode,
      brgyName,
      zipCode,
    ].some((value) => typeof value !== 'undefined');

    const updateData = {};

    if (hasStructuredProfileUpdate) {
      const trimmedFirstName = String(firstName || '').trim();
      const trimmedLastName = String(lastName || '').trim();
      const trimmedPhoneNumber = normalizePhoneNumber(phoneNumber);
      const trimmedStreet = String(street || '').trim();
      const trimmedRegionCode = String(regionCode || '').trim();
      const trimmedRegionName = String(regionName || '').trim();
      const trimmedProvinceCode = String(provinceCode || '').trim();
      const trimmedProvinceName = String(provinceName || '').trim();
      const trimmedCityCode = String(cityCode || '').trim();
      const trimmedCityName = String(cityName || '').trim();
      const trimmedBrgyCode = String(brgyCode || '').trim();
      const trimmedBrgyName = String(brgyName || '').trim();
      const trimmedZipCode = String(zipCode || '').trim();

      if (!trimmedFirstName || !trimmedLastName) {
        return res.status(400).json({ success: false, message: 'First name and last name are required' });
      }

      if (!isValidPhilippineMobile(trimmedPhoneNumber)) {
        return res.status(400).json({ success: false, message: 'Phone number must be an 11-digit PH mobile number starting with 09' });
      }

      if (
        !trimmedStreet ||
        !trimmedRegionCode ||
        !trimmedRegionName ||
        !trimmedProvinceCode ||
        !trimmedProvinceName ||
        !trimmedCityCode ||
        !trimmedCityName ||
        !trimmedBrgyCode ||
        !trimmedBrgyName
      ) {
        return res.status(400).json({ success: false, message: 'Complete address details are required' });
      }

      if (!trimmedZipCode || trimmedZipCode.length !== 4) {
        return res.status(400).json({ success: false, message: 'ZIP code must be exactly 4 digits' });
      }

      const nextFullName = `${trimmedFirstName} ${trimmedLastName}`.trim();
      const nextAddress = String(address || '').trim() || buildFullAddressFromParts({
        street: trimmedStreet,
        brgyName: trimmedBrgyName,
        cityName: trimmedCityName,
        provinceName: trimmedProvinceName,
        regionName: trimmedRegionName,
        zipCode: trimmedZipCode,
      });

      Object.assign(updateData, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        fullName: nextFullName,
        phoneNumber: trimmedPhoneNumber,
        address: nextAddress,
        street: trimmedStreet,
        regionCode: trimmedRegionCode,
        regionName: trimmedRegionName,
        provinceCode: trimmedProvinceCode,
        provinceName: trimmedProvinceName,
        cityCode: trimmedCityCode,
        cityName: trimmedCityName,
        brgyCode: trimmedBrgyCode,
        brgyName: trimmedBrgyName,
        zipCode: trimmedZipCode,
      });
    } else {
      if (typeof fullName !== 'undefined') {
        const trimmedFullName = String(fullName).trim();
        if (!trimmedFullName) {
          return res.status(400).json({ success: false, message: 'Full name is required' });
        }
        updateData.fullName = trimmedFullName;
      }

      if (typeof phoneNumber !== 'undefined') {
        const trimmedPhoneNumber = normalizePhoneNumber(phoneNumber);
        if (!isValidPhilippineMobile(trimmedPhoneNumber)) {
          return res.status(400).json({ success: false, message: 'Phone number must be an 11-digit PH mobile number starting with 09' });
        }
        updateData.phoneNumber = trimmedPhoneNumber;
      }

      if (typeof address !== 'undefined') {
        const trimmedAddress = String(address).trim();
        if (!trimmedAddress) {
          return res.status(400).json({ success: false, message: 'Address is required' });
        }
        updateData.address = trimmedAddress;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No profile changes provided' });
    }

    if (updateData.phoneNumber) {
      const existingPhoneUser = await validateUniquePhoneNumber(updateData.phoneNumber, req.userId);

      if (existingPhoneUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number is already registered. Please use another phone number.',
        });
      }
    }

    const user = await userModel.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: buildClientUser(user) });
  } catch (error) {
    console.error('Update User Profile Error:', error);
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: getDuplicateAccountMessage(error) });
    }
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

// Register with Email & Password (backend only)
export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      firstName,
      lastName,
      phone,
      address,
      street,
      regionCode,
      regionName,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      brgyCode,
      brgyName,
      zipCode
    } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!isValidPhilippineMobile(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be an 11-digit PH mobile number starting with 09' });
    }

    let user = await userModel.findOne({ email: normalizedEmail });

    if (user) {
      return res.status(409).json({
        success: false,
        message: user.password
          ? 'Email is already registered. Please log in instead.'
          : 'This email is already linked to Google sign-in. Please continue with Google.',
      });
    }

    const existingPhoneUser = await validateUniquePhoneNumber(normalizedPhone);

    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: 'Phone number is already registered. Please use another phone number.',
      });
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
    const hashedPassword = await bcrypt.hash(String(password), 10);

    user = new userModel({
      email: normalizedEmail,
      password: hashedPassword,
      fullName: String(fullName).trim(),
      firstName: String(firstName || '').trim(),
      lastName: String(lastName || '').trim(),
      phoneNumber: normalizedPhone,
      address: String(address || '').trim(),
      street: String(street || '').trim(),
      regionCode: String(regionCode || '').trim(),
      regionName: String(regionName || '').trim(),
      provinceCode: String(provinceCode || '').trim(),
      provinceName: String(provinceName || '').trim(),
      cityCode: String(cityCode || '').trim(),
      cityName: String(cityName || '').trim(),
      brgyCode: String(brgyCode || '').trim(),
      brgyName: String(brgyName || '').trim(),
      zipCode: String(zipCode || '').trim(),
      isVerified: false,
      verificationCode,
      verificationCodeExpiry: codeExpiry,
    });
    await user.save();

    const emailSent = await sendVerificationEmailWithTimeout(user.email, verificationCode, user.fullName);

    if (!emailSent) {
      await userModel.deleteOne({ _id: user._id, isVerified: false });

      return res.status(503).json({
        success: false,
        message: 'We could not send the verification email right now. Please check the backend email credentials and try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for a 6-digit verification code.',
      email: user.email,
      expiresIn: Math.floor(VERIFICATION_CODE_TTL_MS / 1000),
      expiresAt: user.verificationCodeExpiry,
    });
  } catch (error) {
    console.error('Register Error:', error);
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: getDuplicateAccountMessage(error) });
    }
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

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Check if code expired
    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ success: false, message: 'Verification code expired after 60 seconds. Please request a new one.' });
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

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate and send first. Only save it if the email provider accepts the message.
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
    const emailSent = await sendVerificationEmailWithTimeout(normalizedEmail, verificationCode, user.fullName);

    if (!emailSent) {
      return res.status(503).json({
        success: false,
        message: 'We could not send the verification email right now. Please check the backend email credentials and try again.'
      });
    }

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = codeExpiry;
    await user.save();

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: Math.floor(VERIFICATION_CODE_TTL_MS / 1000),
      expiresAt: user.verificationCodeExpiry,
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
      user: buildClientUser(user, { isVerified: user.isVerified }),
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
      from: `"JJSTrack" <${emailFrom}>`,
      to: email,
      subject: 'JJSTrack Password Reset Code',
      attachments: [
        {
          filename: 'jjstrack-logo.png',
          path: logoPath,
          cid: logoCid,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; color: white; }
            .logo { width: 86px; height: 86px; object-fit: contain; border-radius: 999px; background: white; padding: 8px; margin-bottom: 14px; }
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
              <img src="cid:${logoCid}" alt="JJSTrack Logo" class="logo" />
              <h1>JJSTrack</h1>
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
              <p style="margin-top: 10px;">&copy; 2026 DevMinds &bull; JJSTrack</p>
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
      regionCode,
      regionName,
      provinceCode,
      provinceName,
      cityCode,
      cityName,
      brgyCode,
      brgyName,
      zipCode,
    } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!firstName || !lastName || !normalizedPhone || !address || !street || !provinceName || !cityName || !brgyName) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, phone number, and full address details are required'
      });
    }

    if (!isValidPhilippineMobile(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be an 11-digit PH mobile number starting with 09' });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingPhoneUser = await validateUniquePhoneNumber(normalizedPhone, userId);

    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: 'Phone number is already registered. Please use another phone number.',
      });
    }

    user.firstName = String(firstName).trim();
    user.lastName = String(lastName).trim();
    user.fullName = `${user.firstName} ${user.lastName}`.trim();
    user.phoneNumber = normalizedPhone;
    user.address = String(address).trim();
    user.street = String(street).trim();
    user.provinceCode = String(provinceCode || '').trim();
    user.provinceName = String(provinceName).trim();
    user.cityCode = String(cityCode || '').trim();
    user.cityName = String(cityName).trim();
    user.brgyCode = String(brgyCode || '').trim();
    user.brgyName = String(brgyName).trim();
    user.regionCode = String(regionCode || '').trim();
    user.regionName = String(regionName || '').trim();
    user.zipCode = String(zipCode || '').trim();
    await user.save();

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: buildClientUser(user, { isGoogleUser: true }),
    });
  } catch (error) {
    console.error('Complete Google Profile Error:', error);
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: getDuplicateAccountMessage(error) });
    }
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
      staff: buildStaffClientUser(staffAccount),
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

export const getStaffSession = async (req, res) => {
  try {
    if (!req.userId || req.userRole !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as staff'
      });
    }

    const staffAccount = await userModel.findById(req.userId).select(
      'email role fullName firstName lastName employeeId employmentType position systemRole accountStatus phoneNumber address hiredDate dob gender emergencyContact regionCode regionName provinceCode provinceName cityCode cityName brgyCode brgyName street zipCode photoURL lastLoginAt createdAt'
    );

    if (!staffAccount || staffAccount.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Account no longer has staff access'
      });
    }

    if (staffAccount.accountStatus && staffAccount.accountStatus !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your staff account is not active. Please contact admin.'
      });
    }

    return res.json({
      success: true,
      staff: buildStaffClientUser(staffAccount),
    });
  } catch (error) {
    console.error('Get Staff Session Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staff session'
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
