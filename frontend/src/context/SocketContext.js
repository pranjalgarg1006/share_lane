import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Only create socket if one doesn't exist
      if (!socket) {
        // Initialize socket connection
        const socketUrl = process.env.REACT_APP_API_URL ? 
          process.env.REACT_APP_API_URL.replace('/api', '') : 
          'http://localhost:5001';
        const newSocket = io(socketUrl, {
          auth: {
            token: localStorage.getItem('token')
          }
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id);
          console.log('User ID for socket room:', user._id);
          setIsConnected(true);
          
          // Join user to their personal room
          newSocket.emit('join', user._id);
          console.log('Emitted join event for user:', user._id);
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
        });

        setSocket(newSocket);
      }
    } else {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user?._id]); // Only depend on user._id, not the entire user object

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Socket event handlers
  const onBookingCreated = (callback) => {
    if (socket) {
      socket.on('booking_created', callback);
    }
  };

  const onBookingConfirmed = (callback) => {
    if (socket) {
      socket.on('booking_confirmed', callback);
    }
  };

  const onBookingCancelled = (callback) => {
    if (socket) {
      socket.on('booking_cancelled', callback);
    }
  };

  const onPaymentSuccess = (callback) => {
    if (socket) {
      socket.on('payment_success', callback);
    }
  };

  const onPaymentReceived = (callback) => {
    if (socket) {
      socket.on('payment_received', callback);
    }
  };

  const onRideUpdated = (callback) => {
    if (socket) {
      socket.on('ride_updated', callback);
    }
  };

  const onReviewCreated = (callback) => {
    if (socket) {
      socket.on('review_created', callback);
    }
  };

  const onRideCancelled = (callback) => {
    if (socket) {
      socket.on('ride_cancelled', callback);
    }
  };

  const onNewBooking = (callback) => {
    if (socket && isConnected) {
      console.log('Setting up new_booking listener on socket:', socket.id);
      socket.on('new_booking', (data) => {
        console.log('Received new_booking event:', data);
        callback(data);
      });
    } else {
      console.log('Socket not connected, cannot set up new_booking listener');
    }
  };

  const onBookingStatusUpdated = (callback) => {
    if (socket) {
      socket.on('booking_status_updated', callback);
    }
  };

  const onBookingCompleted = (callback) => {
    if (socket) {
      socket.on('booking_completed', callback);
    }
  };

  const onBookingRemoved = (callback) => {
    if (socket) {
      socket.on('booking_removed', callback);
    }
  };

  const onNewMessage = (callback) => {
    if (socket) {
      socket.on('new_message', callback);
    }
  };

  const onNewNotification = (callback) => {
    if (socket) {
      socket.on('new_notification', callback);
    }
  };

  // Emit functions
  const emitBookingCreated = (data) => {
    if (socket) {
      socket.emit('booking_created', data);
    }
  };

  const emitBookingConfirmed = (data) => {
    if (socket) {
      socket.emit('booking_confirmed', data);
    }
  };

  const emitBookingCancelled = (data) => {
    if (socket) {
      socket.emit('booking_cancelled', data);
    }
  };

  const emitPaymentSuccess = (data) => {
    if (socket) {
      socket.emit('payment_success', data);
    }
  };

  const emitRideUpdated = (data) => {
    if (socket) {
      socket.emit('ride_updated', data);
    }
  };

  const emitReviewCreated = (data) => {
    if (socket) {
      socket.emit('review_created', data);
    }
  };

  // Remove event listeners
  const removeAllListeners = () => {
    if (socket) {
      socket.removeAllListeners();
    }
  };

  const value = {
    socket,
    isConnected,
    onBookingCreated,
    onBookingConfirmed,
    onBookingCancelled,
    onPaymentSuccess,
    onPaymentReceived,
    onRideUpdated,
    onReviewCreated,
    onRideCancelled,
    onNewBooking,
    onBookingStatusUpdated,
    onBookingCompleted,
    onBookingRemoved,
    onNewMessage,
    onNewNotification,
    emitBookingCreated,
    emitBookingConfirmed,
    emitBookingCancelled,
    emitPaymentSuccess,
    emitRideUpdated,
    emitReviewCreated,
    removeAllListeners
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
