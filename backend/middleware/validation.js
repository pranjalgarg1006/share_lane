const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['staff', 'student'])
    .withMessage('Role must be either staff or student'),
  body('phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// OTP verification validation
const validateOtpVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  handleValidationErrors
];

// Resend OTP validation
const validateResendOtp = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

// Ride creation validation
const validateRideCreation = [
  body('pickupLocation')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Pickup location must be between 2 and 100 characters'),
  body('destination')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Ride date must be in the future');
      }
      return true;
    }),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time (HH:MM)'),
  body('availableSeats')
    .isInt({ min: 1, max: 8 })
    .withMessage('Available seats must be between 1 and 8'),
  body('totalSeats')
    .isInt({ min: 1, max: 8 })
    .withMessage('Total seats must be between 1 and 8'),
  body('pricePerSeat')
    .isFloat({ min: 0 })
    .withMessage('Price per seat must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors
];

// Booking validation
const validateBooking = [
  body('rideId')
    .isMongoId()
    .withMessage('Please provide a valid ride ID'),
  body('seatsBooked')
    .isInt({ min: 1, max: 8 })
    .withMessage('Seats booked must be between 1 and 8'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Special requests cannot exceed 300 characters'),
  body('contactPhone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('pickupNotes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Pickup notes cannot exceed 200 characters'),
  handleValidationErrors
];

// Review validation
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateOtpVerification,
  validateResendOtp,
  validateRideCreation,
  validateBooking,
  validateReview
};
