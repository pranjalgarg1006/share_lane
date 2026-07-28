const { server, io } = require('./app');
const { scheduleRideExpirationEvery5Minutes } = require('./utils/scheduler');

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  
  scheduleRideExpirationEvery5Minutes(io);
});




