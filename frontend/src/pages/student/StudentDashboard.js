import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  BookmarkBorder as BookingsIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, bookingsAPI, notificationsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedRides: 0,
    totalSpent: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's bookings
      const bookingsResponse = await bookingsAPI.getMyBookings({ limit: 10 });
      const bookings = bookingsResponse.data.data.bookings;
      console.log('Bookings data:', bookings);
      setRecentBookings(bookings.slice(0, 5));

      // Calculate stats
      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(booking => 
        ['pending', 'confirmed'].includes(booking.status)
      ).length;
      const completedRides = bookings.filter(booking => 
        booking.status === 'completed'
      ).length;
      const totalSpent = bookings
        .filter(booking => booking.paymentStatus === 'paid')
        .reduce((sum, booking) => sum + booking.totalPrice, 0);

      setStats({
        totalBookings,
        activeBookings,
        completedRides,
        totalSpent
      });

      // Fetch available rides
      const ridesResponse = await ridesAPI.getRides({ limit: 5 });
      console.log('Available rides data:', ridesResponse.data.data.rides);
      setAvailableRides(ridesResponse.data.data.rides);

      // Fetch notifications
      const notificationsResponse = await notificationsAPI.getNotifications({ limit: 5 });
      setNotifications(notificationsResponse.data.data.notifications);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find your next ride or check your current bookings
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BookingsIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.totalBookings}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Active Bookings
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.activeBookings}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Completed Rides
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.completedRides}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PaymentIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Spent
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(stats.totalSpent)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/student/search')}
              >
                Search Rides
              </Button>
              <Button
                variant="outlined"
                startIcon={<BookingsIcon />}
                onClick={() => navigate('/student/bookings')}
              >
                My Bookings
              </Button>
              <Button
                variant="outlined"
                startIcon={<PaymentIcon />}
                onClick={() => navigate('/payments/history')}
              >
                Payment History
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* My Bookings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    My Bookings
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/student/bookings')}
                  >
                    View All
                  </Button>
                </Box>
                
                {recentBookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <BookingsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      No bookings yet
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={() => navigate('/student/search')}
                    >
                      Find Your First Ride
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {recentBookings
                      .filter(booking => booking.rideId) // Filter out bookings with null rideId
                      .map((booking, index) => (
                      <React.Fragment key={booking._id}>
                        <ListItem
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/rides/${booking.rideId._id}`)}
                        >
                          <ListItemIcon>
                            <CarIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${booking.rideId.pickupLocation} → ${booking.rideId.destination}`}
                            secondary={
                              <span>
                                <Typography variant="body2" color="text.secondary" component="span">
                                  {new Date(booking.rideId.date).toLocaleDateString()} at {booking.rideId.time}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }} component="span">
                                  <Chip
                                    label={booking.status}
                                    size="small"
                                    color={getStatusColor(booking.status)}
                                  />
                                  <Chip
                                    label={booking.paymentStatus}
                                    size="small"
                                    color={getPaymentStatusColor(booking.paymentStatus)}
                                  />
                                  <Typography variant="caption" color="text.secondary" component="span">
                                    {booking.seatsBooked} seat(s) • {formatCurrency(booking.totalPrice)}
                                  </Typography>
                                </Box>
                              </span>
                            }
                          />
                        </ListItem>
                        {index < recentBookings.filter(booking => booking.rideId).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Available Rides */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Available Rides
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/student/search')}
                  >
                    View All
                  </Button>
                </Box>
                
                {availableRides.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No rides available at the moment
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {availableRides
                      .filter(ride => ride && ride.pickupLocation && ride.destination) // Filter out null/invalid rides
                      .map((ride, index) => (
                      <React.Fragment key={ride._id}>
                        <ListItem
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/rides/${ride._id}`)}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {ride.providerId?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={`${ride.pickupLocation} → ${ride.destination}`}
                            secondary={
                              <span>
                                <Typography variant="body2" color="text.secondary" component="span">
                                  {ride.providerId?.name || 'Unknown Driver'} • {new Date(ride.date).toLocaleDateString()} at {ride.time}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }} component="span">
                                  <Chip
                                    label={`${ride.availableSeats}/${ride.totalSeats} seats`}
                                    size="small"
                                    color="info"
                                  />
                                  <Typography variant="caption" color="text.secondary" component="span">
                                    {formatCurrency(ride.pricePerSeat)} per seat
                                  </Typography>
                                </Box>
                              </span>
                            }
                          />
                        </ListItem>
                        {index < availableRides.filter(ride => ride && ride.pickupLocation && ride.destination).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StudentDashboard;
