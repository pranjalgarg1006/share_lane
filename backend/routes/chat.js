const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
  getMyConversations
} = require('../controllers/chatController');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', authenticate, sendMessage);

// @route   GET /api/chat/booking/:bookingId
// @desc    Get messages for a booking
// @access  Private
router.get('/booking/:bookingId', authenticate, getMessages);

// @route   GET /api/chat/conversations
// @desc    Get all chat conversations (admin)
// @access  Private (Staff only)
router.get('/conversations', authenticate, authorize('staff'), getConversations);

// @route   GET /api/chat/my-conversations
// @desc    Get user's chat conversations (student)
// @access  Private (Student only)
router.get('/my-conversations', authenticate, authorize('student'), getMyConversations);

module.exports = router;

