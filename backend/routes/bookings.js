const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getRideBookings,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private (Student only)
router.post('/', authenticate, authorize('student'), validateBooking, createBooking);

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', authenticate, getMyBookings);

// @route   GET /api/bookings/ride/:rideId
// @desc    Get bookings for a specific ride
// @access  Private (Staff only)
router.get('/ride/:rideId', authenticate, authorize('staff'), getRideBookings);

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', authenticate, updateBookingStatus);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private (Student only)
router.put('/:id/cancel', authenticate, authorize('student'), cancelBooking);

module.exports = router;
