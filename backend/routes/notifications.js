const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', authenticate, getNotifications);

// @route   GET /api/notifications/count
// @desc    Get notification count
// @access  Private
router.get('/count', authenticate, getNotificationCount);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticate, markAsRead);

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.post('/mark-all-read', authenticate, markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
