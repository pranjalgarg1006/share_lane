import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Avatar,
  Divider,
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
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Directions as DirectionsIcon,
  Description as DescriptionIcon,
  MeetingRoom as MeetingIcon,
  Timer as TimerIcon,
  BookOnline as BookIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ridesAPI, bookingsAPI, paymentsAPI } from '../services/api';
import { toast } from 'react-toastify';

const RideDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    seats: 1,
    specialRequests: ''
  });
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      const response = await ridesAPI.getRideById(id);
      setRide(response.data.data.ride);
    } catch (error) {
      setError('Failed to load ride details');
      toast.error('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = () => {
    if (!user) {
      toast.error('Please login to book a ride');
      navigate('/login');
      return;
    }
    setBookingDialog(true);
  };

  const handleBookingSubmit = async () => {
    try {
      setBookingLoading(true);
      
      // Validate booking data
      if (!bookingData.seats || bookingData.seats <= 0) {
        toast.error('Please select at least one seat');
        setBookingLoading(false);
        return;
      }

      if (!id) {
        toast.error('Invalid ride ID');
        setBookingLoading(false);
        return;
      }

      console.log('Creating Razorpay order for ride:', id, 'seats:', bookingData.seats);
      
      // Create Razorpay order
      const orderResponse = await paymentsAPI.createOrder(id, bookingData.seats);
      
      if (!orderResponse.data || !orderResponse.data.success) {
        throw new Error(orderResponse.data?.message || 'Failed to create payment order');
      }

      const { orderId, amount, keyId } = orderResponse.data.data;

      if (!orderId || !keyId) {
        throw new Error('Invalid payment configuration. Please contact support.');
      }

      console.log('Order created successfully:', { orderId, amount, keyId });

      // Load Razorpay script (check if already loaded)
      const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
          // Check if script is already loaded
          if (window.Razorpay) {
            console.log('Razorpay script already loaded');
            resolve();
            return;
          }

          // Check if script tag already exists
          const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
          if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay script')));
            return;
          }

          // Create and load script
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => {
            console.log('Razorpay script loaded successfully');
            resolve();
          };
          script.onerror = () => {
            console.error('Failed to load Razorpay script');
            reject(new Error('Failed to load payment gateway. Please check your internet connection.'));
          };
          document.body.appendChild(script);
        });
      };

      // Load script and then open payment
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay payment gateway is not available');
      }

      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'ShareLane',
        description: `Ride booking: ${ride.pickupLocation} to ${ride.destination}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            console.log('Payment successful, verifying...', response);
            
            // Verify payment
            await paymentsAPI.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              rideId: id,
              seatsBooked: bookingData.seats,
              specialRequests: bookingData.specialRequests || undefined,
              contactPhone: bookingData.contactPhone || undefined,
              pickupNotes: bookingData.pickupNotes || undefined
            });

            toast.success('Payment successful! Ride booked successfully!');
            setBookingDialog(false);
            setBookingData({ seats: 1, specialRequests: '', contactPhone: '', pickupNotes: '' });
            
            // Refresh ride details to update available seats
            fetchRideDetails();
          } catch (error) {
            console.error('Payment verification error:', error);
            const message = error.response?.data?.message || error.message || 'Payment verification failed';
            toast.error(message);
          } finally {
            setBookingLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#1976d2'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setBookingLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        const errorMessage = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
        toast.error(errorMessage);
        setBookingLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Booking submission error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to initiate payment';
      toast.error(message);
      setBookingLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ride from ${ride?.pickupLocation} to ${ride?.destination}`,
        text: `Check out this ride on ShareLane!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !ride) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Ride not found'}
          </Alert>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

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

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'car': return '🚗';
      case 'van': return '🚐';
      case 'bus': return '🚌';
      default: return '🚗';
    }
  };

  const canBook = user && user.role === 'student' && ride.availableSeats > 0 && ride.status === 'active';

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Ride Details
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {ride.pickupLocation} → {ride.destination}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Add to Favorites">
              <IconButton onClick={handleToggleFavorite}>
                {isFavorited ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton onClick={handleShare}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Ride Information */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              {/* Route Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <DirectionsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Route
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {ride.pickupLocation}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {ride.destination}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Date & Time */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {formatDate(ride.date)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {formatTime(ride.time)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Vehicle & Seating */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Vehicle & Seating
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" sx={{ mr: 1 }}>
                        {getVehicleIcon(ride.vehicleType)}
                      </Typography>
                      <Box>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}>
                          {ride.vehicleType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vehicle Type
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {ride.availableSeats} of {ride.totalSeats} seats available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Seating
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Pricing */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Pricing
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      ₹{ride.pricePerSeat}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per seat
                    </Typography>
                  </Box>
                  {ride.estimatedDuration && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        {ride.estimatedDuration} minutes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Estimated duration
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Additional Information */}
              {(ride.meetingPoint || ride.description) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Additional Information
                    </Typography>
                    {ride.meetingPoint && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <MeetingIcon sx={{ mr: 1, fontSize: 16 }} />
                          Meeting Point
                        </Typography>
                        <Typography variant="body1">
                          {ride.meetingPoint}
                        </Typography>
                      </Box>
                    )}
                    {ride.description && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {ride.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          {/* Sidebar - Driver Info & Booking */}
          <Grid item xs={12} md={4}>
            {/* Driver Information */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                Driver
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
                  {ride.providerId.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {ride.providerId.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating
                      value={ride.providerId.averageRating || 0}
                      readOnly
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({ride.providerId.totalReviews} reviews)
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EmailIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={ride.providerId.email}
                    secondary="Email"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PhoneIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={ride.providerId.phone}
                    secondary="Phone"
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Booking Section */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BookIcon sx={{ mr: 1, color: 'primary.main' }} />
                Book This Ride
              </Typography>
              
              {ride.status !== 'active' ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This ride is no longer available
                </Alert>
              ) : ride.availableSeats === 0 ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  No seats available
                </Alert>
              ) : !user ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please login to book a ride
                </Alert>
              ) : user.role !== 'student' ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Only students can book rides
                </Alert>
              ) : null}

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Available Seats: {ride.availableSeats}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ₹{ride.pricePerSeat} per seat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total will be calculated based on number of seats selected
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleBookRide}
                disabled={!canBook}
                sx={{ py: 1.5 }}
              >
                {!user ? 'Login to Book' : 
                 user.role !== 'student' ? 'Students Only' :
                 ride.availableSeats === 0 ? 'No Seats Available' :
                 'Book This Ride'}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Booking Dialog */}
        <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Book This Ride</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {ride.pickupLocation} → {ride.destination}
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Number of Seats</InputLabel>
                <Select
                  value={bookingData.seats}
                  onChange={(e) => setBookingData({ ...bookingData, seats: e.target.value })}
                  label="Number of Seats"
                >
                  {Array.from({ length: Math.min(ride.availableSeats, 4) }, (_, i) => i + 1).map((num) => (
                    <MenuItem key={num} value={num}>
                      {num} seat{num > 1 ? 's' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Total Amount to Pay:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ₹{ride.pricePerSeat * bookingData.seats}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{ride.pricePerSeat} × {bookingData.seats} seat{bookingData.seats > 1 ? 's' : ''}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Special Requests (Optional)"
                multiline
                rows={3}
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                placeholder="Any special requests or notes for the driver..."
                inputProps={{ maxLength: 300 }}
                helperText={`${bookingData.specialRequests.length}/300 characters`}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              variant="contained"
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Processing...' : `Pay ₹${ride.pricePerSeat * bookingData.seats}`}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default RideDetailsPage;
