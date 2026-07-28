const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper function to check if chat is allowed
const canChat = async (userId, bookingId, userRole) => {
  const booking = await Booking.findById(bookingId)
    .populate('rideId', 'providerId date time status')
    .populate('studentId', '_id');

  if (!booking) {
    return { allowed: false, reason: 'Booking not found' };
  }

  const ride = booking.rideId;
  const isStudent = userRole === 'student';
  const isAdmin = userRole === 'staff';

  // Check if user is part of this booking
  if (isStudent && booking.studentId._id.toString() !== userId.toString()) {
    return { allowed: false, reason: 'Not authorized to chat for this booking' };
  }

  if (isAdmin && ride.providerId.toString() !== userId.toString()) {
    return { allowed: false, reason: 'Not authorized to chat for this booking' };
  }

  // Check if ride is completed
  const isCompleted = ride.status === 'completed' || booking.status === 'completed';
  
  if (isCompleted && booking.completedAt) {
    // Check 24-hour rule
    const completedAt = new Date(booking.completedAt);
    const now = new Date();
    const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
    
    if (hoursSinceCompletion > 24) {
      return { allowed: false, reason: 'Chat is only available for 24 hours after ride completion' };
    }
  }

  // For active/pending rides, chat is allowed
  return { allowed: true };
};

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { bookingId, message, receiverId } = req.body;
    const senderId = req.user._id;
    const userRole = req.user.role;

    // Validate input
    if (!bookingId || !message || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, message, and receiver ID are required'
      });
    }

    // Get booking and ride details
    const booking = await Booking.findById(bookingId)
      .populate('rideId', 'providerId')
      .populate('studentId', '_id');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const ride = booking.rideId;

    // Check if chat is allowed
    const chatCheck = await canChat(senderId, bookingId, userRole);
    if (!chatCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: chatCheck.reason
      });
    }

    // Verify receiver is correct
    if (userRole === 'student') {
      // Student can only message the admin (ride provider)
      if (receiverId.toString() !== ride.providerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Students can only message the ride provider'
        });
      }
    } else if (userRole === 'staff') {
      // Admin can only message the student who booked
      if (receiverId.toString() !== booking.studentId._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only message the student who booked this ride'
        });
      }

      // Admin can only send message if student has sent at least one message first
      const studentMessages = await Message.countDocuments({
        bookingId,
        senderId: booking.studentId._id
      });

      if (studentMessages === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only reply to messages. Student must send the first message.'
        });
      }
    }

    // Create message
    const newMessage = new Message({
      senderId,
      receiverId,
      bookingId,
      rideId: ride._id,
      message: message.trim()
    });

    await newMessage.save();

    // Populate sender and receiver details
    await newMessage.populate([
      { path: 'senderId', select: 'name email profileImage' },
      { path: 'receiverId', select: 'name email profileImage' },
      { 
        path: 'bookingId',
        select: 'status completedAt',
        populate: {
          path: 'rideId',
          select: 'pickupLocation destination date time'
        }
      }
    ]);

    // Create notification for the receiver
    const senderName = newMessage.senderId.name;
    const senderRole = req.user.role; // Get sender's role from authenticated user
    const notificationTitle = senderRole === 'student' 
      ? 'New message from student' 
      : 'New message from admin';
    const notificationMessage = `${senderName}: ${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}`;

    const notification = await Notification.create({
      userId: receiverId,
      title: notificationTitle,
      message: notificationMessage,
      type: 'chat',
      relatedId: bookingId,
      relatedType: 'message',
      priority: 'medium',
      actionUrl: senderRole === 'student' 
        ? `/staff/chat` 
        : `/student/bookings`
    });

    // Emit real-time message via Socket.IO
    const io = req.app.get('io');
    // Emit to receiver's personal room
    io.to(`user_${receiverId}`).emit('new_message', {
      message: newMessage,
      bookingId: bookingId
    });
    // Also emit to chat room for real-time updates
    io.to(`chat_${bookingId}`).emit('new_message', {
      message: newMessage,
      bookingId: bookingId
    });
    // Emit notification to receiver
    io.to(`user_${receiverId}`).emit('new_notification', {
      notification: {
        _id: notification._id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        actionUrl: notification.actionUrl
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: newMessage }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
};

// @desc    Get messages for a booking
// @route   GET /api/chat/booking/:bookingId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Validate bookingId
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }
    
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log(`[Chat] getMessages called - bookingId: ${bookingId}, userId: ${userId}, role: ${userRole}`);

    // Check if chat is allowed
    const chatCheck = await canChat(userId, bookingId, userRole);
    if (!chatCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: chatCheck.reason
      });
    }

    // Get messages
    const messages = await Message.find({ bookingId })
      .populate('senderId', 'name email profileImage')
      .populate('receiverId', 'name email profileImage')
      .sort({ createdAt: 1 });

    // Mark messages as read if they're for the current user
    const unreadMessages = messages.filter(
      msg => msg.receiverId._id.toString() === userId.toString() && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: unreadMessages.map(msg => msg._id) },
          receiverId: userId
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
    }

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};

