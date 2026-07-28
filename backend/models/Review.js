const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: [true, 'Ride ID is required']
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required']
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee ID is required']
  },
  reviewerRole: {
    type: String,
    enum: ['staff', 'student'],
    required: [true, 'Reviewer role is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one review per user per ride
reviewSchema.index({ rideId: 1, reviewerId: 1 }, { unique: true });

// Index for efficient queries
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ rideId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
