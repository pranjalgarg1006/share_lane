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
  Avatar,
  Pagination,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import { toast } from 'react-toastify';

const PaymentHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter
      };

      const response = await bookingsAPI.getMyBookings(params);
      const { bookings } = response.data.data;

      // Filter bookings that have payment information
      const paymentBookings = bookings.filter(booking => 
        booking.paymentStatus && booking.paymentStatus !== 'pending'
      );

      setPayments(paymentBookings);
      setTotalPages(Math.ceil(paymentBookings.length / 10));
      setTotalPayments(paymentBookings.length);
    } catch (error) {
      setError('Failed to fetch payment history');
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleStatusFilterChange = (event, newValue) => {
    setStatusFilter(newValue);
    setPage(1);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'refunded': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckIcon />;
      case 'refunded': return <CancelIcon />;
      case 'failed': return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const getPaymentMethod = (booking) => {
    // This would typically come from the payment system
    return 'Credit Card'; // Placeholder
  };

  const handleDownloadReceipt = (payment) => {
    // This would generate and download a receipt
    toast.info('Receipt download feature coming soon');
  };

  const statusTabs = [
    { value: 'all', label: 'All Payments', count: totalPayments },
    { value: 'paid', label: 'Paid', count: payments.filter(p => p.paymentStatus === 'paid').length },
    { value: 'refunded', label: 'Refunded', count: payments.filter(p => p.paymentStatus === 'refunded').length },
    { value: 'failed', label: 'Failed', count: payments.filter(p => p.paymentStatus === 'failed').length }
  ];

  const calculateTotalSpent = () => {
    return payments
      .filter(payment => payment.paymentStatus === 'paid')
      .reduce((total, payment) => total + payment.totalPrice, 0);
  };

  const calculateTotalRefunded = () => {
    return payments
      .filter(payment => payment.paymentStatus === 'refunded')
      .reduce((total, payment) => total + payment.totalPrice, 0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Payment History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your payments and transaction history
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PaymentIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Spent
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {formatCurrency(calculateTotalSpent())}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CancelIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Refunded
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {formatCurrency(calculateTotalRefunded())}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Transactions
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalPayments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Successful Payments
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {payments.filter(p => p.paymentStatus === 'paid').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status Filter Tabs */}
        <Paper elevation={1} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Tabs
              value={statusFilter}
              onChange={handleStatusFilterChange}
              variant="scrollable"
              scrollButtons="auto"
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="List View">
                <IconButton
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Table View">
                <IconButton
                  onClick={() => setViewMode('table')}
                  color={viewMode === 'table' ? 'primary' : 'default'}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Payments List/Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : payments.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No payment history found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {statusFilter === 'all' 
                ? "You haven't made any payments yet"
                : `No ${statusFilter} payments found`
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
        ) : viewMode === 'list' ? (
          <>
            <List>
              {payments.map((payment, index) => (
                <React.Fragment key={payment._id}>
                  <ListItem
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PaymentIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                            {payment.rideId?.pickupLocation} → {payment.rideId?.destination}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={getPaymentStatusIcon(payment.paymentStatus)}
                              label={payment.paymentStatus}
                              size="small"
                              color={getPaymentStatusColor(payment.paymentStatus)}
                            />
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                              {formatCurrency(payment.totalPrice)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <span>
                          <Typography variant="body2" color="text.secondary" component="span">
                            {formatDate(payment.bookedAt)} • {getPaymentMethod(payment)} • {payment.seatsBooked} seat{payment.seatsBooked > 1 ? 's' : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }} component="span">
                            <Typography variant="caption" color="text.secondary">
                              Driver: {payment.rideId?.providerId?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • {formatDate(payment.rideId?.date)} at {formatTime(payment.rideId?.time)}
                            </Typography>
                          </Box>
                        </span>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/rides/${payment.rideId?._id}`)}
                      >
                        View Ride
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReceipt(payment)}
                      >
                        Receipt
                      </Button>
                    </Box>
                  </ListItem>
                  {index < payments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        ) : (
          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Ride Details</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Seats</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {formatDate(payment.bookedAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(payment.rideId?.time)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {payment.rideId?.pickupLocation} → {payment.rideId?.destination}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(payment.rideId?.date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                          {payment.rideId?.providerId?.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {payment.rideId?.providerId?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.seatsBooked} seat{payment.seatsBooked > 1 ? 's' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(payment.totalPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getPaymentStatusIcon(payment.paymentStatus)}
                        label={payment.paymentStatus}
                        size="small"
                        color={getPaymentStatusColor(payment.paymentStatus)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Ride">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/rides/${payment.rideId?._id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Receipt">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadReceipt(payment)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

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
      </Box>
    </Container>
  );
};

export default PaymentHistoryPage;
