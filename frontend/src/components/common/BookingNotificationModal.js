import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Paper,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  CheckCircle as ConfirmIcon,
  Cancel as RejectIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';

const BookingNotificationModal = ({ 
  open, 
  onClose, 
  bookingData, 
  onConfirm, 
  onReject, 
  onPending,
  loading = false 
}) => {
  if (!bookingData) {
    return null;
  }

  const {
    bookingId,
    studentName,
    studentEmail,
    studentPhone,
    seatsBooked,
    totalPrice,
    specialRequests,
    pickupNotes,
    rideDetails,
    message
  } = bookingData;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <PersonIcon />
          </Avatar>
          <Typography variant="h6" component="div">
            New Booking Request
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ color: 'white' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {message}
          </Typography>
        </Box>

        {/* Student Information */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Student Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Name:</strong> {studentName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Email:</strong> {studentEmail}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Phone:</strong> {studentPhone || 'Not provided'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Seats:</strong> 
                <Chip 
                  label={`${seatsBooked} seat${seatsBooked > 1 ? 's' : ''}`} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Ride Information */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Ride Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  <strong>From:</strong> {rideDetails.pickupLocation}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  <strong>To:</strong> {rideDetails.destination}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimeIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(rideDetails.date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimeIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  <strong>Time:</strong> {formatTime(rideDetails.time)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  <strong>Total Price:</strong> ${totalPrice}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Special Requests & Notes */}
        {(specialRequests || pickupNotes) && (
          <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Additional Information
            </Typography>
            {specialRequests && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Special Requests:</strong> {specialRequests}
              </Typography>
            )}
            {pickupNotes && (
              <Typography variant="body2" color="text.secondary">
                <strong>Pickup Notes:</strong> {pickupNotes}
              </Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onReject}
          variant="outlined"
          color="error"
          startIcon={<RejectIcon />}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          Reject
        </Button>
        <Button
          onClick={onPending}
          variant="outlined"
          color="warning"
          startIcon={<PendingIcon />}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          Leave Pending
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          startIcon={<ConfirmIcon />}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingNotificationModal;

