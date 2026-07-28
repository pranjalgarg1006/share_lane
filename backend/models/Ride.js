const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider ID is required']
  },
  pickupLocation: {
    type: String,
    required: [true, 'Pickup location is required'],
    trim: true,
    maxlength: [100, 'Pickup location cannot exceed 100 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [100, 'Destination cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [1, 'At least 1 seat must be available'],
    max: [8, 'Maximum 8 seats allowed']
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'At least 1 seat must be available'],
    max: [8, 'Maximum 8 seats allowed']
  },
  pricePerSeat: {
    type: Number,
    required: [true, 'Price per seat is required'],
    min: [0, 'Price cannot be negative']
  },
  bookingAmount: {
    type: Number,
    required: false, // Optional - kept for backward compatibility
    min: [0, 'Booking amount cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  vehicleType: {
    type: String,
    enum: ['car', 'van', 'bus'],
    default: 'car'
  },
  meetingPoint: {
    type: String,
    trim: true,
    maxlength: [200, 'Meeting point cannot exceed 200 characters']
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if ride has expired
rideSchema.methods.isExpired = function() {
  const now = new Date();
  const rideDateTime = new Date(this.date);
  
  // Parse time string (HH:MM) and set it to the ride date
  const [hours, minutes] = this.time.split(':').map(Number);
  rideDateTime.setHours(hours, minutes, 0, 0);
  
  return now > rideDateTime;
};

// Method to get combined date and time
rideSchema.methods.getRideDateTime = function() {
  const rideDateTime = new Date(this.date);
  const [hours, minutes] = this.time.split(':').map(Number);
  rideDateTime.setHours(hours, minutes, 0, 0);
  return rideDateTime;
};

// Validate that availableSeats doesn't exceed totalSeats
rideSchema.pre('save', function(next) {
  if (this.availableSeats > this.totalSeats) {
    next(new Error('Available seats cannot exceed total seats'));
  } else {
    next();
  }
});

// Validate that the combined date and time is in the future
rideSchema.pre('save', function(next) {
  if (this.isModified('date') || this.isModified('time') || this.isNew) {
    const rideDateTime = this.getRideDateTime();
    const now = new Date();
    
    if (rideDateTime <= now) {
      next(new Error('Ride must be scheduled in the future'));
    } else {
      next();
    }
  } else {
    next();
  }
});

// Pre-save hook to automatically mark rides as expired
rideSchema.pre('save', function(next) {
  if (this.isModified('date') || this.isModified('time') || this.isNew) {
    if (this.isExpired() && this.status === 'active') {
      this.status = 'expired';
    }
  }
  next();
});

// Static method to mark expired rides
rideSchema.statics.markExpiredRides = async function() {
  const now = new Date();
  
  // Find all active rides that should be expired
  const activeRides = await this.find({ status: 'active' });
  
  const expiredRideIds = [];
  
  for (const ride of activeRides) {
    if (ride.isExpired()) {
      expiredRideIds.push(ride._id);
    }
  }
  
  if (expiredRideIds.length > 0) {
    // Mark rides as expired
    await this.updateMany(
      { _id: { $in: expiredRideIds } },
      { status: 'expired' }
    );
    
    // Update all pending/confirmed bookings for these rides to completed
    const Booking = require('./Booking');
    const Notification = require('./Notification');
    
    const bookings = await Booking.find({
      rideId: { $in: expiredRideIds },
      status: { $in: ['pending', 'confirmed'] }
    }).populate('studentId', 'name email').populate('rideId', 'pickupLocation destination');
    
    if (bookings.length > 0) {
      // Update booking status to completed
      await Booking.updateMany(
        { rideId: { $in: expiredRideIds }, status: { $in: ['pending', 'confirmed'] } },
        { 
          status: 'completed',
          completedAt: new Date()
        }
      );
      
      // Create notifications for students
      const notifications = bookings.map(booking => ({
        userId: booking.studentId._id,
        title: 'Ride Completed',
        message: `Your ride from ${booking.rideId.pickupLocation} to ${booking.rideId.destination} has been completed`,
        type: 'completion',
        relatedId: booking._id,
        relatedType: 'booking',
        priority: 'medium'
      }));
      
      await Notification.insertMany(notifications);
      
      console.log(`Updated ${bookings.length} bookings to completed for expired rides`);
    }
    
    console.log(`Marked ${expiredRideIds.length} rides as expired`);
  }
  
  return expiredRideIds.length;
};

// Static method to mark expired rides as completed after 24 hours
rideSchema.statics.markExpiredRidesAsCompleted = async function() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Find rides that expired more than 24 hours ago
  const expiredRides = await this.find({ 
    status: 'expired',
    date: { $lt: oneDayAgo }
  });
  
  if (expiredRides.length > 0) {
    await this.updateMany(
      { _id: { $in: expiredRides.map(ride => ride._id) } },
      { status: 'completed' }
    );
    
    console.log(`Marked ${expiredRides.length} expired rides as completed`);
  }
  
  return expiredRides.length;
};

// Index for efficient queries
rideSchema.index({ pickupLocation: 'text', destination: 'text' });
rideSchema.index({ date: 1, status: 1 });
rideSchema.index({ providerId: 1 });

module.exports = mongoose.model('Ride', rideSchema);
