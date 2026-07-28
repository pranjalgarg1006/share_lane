const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { rideId, revieweeId, rating, comment, isAnonymous } = req.body;
    const reviewerId = req.user._id;
    const reviewerRole = req.user.role;

    // Check if user has completed a booking for this ride
    const booking = await Booking.findOne({
      rideId,
      studentId: reviewerId,
      status: 'completed'
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'You can only review rides you have completed'
      });
    }

    // Check if user already reviewed this ride
    const existingReview = await Review.findOne({
      rideId,
      reviewerId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this ride'
      });
    }

    // Create review
    const review = new Review({
      rideId,
      reviewerId,
      revieweeId,
      reviewerRole,
      rating,
      comment,
      isAnonymous
    });

    await review.save();

    // Update user's average rating
    await updateUserRating(revieweeId);

    // Create notification for reviewee
    await Notification.create({
      userId: revieweeId,
      title: 'New Review Received',
      message: `You received a ${rating}-star review`,
      type: 'review',
      relatedId: review._id,
      relatedType: 'review',
      priority: 'medium'
    });

    // Populate review details
    await review.populate([
      { path: 'reviewerId', select: 'name' },
      { path: 'revieweeId', select: 'name' },
      { path: 'rideId', select: 'pickupLocation destination date' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review'
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name')
      .populate('rideId', 'pickupLocation destination date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ revieweeId: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          hasNext: skip + reviews.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
};

// @desc    Get ride reviews
// @route   GET /api/reviews/ride/:rideId
// @access  Public
const getRideReviews = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ rideId })
      .populate('reviewerId', 'name')
      .populate('revieweeId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ rideId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          hasNext: skip + reviews.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get ride reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ride reviews'
    });
  }
};

// @desc    Get user's given reviews
// @route   GET /api/reviews/given
// @access  Private
const getGivenReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ reviewerId: userId })
      .populate('revieweeId', 'name')
      .populate('rideId', 'pickupLocation destination date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ reviewerId: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          hasNext: skip + reviews.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get given reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching given reviews'
    });
  }
};

// Helper function to update user's average rating
const updateUserRating = async (userId) => {
  try {
    const reviews = await Review.find({ revieweeId: userId });
    
    if (reviews.length === 0) {
      await User.findByIdAndUpdate(userId, {
        averageRating: 0,
        totalReviews: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(userId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Update user rating error:', error);
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getRideReviews,
  getGivenReviews
};
