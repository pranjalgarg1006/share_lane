import { convexClient } from '../convexClient';
import { api as convexApi } from '../convex/_generated/api';

// Helper to wrap Convex promises in Axios-like response format
const wrap = async (promise) => {
  try {
    const data = await promise;
    return { data };
  } catch (error) {
    return Promise.reject({ response: { data: { message: error.message }, status: 400 } });
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => wrap(convexClient.mutation(convexApi.auth.login, credentials)),
  register: (userData) => wrap(convexClient.mutation(convexApi.users.createUser, userData)),
  verifyOtp: (email, otp) => Promise.resolve({ data: { message: 'OTP verified' } }),
  resendOtp: (email) => Promise.resolve({ data: { message: 'OTP resent' } }),
  getProfile: () => {
    const userId = localStorage.getItem('token');
    if (!userId) return Promise.reject({ response: { status: 401 } });
    return wrap(convexClient.query(convexApi.auth.getProfile, { userId }));
  },
  updateProfile: (profileData) => Promise.resolve({ data: { message: 'Profile updated' } }),
};

// Rides API
export const ridesAPI = {
  getRides: (params) => {
    if (params?.pickup && params?.destination && params?.date) {
      return wrap(convexClient.query(convexApi.rides.searchRides, {
        pickup: params.pickup,
        destination: params.destination,
        date: new Date(params.date).getTime()
      }));
    }
    return wrap(convexClient.query(convexApi.rides.getActiveRides));
  },
  getRideById: (id) => wrap(convexClient.query(convexApi.rides.getRideById, { rideId: id })),
  createRide: (rideData) => {
    const providerId = localStorage.getItem('token');
    return wrap(convexClient.mutation(convexApi.rides.createRide, {
      providerId,
      pickupLocation: rideData.pickupLocation,
      destination: rideData.destination,
      date: new Date(rideData.date).getTime(),
      time: rideData.time,
      totalSeats: rideData.availableSeats,
      pricePerSeat: rideData.pricePerSeat,
      description: rideData.description || ""
    }));
  },
  updateRide: (id, rideData) => Promise.resolve({ data: { data: { message: 'Ride updated' } } }),
  deleteRide: (id) => Promise.resolve({ data: { data: { message: 'Ride deleted' } } }),
  getMyRides: (params) => Promise.resolve({ data: { data: { rides: [] } } }),
  getMyRideHistory: (params) => Promise.resolve({ data: { data: { rides: [], totalPages: 0 } } }),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (bookingData) => Promise.resolve({ data: { data: { bookingId: 'dummy' } } }),
  getMyBookings: (params) => Promise.resolve({ data: { data: { bookings: [], pagination: { totalPages: 0, totalBookings: 0 } } } }),
  getRideBookings: (rideId, params) => Promise.resolve({ data: { data: { bookings: [], pagination: { totalPages: 0, totalBookings: 0 } } } }),
  updateBookingStatus: (id, status) => Promise.resolve({ data: { data: { message: 'Status updated' } } }),
  cancelBooking: (id, reason) => Promise.resolve({ data: { data: { message: 'Cancelled' } } }),
};

// Payments API
export const paymentsAPI = {
  createOrder: (rideId, seatsBooked) => Promise.resolve({ data: { data: { id: 'dummy_order', amount: 100 } } }),
  verifyPayment: (paymentData) => Promise.resolve({ data: { data: { success: true } } }),
  processRefund: (bookingId, reason) => Promise.resolve({ data: { data: { success: true } } }),
  getPaymentHistory: (params) => Promise.resolve({ data: { data: { payments: [] } } }),
};

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData) => Promise.resolve({ data: { data: { message: 'Review added' } } }),
  getUserReviews: (userId, params) => Promise.resolve({ data: { data: { reviews: [] } } }),
  getRideReviews: (rideId, params) => Promise.resolve({ data: { data: { reviews: [] } } }),
  getGivenReviews: (params) => Promise.resolve({ data: { data: { reviews: [] } } }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => Promise.resolve({ data: { data: { notifications: [] } } }),
  getNotificationCount: () => Promise.resolve({ data: { data: { count: 0 } } }),
  markAsRead: (id) => Promise.resolve({ data: { data: { success: true } } }),
  markAllAsRead: () => Promise.resolve({ data: { data: { success: true } } }),
  deleteNotification: (id) => Promise.resolve({ data: { data: { success: true } } }),
};

// Chat API
export const chatAPI = {
  sendMessage: (messageData) => Promise.resolve({ data: { data: { message: 'Sent' } } }),
  getMessages: (bookingId) => Promise.resolve({ data: { data: { messages: [] } } }),
  getConversations: () => Promise.resolve({ data: { data: { conversations: [] } } }),
  getMyConversations: () => Promise.resolve({ data: { data: { conversations: [] } } }),
};

const api = {}; // Dummy default export if needed
export default api;