// @desc    Get all chat conversations (for admin)
// @route   GET /api/chat/conversations
// @access  Private (Staff only)
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can view all conversations'
      });
    }

    // Get all bookings where this admin is the provider
    const rides = await Ride.find({ providerId: userId });
    const rideIds = rides.map(ride => ride._id);
    
    const bookings = await Booking.find({ 
      rideId: { $in: rideIds },
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }).populate('studentId', 'name email profileImage');

    // Get all booking IDs that have at least one message from students (admin can only chat if user sent first)
    // We need to check which bookings have messages where the sender is a student (not the admin)
    const bookingIds = bookings.map(b => b._id);
    const studentIds = bookings.map(b => b.studentId._id || b.studentId);
    
    // Find all messages where sender is a student (not admin) for these bookings
    // Use aggregation to get distinct bookingIds
    const messagesFromStudents = await Message.aggregate([
      {
        $match: {
          bookingId: { $in: bookingIds },
          senderId: { $in: studentIds }
        }
      },
      {
        $group: {
          _id: '$bookingId'
        }
      }
    ]);
    
    // Get unique booking IDs that have student messages
    const uniqueBookingIds = messagesFromStudents.map(m => m._id.toString());
    
    // Filter bookings to only show those with messages from students (admin can only reply)
    const filteredBookings = bookings.filter(b => 
      uniqueBookingIds.includes(b._id.toString())
    );

    // Get last message for each booking (only for bookings with messages)
    const conversations = await Promise.all(
      filteredBookings.map(async (booking) => {
        const lastMessage = await Message.findOne({ bookingId: booking._id })
          .sort({ createdAt: -1 })
          .populate('senderId', 'name');

        const unreadCount = await Message.countDocuments({
          bookingId: booking._id,
          receiverId: userId,
          isRead: false
        });

        // Check if chat is still allowed (24hr rule)
        const chatCheck = await canChat(userId, booking._id, 'staff');
        
        return {
          bookingId: booking._id,
          student: booking.studentId,
          lastMessage: lastMessage ? {
            message: lastMessage.message,
            senderName: lastMessage.senderId.name,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount,
          canChat: chatCheck.allowed,
          bookingStatus: booking.status,
          completedAt: booking.completedAt
        };
      })
    );

    // Filter out conversations where admin can't chat and no messages exist
    const activeConversations = conversations.filter(
      conv => conv.canChat || conv.lastMessage !== null
    );

    res.json({
      success: true,
      data: { conversations: activeConversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
};

// @desc    Get user's chat conversations (for students)
// @route   GET /api/chat/my-conversations
// @access  Private (Student only)
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their conversations'
      });
    }

    // Get all bookings for this student
    const bookings = await Booking.find({ 
      studentId: userId,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    })
    .populate('rideId', 'providerId pickupLocation destination date time')
    .populate({
      path: 'rideId',
      populate: {
        path: 'providerId',
        select: 'name email profileImage'
      }
    });

    // Get last message for each booking
    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await Message.findOne({ bookingId: booking._id })
          .sort({ createdAt: -1 })
          .populate('senderId', 'name');

        const unreadCount = await Message.countDocuments({
          bookingId: booking._id,
          receiverId: userId,
          isRead: false
        });

        // Check if chat is still allowed (24hr rule)
        const chatCheck = await canChat(userId, booking._id, 'student');
        
        return {
          bookingId: booking._id,
          ride: booking.rideId,
          provider: booking.rideId.providerId,
          lastMessage: lastMessage ? {
            message: lastMessage.message,
            senderName: lastMessage.senderId.name,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount,
          canChat: chatCheck.allowed,
          bookingStatus: booking.status,
          completedAt: booking.completedAt
        };
      })
    );

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Get my conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  getMyConversations
};

