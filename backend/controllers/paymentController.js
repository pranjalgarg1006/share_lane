const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendBookingConfirmationEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Initialize Razorpay
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('⚠️ Razorpay keys are not configured in environment variables');
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay:', error);
}

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private (Student only)
const createOrder = async (req, res) => {
  try {
    // Check if Razorpay is initialized
    if (!razorpay) {
      console.error('Razorpay not initialized - missing environment variables');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway is not configured. Please contact support.'
      });
    }

    const { rideId, seatsBooked } = req.body;

    // Validate input
    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required'
      });
    }

    if (!seatsBooked || seatsBooked <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of seats'
      });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if ride is active
    if (ride.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not available for booking'
      });
    }

    // Check if enough seats are available
    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available'
      });
    }

    // Calculate total amount (pricePerSeat * seatsBooked)
    const amount = ride.pricePerSeat * seatsBooked;

    if (!ride.pricePerSeat || ride.pricePerSeat <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price per seat. Please contact support.'
      });
    }

    if (!seatsBooked || seatsBooked <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of seats.'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (Razorpay uses paise)
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: {
        rideId: ride._id.toString(),
        studentId: req.user._id.toString(),
        seatsBooked: seatsBooked.toString(),
        pickupLocation: ride.pickupLocation,
        destination: ride.destination
      }
    };

    console.log('Creating Razorpay order with options:', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created successfully:', order.id);

    if (!process.env.RAZORPAY_KEY_ID) {
      console.error('⚠️ RAZORPAY_KEY_ID is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration error. Please contact support.'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    // Handle Razorpay API errors
    if (error.error) {
      console.error('Razorpay API error:', error.error);
      return res.status(400).json({
        success: false,
        message: error.error.description || 'Failed to create payment order'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify and confirm payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, rideId, seatsBooked, specialRequests, contactPhone, pickupNotes } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is incomplete'
      });
    }

    if (!rideId || !seatsBooked) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID and seats booked are required'
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment verification is not configured. Please contact support.'
      });
    }

    // Verify payment signature
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if ride is active
    if (ride.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not available for booking'
      });
    }

    // Check if enough seats are available
    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available'
      });
    }

    // Check if student already has a booking for this ride
    const existingBooking = await Booking.findOne({
      rideId,
      studentId: req.user._id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this ride'
      });
    }

    // Calculate total price (pricePerSeat * seatsBooked)
    const totalPrice = ride.pricePerSeat * seatsBooked;
    
    if (!ride.pricePerSeat || ride.pricePerSeat <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price per seat. Please contact support.'
      });
    }

    if (!seatsBooked || seatsBooked <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of seats.'
      });
    }

    // Create booking with pending status (admin needs to confirm)
    const booking = new Booking({
      rideId,
      studentId: req.user._id,
      seatsBooked,
      totalPrice,
      specialRequests,
      contactPhone,
      pickupNotes,
      paymentStatus: 'paid',
      status: 'pending', // Set to pending - admin will confirm or reject
      paymentIntentId: paymentId
    });

    await booking.save();

    // Update available seats
    ride.availableSeats -= seatsBooked;
    await ride.save();

    // Populate booking details
    await booking.populate([
      { 
        path: 'rideId', 
        select: 'pickupLocation destination date time bookingAmount',
        populate: {
          path: 'providerId',
          select: 'name email phone'
        }
      },
      { path: 'studentId', select: 'name email phone' }
    ]);

    // Send booking confirmation email to student (payment received, waiting for admin confirmation)
    try {
      const provider = booking.rideId.providerId;
      const student = booking.studentId;
      const ride = booking.rideId;

      console.log('Attempting to send booking confirmation email to:', student.email);
      
      await sendBookingConfirmationEmail({
        studentEmail: student.email,
        studentName: student.name,
        bookingReference: booking.bookingReference,
        seatsBooked: booking.seatsBooked,
        totalPrice: booking.totalPrice,
        pickupLocation: ride.pickupLocation,
        destination: ride.destination,
        rideDate: ride.date,
        rideTime: ride.time,
        providerName: provider.name,
        providerEmail: provider.email,
        providerPhone: provider.phone,
        specialRequests: booking.specialRequests,
        pickupNotes: booking.pickupNotes,
        bookedAt: booking.bookedAt
      });
      console.log('✅ Booking confirmation email sent successfully to:', student.email);
    } catch (emailError) {
      // Log detailed error but don't fail the booking creation
      console.error('❌ Failed to send booking confirmation email:', emailError.message);
      console.error('Error stack:', emailError.stack);
      // Continue with the booking creation even if email fails
    }

    // Create notification for staff
    await Notification.create({
      userId: ride.providerId,
      title: 'New Booking Received',
      message: `You have a new booking for ${seatsBooked} seat(s) on your ride to ${ride.destination}`,
      type: 'booking',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    // Create notification for student
    await Notification.create({
      userId: req.user._id,
      title: 'Payment Confirmed',
      message: 'Your payment has been confirmed. Booking is pending admin confirmation.',
      type: 'payment',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    // Emit real-time notification to staff
    const io = req.app.get('io');
    const providerId = ride.providerId._id || ride.providerId;
    const roomName = `user_${providerId}`;
    
    io.to(roomName).emit('new_booking', {
      bookingId: booking._id,
      studentName: booking.studentId.name,
      studentEmail: booking.studentId.email,
      studentPhone: booking.studentId.phone,
      seatsBooked: booking.seatsBooked,
      totalPrice: booking.totalPrice,
      specialRequests: booking.specialRequests,
      pickupNotes: booking.pickupNotes,
      rideDetails: {
        pickupLocation: ride.pickupLocation,
        destination: ride.destination,
        date: ride.date,
        time: ride.time
      },
      message: `New booking from ${booking.studentId.name} for ${seatsBooked} seat(s)`
    });

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying payment'
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (Staff only)
const processRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('rideId', 'providerId')
      .populate('studentId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the ride provider
    if (booking.rideId.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refund for this booking'
      });
    }

    // Check if booking has been paid
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking has not been paid'
      });
    }

    // Process refund with Razorpay
    const refund = await razorpay.payments.refund(booking.paymentIntentId, {
      amount: Math.round(booking.totalPrice * 100), // Convert to paise
      notes: {
        bookingId: booking._id.toString(),
        reason: reason || 'No reason provided'
      }
    });

    // Update booking
    booking.paymentStatus = 'refunded';
    booking.refundId = refund.id;
    await booking.save();

    // Create notification for student
    await Notification.create({
      userId: booking.studentId._id,
      title: 'Refund Processed',
      message: 'Your refund has been processed and will appear in your account within 5-10 business days',
      type: 'payment',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { refund, booking }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund'
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const filter = { studentId: userId, paymentStatus: { $in: ['paid', 'refunded'] } };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('rideId', 'pickupLocation destination date time')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments: bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total,
          hasNext: skip + bookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history'
    });
  }
};

// @desc    Razorpay webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Razorpay webhook)
const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature (only if webhook secret is configured)
    if (webhookSecret && webhookSecret !== 'your_razorpay_webhook_secret') {
      const text = JSON.stringify(req.body);
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== webhookSignature) {
        console.error('Webhook signature verification failed');
        return res.status(400).send('Webhook Error: Invalid signature');
      }
    } else {
      console.warn('Webhook secret not configured - skipping signature verification (not recommended for production)');
    }

    const event = req.body;

    // Handle the event
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        // Payment was successfully captured
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type ${event.event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  processRefund,
  getPaymentHistory,
  handleWebhook
};
