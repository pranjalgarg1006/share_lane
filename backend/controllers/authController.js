const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { validationResult } = require('express-validator');
const { isAuthorizedStaff } = require('../config/staffWhitelist');
const { sendOTPEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP for registration
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if user is trying to register as staff but is not authorized
    if (role === 'staff' && !isAuthorizedStaff(email)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to register as staff. Please contact administrator or register as a student.'
      });
    }

    // Check if EMAIL_USER and EMAIL_PASS are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact administrator.'
      });
    }

    // Delete any existing OTP for this email
    await OtpVerification.deleteMany({ email });

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with user data (password will be hashed when user is created)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    const otpVerification = new OtpVerification({
      email,
      otp,
      userData: {
        name,
        password, // Store plain password, will be hashed when user is created
        role,
        phone
      },
      expiresAt
    });

    await otpVerification.save();

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      // If email fails, delete the OTP record
      await OtpVerification.deleteOne({ email });
      console.error('Email sending error in register:', emailError);
      return res.status(500).json({
        success: false,
        message: emailError.message || 'Failed to send verification email. Please check your email configuration and try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      data: {
        email: email // Return email for frontend reference
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find the OTP verification record
    const otpRecord = await OtpVerification.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts > 0 ? `You have ${remainingAttempts} attempt(s) remaining.` : 'Maximum attempts exceeded.'}`
      });
    }

    // Check if user already exists (race condition check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if user is trying to register as staff but is not authorized
    if (otpRecord.userData.role === 'staff' && !isAuthorizedStaff(email)) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to register as staff. Please contact administrator or register as a student.'
      });
    }

    // Create user
    const user = new User({
      name: otpRecord.userData.name,
      email: email,
      password: otpRecord.userData.password, // Will be hashed by pre-save hook
      role: otpRecord.userData.role,
      phone: otpRecord.userData.phone,
      isVerified: true
    });

    await user.save();

    // Delete OTP record after successful verification
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered and verified successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews
        },
        token
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Find existing OTP record
    const existingOtp = await OtpVerification.findOne({ email }).sort({ createdAt: -1 });

    if (!existingOtp) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found. Please register again.'
      });
    }

    // Check if EMAIL_USER and EMAIL_PASS are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact administrator.'
      });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Update OTP record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    existingOtp.otp = otp;
    existingOtp.expiresAt = expiresAt;
    existingOtp.attempts = 0; // Reset attempts
    await existingOtp.save();

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp, existingOtp.userData.name);
    } catch (emailError) {
      console.error('Email sending error in resendOtp:', emailError);
      return res.status(500).json({
        success: false,
        message: emailError.message || 'Failed to send verification email. Please check your email configuration and try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent to your email. Please verify to complete registration.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is trying to login as staff but is not authorized
    if (user.role === 'staff' && !isAuthorizedStaff(email)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access staff features. Please contact administrator.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Validate staff authorization
// @route   GET /api/auth/validate-staff
// @access  Private
const validateStaff = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is staff and authorized
    if (user.role === 'staff' && isAuthorizedStaff(user.email)) {
      return res.json({
        success: true,
        message: 'Staff authorization valid'
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Staff authorization invalid'
      });
    }
  } catch (error) {
    console.error('Staff validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during staff validation'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  getProfile,
  updateProfile,
  validateStaff
};
