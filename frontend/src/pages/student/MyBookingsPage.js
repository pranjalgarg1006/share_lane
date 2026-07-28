import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating,
  Pagination,
  Tabs,
  Tab
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  FilterList as FilterIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { bookingsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import ChatWindow from '../../components/chat/ChatWindow';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onRideCancelled, onBookingStatusUpdated, onBookingCompleted, onBookingRemoved } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  const [chatCanChat, setChatCanChat] = useState(false);

  useEffect(() => {
    fetchBookings();
    if (statusFilter === 'all') {
      fetchStatusCounts();
    }
  }, [page, statusFilter]);

  // Listen for ride cancellation events
  useEffect(() => {
    onRideCancelled((data) => {
      console.log('Ride cancelled:', data);
      toast.error(data.message);
      // Refresh bookings to show updated status
      fetchBookings();
      if (statusFilter === 'all') {
        fetchStatusCounts();
      }
    });
  }, [onRideCancelled, statusFilter]);

  // Listen for booking status updates
  useEffect(() => {
    onBookingStatusUpdated((data) => {
      console.log('Booking status updated:', data);
      const statusMessages = {
        confirmed: 'Your booking has been confirmed!',
        cancelled: 'Your booking has been cancelled',
        completed: 'Your ride has been completed'
      };
      
      const message = statusMessages[data.status] || `Your booking status has been updated to ${data.status}`;
      
      if (data.status === 'confirmed') {
        toast.success(message);
      } else if (data.status === 'cancelled') {
        toast.error(message);
      } else {
        toast.info(message);
      }
      
      // Refresh bookings to show updated status
      fetchBookings();
      if (statusFilter === 'all') {
        fetchStatusCounts();
      }
    });
  }, [onBookingStatusUpdated, statusFilter]);

  // Listen for booking completion events
  useEffect(() => {
    onBookingCompleted((data) => {
      console.log('Booking completed:', data);
      toast.success(data.message);
      // Refresh bookings to show updated status
      fetchBookings();
      if (statusFilter === 'all') {
        fetchStatusCounts();
      }
    });
  }, [onBookingCompleted, statusFilter]);

  // Listen for booking removal events (rejected bookings)
  useEffect(() => {
    onBookingRemoved((data) => {
      console.log('Booking removed:', data);
      toast.info(data.message);
      // Remove booking from local state
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking._id !== data.bookingId)
      );
      // Update status counts
      if (statusFilter === 'all') {
        fetchStatusCounts();
      }
    });
  }, [onBookingRemoved, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter
      };

      const response = await bookingsAPI.getMyBookings(params);
      const { bookings: fetchedBookings, pagination } = response.data.data;

      setBookings(fetchedBookings);
      setTotalPages(pagination.totalPages);
      setTotalBookings(pagination.totalBookings);
    } catch (error) {
      setError('Failed to fetch bookings');
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      const counts = { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
      
      // Fetch all bookings to get accurate counts
      const response = await bookingsAPI.getMyBookings({ page: 1, limit: 1000 });
      const allBookings = response.data.data.bookings;
      
      counts.all = allBookings.length;
      allBookings.forEach(booking => {
        if (counts.hasOwnProperty(booking.status)) {
          counts[booking.status]++;
        }
      });
      
      setStatusCounts(counts);
    } catch (error) {
      console.error('Failed to fetch status counts:', error);
    }
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      await bookingsAPI.cancelBooking(selectedBooking._id, cancellationReason || 'No reason provided');

      toast.success('Booking cancelled successfully');
      setCancelDialog(false);
      setCancellationReason('');
      setSelectedBooking(null);
      fetchBookings();
      if (statusFilter === 'all') {
        fetchStatusCounts();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel booking';
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleStatusFilterChange = (event, newValue) => {
    setStatusFilter(newValue);
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'refunded': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const canCancel = (booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ScheduleIcon />;
      case 'confirmed': return <CheckIcon />;
      case 'completed': return <CheckIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const statusTabs = [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'pending', label: 'Pending', count: statusCounts.pending },
    { value: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
    { value: 'completed', label: 'Completed', count: statusCounts.completed },
    { value: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            My Bookings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your ride bookings and track their status
          </Typography>
        </Box>

        {/* Status Filter Tabs */}
        <Paper elevation={1} sx={{ mb: 4 }}>
          <Tabs
            value={statusFilter}
            onChange={handleStatusFilterChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {statusTabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Chip
                      label={tab.count}
                      size="small"
                      color={tab.value === statusFilter ? 'primary' : 'default'}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>

        {/* Bookings List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : bookings.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No bookings found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {statusFilter === 'all' 
                ? "You haven't made any bookings yet"
                : `No ${statusFilter} bookings found`
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<CarIcon />}
              onClick={() => navigate('/student/search')}
            >
              Find Rides
            </Button>
          </Paper>
        ) : (
          <>
            <List>
              {bookings.map((booking, index) => (
                <React.Fragment key={booking._id}>
                  <ListItem
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {booking.rideId?.providerId?.name?.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                            {booking.rideId?.pickupLocation} → {booking.rideId?.destination}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={getStatusIcon(booking.status)}
                              label={booking.status}
                              size="small"
                              color={getStatusColor(booking.status)}
                            />
                            <Chip
                              label={booking.paymentStatus}
                              size="small"
                              color={getPaymentStatusColor(booking.paymentStatus)}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <span>
                          <Typography variant="body2" color="text.secondary" component="span">
                            {booking.rideId?.providerId?.name} • {formatDate(booking.rideId?.date)} at {formatTime(booking.rideId?.time)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }} component="span">
                            <Typography variant="caption" color="text.secondary">
                              {booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''} • {formatCurrency(booking.totalPrice)}
                            </Typography>
                            {booking.rideId?.providerId?.averageRating && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Rating
                                  value={booking.rideId.providerId.averageRating}
                                  readOnly
                                  size="small"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  ({booking.rideId.providerId.totalReviews})
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </span>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/rides/${booking.rideId?._id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<ChatIcon />}
                        onClick={() => {
                          // Check if chat is allowed
                          const isCompleted = booking.status === 'completed' && booking.completedAt;
                          let canChat = true;
                          
                          if (isCompleted) {
                            const completedAt = new Date(booking.completedAt);
                            const now = new Date();
                            const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
                            canChat = hoursSinceCompletion <= 24;
                          }
                          
                          setChatCanChat(canChat);
                          setChatBooking(booking);
                          setChatOpen(true);
                        }}
                      >
                        Chat
                      </Button>
                      {canCancel(booking) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                  {index < bookings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Cancel Booking Dialog */}
        <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Are you sure you want to cancel this booking?
              </Typography>
              {selectedBooking && (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {selectedBooking.rideId?.pickupLocation} → {selectedBooking.rideId?.destination}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(selectedBooking.rideId?.date)} at {formatTime(selectedBooking.rideId?.time)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedBooking.seatsBooked} seat{selectedBooking.seatsBooked > 1 ? 's' : ''} • {formatCurrency(selectedBooking.totalPrice)}
                  </Typography>
                </Box>
              )}
              <TextField
                fullWidth
                label="Cancellation Reason (Optional)"
                multiline
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button
              onClick={handleConfirmCancel}
              variant="contained"
              color="error"
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Chat Window */}
        {chatOpen && chatBooking && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1300,
              boxShadow: 6,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <ChatWindow
              bookingId={chatBooking._id}
              receiverId={chatBooking.rideId?.providerId?._id || chatBooking.rideId?.providerId}
              receiverName={chatBooking.rideId?.providerId?.name || 'Admin'}
              receiverImage={chatBooking.rideId?.providerId?.profileImage}
              onClose={() => {
                setChatOpen(false);
                setChatBooking(null);
              }}
              userRole="student"
              canChat={chatCanChat}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MyBookingsPage;
