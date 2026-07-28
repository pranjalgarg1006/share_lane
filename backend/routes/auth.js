const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  getProfile,
  updateProfile,
  validateStaff
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateOtpVerification,
  validateResendOtp
} = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Send OTP for registration
// @access  Public
router.post('/register', validateUserRegistration, register);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post('/verify-otp', validateOtpVerification, verifyOtp);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for registration
// @access  Public
router.post('/resend-otp', validateResendOtp, resendOtp);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, updateProfile);

// @route   GET /api/auth/validate-staff
// @desc    Validate staff authorization
// @access  Private
router.get('/validate-staff', authenticate, validateStaff);

module.exports = router;
