import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Directions as DirectionsIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ridesAPI } from '../../services/api';

const CreateRidePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      pickupLocation: '',
      destination: '',
      date: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      })(),
      time: '10:00',
      totalSeats: 4,
      availableSeats: 4,
      pricePerSeat: 0,
      description: '',
      vehicleType: 'car',
      meetingPoint: '',
      estimatedDuration: 30
    }
  });

  const watchedTotalSeats = watch('totalSeats');

  // Update available seats when total seats changes
  React.useEffect(() => {
    const totalSeats = getValues('totalSeats');
    setValue('availableSeats', totalSeats);
  }, [watchedTotalSeats, setValue, getValues]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      // Format date and time to ensure it's in the future
      const rideDate = new Date(data.date);
      const [hours, minutes] = data.time.split(':');
      rideDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Check if the ride is in the future (at least 30 minutes from now)
      const now = new Date();
      const minTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
      
      if (rideDate < minTime) {
        setError('Ride must be scheduled at least 30 minutes in the future');
        setLoading(false);
        return;
      }

      const rideData = {
        pickupLocation: data.pickupLocation,
        destination: data.destination,
        date: rideDate,
        time: data.time,
        totalSeats: parseInt(data.totalSeats),
        availableSeats: parseInt(data.availableSeats),
        pricePerSeat: parseFloat(data.pricePerSeat),
        vehicleType: data.vehicleType,
        meetingPoint: data.meetingPoint || '',
        estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration) : undefined,
        description: data.description || ''
      };

      const response = await ridesAPI.createRide(rideData);
      
      toast.success('Ride created successfully!');
      navigate('/staff/rides');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create ride';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'van', label: 'Van', icon: '🚐' },
    { value: 'bus', label: 'Bus', icon: '🚌' }
  ];

  const commonLocations = [
    'Main Campus Gate',
    'Library',
    'Student Center',
    'Parking Lot A',
    'Parking Lot B',
    'Dormitory Area',
    'Sports Complex',
    'Cafeteria'
  ];

  return (
    <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <CarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Create New Ride
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Share your journey and help fellow students get around campus
            </Typography>
          </Box>

          {/* Form */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Location Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Location Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Pickup Location"
                      {...register('pickupLocation', {
                        required: 'Pickup location is required',
                        maxLength: {
                          value: 100,
                          message: 'Location cannot exceed 100 characters'
                        }
                      })}
                      error={!!errors.pickupLocation}
                      helperText={errors.pickupLocation?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {commonLocations.slice(0, 4).map((location) => (
                        <Chip
                          key={location}
                          label={location}
                          size="small"
                          onClick={() => setValue('pickupLocation', location)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Destination"
                      {...register('destination', {
                        required: 'Destination is required',
                        maxLength: {
                          value: 100,
                          message: 'Destination cannot exceed 100 characters'
                        }
                      })}
                      error={!!errors.destination}
                      helperText={errors.destination?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DirectionsIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {commonLocations.slice(4, 8).map((location) => (
                        <Chip
                          key={location}
                          label={location}
                          size="small"
                          onClick={() => setValue('destination', location)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Date & Time */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Date & Time
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ride Date"
                      type="date"
                      {...register('date', { required: 'Date is required' })}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0]
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Time"
                      type="time"
                      {...register('time', {
                        required: 'Time is required',
                        pattern: {
                          value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                          message: 'Please enter a valid time (HH:MM)'
                        }
                      })}
                      error={!!errors.time}
                      helperText={errors.time?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Vehicle & Seats */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Vehicle & Seating
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.vehicleType}>
                      <InputLabel>Vehicle Type</InputLabel>
                      <Select
                        {...register('vehicleType', { required: 'Vehicle type is required' })}
                        label="Vehicle Type"
                        value={watch('vehicleType') || ''}
                      >
                        {vehicleTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: 8 }}>{type.icon}</span>
                              {type.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.vehicleType && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {errors.vehicleType.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Total Seats"
                      type="number"
                      {...register('totalSeats', {
                        required: 'Total seats is required',
                        min: { value: 1, message: 'At least 1 seat required' },
                        max: { value: 8, message: 'Maximum 8 seats allowed' }
                      })}
                      error={!!errors.totalSeats}
                      helperText={errors.totalSeats?.message}
                      InputProps={{
                        inputProps: { min: 1, max: 8 }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Pricing */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Pricing
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Price per Seat"
                      type="number"
                      {...register('pricePerSeat', {
                        required: 'Price per seat is required',
                        min: { value: 0, message: 'Price cannot be negative' }
                      })}
                      error={!!errors.pricePerSeat}
                      helperText={errors.pricePerSeat?.message || 'Price per seat - total will be calculated based on number of seats booked'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                        inputProps: { min: 0, step: 0.01 }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Estimated Duration (minutes)"
                      type="number"
                      {...register('estimatedDuration', {
                        min: { value: 1, message: 'Duration must be at least 1 minute' }
                      })}
                      error={!!errors.estimatedDuration}
                      helperText={errors.estimatedDuration?.message}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Additional Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Additional Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Meeting Point"
                      {...register('meetingPoint', {
                        maxLength: {
                          value: 200,
                          message: 'Meeting point cannot exceed 200 characters'
                        }
                      })}
                      error={!!errors.meetingPoint}
                      helperText={errors.meetingPoint?.message || 'Specific location where passengers should meet you'}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      {...register('description', {
                        maxLength: {
                          value: 500,
                          message: 'Description cannot exceed 500 characters'
                        }
                      })}
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Any additional information about the ride (optional)'}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/staff/rides')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Creating...' : 'Create Ride'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </Container>
  );
};

export default CreateRidePage;
