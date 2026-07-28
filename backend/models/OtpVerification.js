const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  userData: {
    name: String,
    password: String,
    role: String,
    phone: String
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 verification attempts
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
otpVerificationSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);

