const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getRideReviews,
  getGivenReviews
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

// @route   POST /api/reviews
// @desc    Create review
// @access  Private
router.post('/', authenticate, validateReview, createReview);

// @route   GET /api/reviews/user/:userId
// @desc    Get user's reviews
// @access  Public
router.get('/user/:userId', getUserReviews);

// @route   GET /api/reviews/ride/:rideId
// @desc    Get ride reviews
// @access  Public
router.get('/ride/:rideId', getRideReviews);

// @route   GET /api/reviews/given
// @desc    Get user's given reviews
// @access  Private
router.get('/given', authenticate, getGivenReviews);

module.exports = router;
