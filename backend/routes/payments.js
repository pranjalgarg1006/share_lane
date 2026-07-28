const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  processRefund,
  getPaymentHistory,
  handleWebhook
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private (Student only)
router.post('/create-order', authenticate, authorize('student'), createOrder);

// @route   POST /api/payments/verify
// @desc    Verify payment
// @access  Private
router.post('/verify', authenticate, verifyPayment);

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private (Staff only)
router.post('/refund', authenticate, authorize('staff'), processRefund);

// @route   GET /api/payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', authenticate, getPaymentHistory);

// @route   POST /api/payments/webhook
// @desc    Razorpay webhook handler
// @access  Public
router.post('/webhook', express.json(), handleWebhook);

module.exports = router;
