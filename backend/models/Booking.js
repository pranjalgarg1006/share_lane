const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: [true, 'Ride ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  seatsBooked: {
    type: Number,
    required: [true, 'Number of seats booked is required'],
    min: [1, 'At least 1 seat must be booked'],
    max: [8, 'Maximum 8 seats can be booked']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    default: ''
  },
  refundId: {
    type: String,
    default: ''
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [300, 'Special requests cannot exceed 300 characters']
  },
  contactPhone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  pickupNotes: {
    type: String,
    trim: true,
    maxlength: [200, 'Pickup notes cannot exceed 200 characters']
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  }
});

// Index for efficient queries
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ rideId: 1, status: 1 });
bookingSchema.index({ paymentIntentId: 1 });

// Virtual for booking reference
bookingSchema.virtual('bookingReference').get(function() {
  return `BR${this._id.toString().slice(-8).toUpperCase()}`;
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
