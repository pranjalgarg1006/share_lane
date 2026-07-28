const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

// Initialize Express app
const app = express();
const server = createServer(app);

// CORS configuration - Define allowed origins first (needed for Socket.IO)
// Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://share-lane.vercel.app',
  'https://share-lane-git-main.vercel.app',
  'https://share-lane-*.vercel.app', // Pattern for Vercel preview deployments
  process.env.CLIENT_URL,
  // Support multiple origins from environment variable (comma-separated)
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [])
].filter(Boolean); // Remove undefined values

// Log allowed origins on startup
console.log('🌐 CORS allowed origins:', allowedOrigins);

// Helper function to check if origin is allowed
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow requests with no origin
  
  return allowedOrigins.some(allowedOrigin => {
    // Handle wildcard patterns (for Vercel preview deployments)
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return origin === allowedOrigin;
  });
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      // In development, log the blocked origin for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        console.log('Allowed origins:', allowedOrigins);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security middleware - relaxed for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests
}));

// Rate limiting - Disabled for development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room: user_${userId}`);
    console.log('Socket rooms:', Array.from(socket.rooms));
  });

  // Handle booking events
  socket.on('booking_created', (data) => {
    socket.to(`user_${data.providerId}`).emit('booking_created', data);
  });

  socket.on('booking_confirmed', (data) => {
    socket.to(`user_${data.studentId}`).emit('booking_confirmed', data);
  });

  socket.on('booking_cancelled', (data) => {
    socket.to(`user_${data.providerId}`).emit('booking_cancelled', data);
  });

  // Handle payment events
  socket.on('payment_success', (data) => {
    socket.to(`user_${data.studentId}`).emit('payment_success', data);
    socket.to(`user_${data.providerId}`).emit('payment_received', data);
  });

  // Handle ride events
  socket.on('ride_updated', (data) => {
    socket.to(`ride_${data.rideId}`).emit('ride_updated', data);
  });

  // Handle review events
  socket.on('review_created', (data) => {
    socket.to(`user_${data.revieweeId}`).emit('review_created', data);
  });

  // Handle chat events
  socket.on('join_chat', (bookingId) => {
    socket.join(`chat_${bookingId}`);
    console.log(`User joined chat room: chat_${bookingId}`);
  });

  socket.on('leave_chat', (bookingId) => {
    socket.leave(`chat_${bookingId}`);
    console.log(`User left chat room: chat_${bookingId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = { app, server, io };
