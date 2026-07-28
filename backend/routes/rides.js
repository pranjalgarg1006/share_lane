const express = require('express');
const router = express.Router();
const {
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  getMyRides,
  getMyRideHistory
} = require('../controllers/rideController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRideCreation } = require('../middleware/validation');

// @route   GET /api/rides
// @desc    Get all rides with filters
// @access  Public
router.get('/', getRides);

// @route   GET /api/rides/my-rides
// @desc    Get current user's rides
// @access  Private (Staff only)
router.get('/my-rides', authenticate, authorize('staff'), getMyRides);

// @route   GET /api/rides/my-rides/history
// @desc    Get current user's ride history (including expired rides)
// @access  Private (Staff only)
router.get('/my-rides/history', authenticate, authorize('staff'), getMyRideHistory);

// @route   GET /api/rides/:id
// @desc    Get single ride details
// @access  Public
router.get('/:id', getRideById);

// @route   POST /api/rides
// @desc    Create new ride
// @access  Private (Staff only)
router.post('/', authenticate, authorize('staff'), validateRideCreation, createRide);

// @route   PUT /api/rides/:id
// @desc    Update ride
// @access  Private (Staff only - own rides)
router.put('/:id', authenticate, authorize('staff'), updateRide);

// @route   DELETE /api/rides/:id
// @desc    Delete ride
// @access  Private (Staff only - own rides)
router.delete('/:id', authenticate, authorize('staff'), deleteRide);

module.exports = router;
