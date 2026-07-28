const cron = require('node-cron');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Schedule job to run every minute to check for expired rides
const scheduleRideExpiration = (io) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Checking for expired rides...');
      const expiredCount = await Ride.markExpiredRides();
      
      if (expiredCount > 0) {
        console.log(`Successfully marked ${expiredCount} rides as expired`);
        
        // Emit socket events for completed bookings
        if (io) {
          const completedBookings = await Booking.find({
            status: 'completed',
            completedAt: { $gte: new Date(Date.now() - 60000) } // Last minute
          }).populate('studentId', 'name email').populate('rideId', 'pickupLocation destination');
          
          completedBookings.forEach(booking => {
            io.to(`user_${booking.studentId._id}`).emit('booking_completed', {
              bookingId: booking._id,
              message: `Your ride from ${booking.rideId.pickupLocation} to ${booking.rideId.destination} has been completed`,
              rideDetails: {
                pickupLocation: booking.rideId.pickupLocation,
                destination: booking.rideId.destination
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Error in ride expiration scheduler:', error);
    }
  });
  
  console.log('Ride expiration scheduler started - checking every minute');
};

// Alternative: Run every 5 minutes for better performance
const scheduleRideExpirationEvery5Minutes = (io) => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking for expired rides (every 5 minutes)...');
      const expiredCount = await Ride.markExpiredRides();
      
      if (expiredCount > 0) {
        console.log(`Successfully marked ${expiredCount} rides as expired`);
        
        // Emit socket events for completed bookings and clean up rejected bookings
        if (io) {
          const completedBookings = await Booking.find({
            status: 'completed',
            completedAt: { $gte: new Date(Date.now() - 300000) } // Last 5 minutes
          }).populate('studentId', 'name email').populate('rideId', 'pickupLocation destination');
          
          completedBookings.forEach(booking => {
            io.to(`user_${booking.studentId._id}`).emit('booking_completed', {
              bookingId: booking._id,
              message: `Your ride from ${booking.rideId.pickupLocation} to ${booking.rideId.destination} has been completed`,
              rideDetails: {
                pickupLocation: booking.rideId.pickupLocation,
                destination: booking.rideId.destination
              }
            });
          });

          // Clean up rejected bookings after ride completion
          const rejectedBookings = await Booking.find({
            status: 'cancelled',
            cancelledAt: { $gte: new Date(Date.now() - 300000) }, // Last 5 minutes
            cancellationReason: { $regex: /rejected|reject/i } // Only staff rejections
          }).populate('studentId', 'name email').populate('rideId', 'pickupLocation destination');
          
          if (rejectedBookings.length > 0) {
            console.log(`Cleaning up ${rejectedBookings.length} rejected bookings`);
            
            // Emit cleanup event to remove from Recent Bookings
            rejectedBookings.forEach(booking => {
              io.to(`user_${booking.studentId._id}`).emit('booking_removed', {
                bookingId: booking._id,
                message: 'Your rejected booking has been removed from recent bookings',
                reason: 'rejected_by_staff'
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in ride expiration scheduler:', error);
    }
  });
  
  console.log('Ride expiration scheduler started - checking every 5 minutes');
};

module.exports = {
  scheduleRideExpiration,
  scheduleRideExpirationEvery5Minutes
};



