const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all rides with filters
// @route   GET /api/rides
// @access  Public
const getRides = async (req, res) => {
  try {
    const {
      pickup,
      destination,
      date,
      vehicleType,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // First, mark any expired rides
    await Ride.markExpiredRides();

    // Build filter object - only include active rides for search
    const filter = { 
      status: 'active' // Only show active rides in search results
    };
    
    // Always exclude past rides (rides before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filter.date = { $gte: today };
    
    if (pickup) {
      filter.pickupLocation = { $regex: pickup, $options: 'i' };
    }
    
    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    if (maxPrice) {
      filter.pricePerSeat = { $lte: parseFloat(maxPrice) };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'price') {
      sort.pricePerSeat = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'seats') {
      sort.availableSeats = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get rides with provider details
    const rides = await Ride.find(filter)
      .populate('providerId', 'name email phone averageRating totalReviews')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Ride.countDocuments(filter);

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRides: total,
          hasNext: skip + rides.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rides'
    });
  }
};

// @desc    Get single ride details
// @route   GET /api/rides/:id
// @access  Public
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('providerId', 'name email phone averageRating totalReviews');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get bookings for this ride
    const bookings = await Booking.find({ rideId: ride._id, status: { $in: ['confirmed', 'completed'] } })
      .populate('studentId', 'name email phone');

    res.json({
      success: true,
      data: {
        ride,
        bookings
      }
    });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ride'
    });
  }
};

// @desc    Create new ride
// @route   POST /api/rides
// @access  Private (Staff only)
const createRide = async (req, res) => {
  try {
    const rideData = {
      ...req.body,
      providerId: req.user._id
    };

    const ride = new Ride(rideData);
    await ride.save();

    // Populate provider details
    await ride.populate('providerId', 'name email phone averageRating totalReviews');

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: { ride }
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating ride'
    });
  }
};

// @desc    Update ride
// @route   PUT /api/rides/:id
// @access  Private (Staff only - own rides)
const updateRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user owns the ride
    if (ride.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ride'
      });
    }

    // Check if ride has confirmed bookings
    const confirmedBookings = await Booking.countDocuments({
      rideId: ride._id,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (confirmedBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update ride with confirmed bookings'
      });
    }

    // Update ride
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        ride[key] = req.body[key];
      }
    });

    await ride.save();
    await ride.populate('providerId', 'name email phone averageRating totalReviews');

    res.json({
      success: true,
      message: 'Ride updated successfully',
      data: { ride }
    });
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating ride'
    });
  }
};

// @desc    Delete ride (soft delete - mark as cancelled)
// @route   DELETE /api/rides/:id
// @access  Private (Staff only - own rides)
const deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user owns the ride
    if (ride.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ride'
      });
    }

    // Get all bookings for this ride
    const bookings = await Booking.find({
      rideId: ride._id,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('studentId', 'name email');

    // Soft delete - mark as cancelled instead of actually deleting
    ride.status = 'cancelled';
    await ride.save();

    // Update all pending/confirmed bookings to cancelled
    if (bookings.length > 0) {
      await Booking.updateMany(
        { rideId: ride._id, status: { $in: ['pending', 'confirmed'] } },
        { 
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: 'Ride cancelled by provider'
        }
      );

      // Create notifications for all affected students
      const notifications = bookings.map(booking => ({
        userId: booking.studentId._id,
        title: 'Ride Cancelled',
        message: `Your ride from ${ride.pickupLocation} to ${ride.destination} has been cancelled by the provider`,
        type: 'cancellation',
        relatedId: booking._id,
        relatedType: 'booking',
        priority: 'high'
      }));

      await Notification.insertMany(notifications);

      // Emit socket events to notify students in real-time
      const io = req.app.get('io');
      bookings.forEach(booking => {
        io.to(`user_${booking.studentId._id}`).emit('ride_cancelled', {
          rideId: ride._id,
          bookingId: booking._id,
          message: `Your ride from ${ride.pickupLocation} to ${ride.destination} has been cancelled`
        });
      });
    }

    res.json({
      success: true,
      message: 'Ride cancelled successfully'
    });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting ride'
    });
  }
};

// @desc    Get user's rides
// @route   GET /api/rides/my-rides
// @access  Private (Staff only)
const getMyRides = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, includeExpired = false } = req.query;

    // First, mark any expired rides and then mark old expired rides as completed
    await Ride.markExpiredRides();
    await Ride.markExpiredRidesAsCompleted();

    const filter = { providerId: req.user._id };
    
    // If status is specified, use it; otherwise filter based on includeExpired
    if (status) {
      filter.status = status;
    } else if (includeExpired === 'true') {
      // Include all rides (active, completed, cancelled, expired) for history
      // No additional filter needed
    } else {
      // Default: only show active and completed rides (exclude expired and cancelled)
      filter.status = { $in: ['active', 'completed'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rides = await Ride.find(filter)
      .populate('providerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ride.countDocuments(filter);

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRides: total,
          hasNext: skip + rides.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get my rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your rides'
    });
  }
};

// @desc    Get user's ride history (including expired rides)
// @route   GET /api/rides/my-rides/history
// @access  Private (Staff only)
const getMyRideHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // First, mark any expired rides and then mark old expired rides as completed
    await Ride.markExpiredRides();
    await Ride.markExpiredRidesAsCompleted();

    const filter = { providerId: req.user._id };
    
    // Include all rides for history (active, completed, cancelled, expired)
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rides = await Ride.find(filter)
      .populate('providerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ride.countDocuments(filter);

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRides: total,
          hasNext: skip + rides.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ride history'
    });
  }
};

module.exports = {
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  getMyRides,
  getMyRideHistory
};
