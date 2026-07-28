import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  Pagination,
  Rating
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { ridesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const SearchRidesPage = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRides, setTotalRides] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState({});

  const {
    register,
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      pickupLocation: '',
      destination: '',
      date: '',
      vehicleType: '',
      maxPrice: '',
      sortBy: 'date'
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchRides(searchParams);
  }, [page, searchParams]);

  const fetchRides = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 10,
        ...searchParams
      };

      console.log('Fetching rides with params:', params);
      const response = await ridesAPI.getRides(params);
      const { rides: fetchedRides, pagination } = response.data.data;
      setRides(fetchedRides);
      setTotalPages(pagination.totalPages);
      setTotalRides(pagination.totalRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError('Failed to fetch rides');
      toast.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };


  const handleClearFilters = () => {
    reset();
    setPage(1);
    setSearchParams({});
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleChipClick = (field, value) => {
    setValue(field, value);
    // Trigger immediate search with the new value
    const newSearchParams = {
      ...searchParams,
      [field === 'pickupLocation' ? 'pickup' : 'destination']: value
    };
    setPage(1);
    setSearchParams(newSearchParams);
  };

  const handleApplyFilters = () => {
    const currentValues = watchedValues;
    console.log('Applying filters with values:', currentValues);
    
    const newSearchParams = {
      pickup: currentValues.pickupLocation || undefined,
      destination: currentValues.destination || undefined,
      date: currentValues.date && currentValues.date.trim() !== '' ? new Date(currentValues.date).toISOString().split('T')[0] : undefined,
      vehicleType: currentValues.vehicleType || undefined,
      maxPrice: currentValues.maxPrice || undefined,
      sortBy: currentValues.sortBy || 'date',
      sortOrder: currentValues.sortBy === '-price' ? 'desc' : 'asc'
    };

    // Clean up sortBy value
    if (newSearchParams.sortBy === '-price') {
      newSearchParams.sortBy = 'price';
    }

    // Remove undefined values
    Object.keys(newSearchParams).forEach(key => {
      if (newSearchParams[key] === undefined || newSearchParams[key] === '') {
        delete newSearchParams[key];
      }
    });

    console.log('Applied filters - New search params:', newSearchParams);
    setPage(1);
    setSearchParams(newSearchParams);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
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

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'car': return '🚗';
      case 'van': return '🚐';
      case 'bus': return '🚌';
      default: return '🚗';
    }
  };

  const commonLocations = [
    'Main Campus Gate', 'Library', 'Student Center', 'Parking Lot A',
    'Parking Lot B', 'Dormitory Area', 'Sports Complex', 'Cafeteria',
    'Academic Building', 'Administration Building', 'Gym', 'Cafeteria'
  ];

  return (
    <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Search Rides
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Find your perfect ride to get around campus
            </Typography>
          </Box>

          {/* Search Form */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <form onSubmit={(e) => { e.preventDefault(); }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="From"
                    {...register('pickupLocation')}
                    placeholder="Pickup location"
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
                        onClick={() => handleChipClick('pickupLocation', location)}
                        color={watchedValues.pickupLocation === location ? 'primary' : 'default'}
                        variant={watchedValues.pickupLocation === location ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="To"
                    {...register('destination')}
                    placeholder="Destination"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
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
                        onClick={() => handleChipClick('destination', location)}
                        color={watchedValues.destination === location ? 'primary' : 'default'}
                        variant={watchedValues.destination === location ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    {...register('date')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
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
              </Grid>

              {/* Advanced Filters */}
              {showFilters && (
                <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <FilterIcon sx={{ mr: 1 }} />
                    Advanced Filters
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Vehicle Type</InputLabel>
                        <Select
                          {...register('vehicleType')}
                          label="Vehicle Type"
                        >
                          <MenuItem value="">All Types</MenuItem>
                          <MenuItem value="car">🚗 Car</MenuItem>
                          <MenuItem value="van">🚐 Van</MenuItem>
                          <MenuItem value="bus">🚌 Bus</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Price"
                        type="number"
                        {...register('maxPrice')}
                        placeholder="Maximum price per seat"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          {...register('sortBy')}
                          label="Sort By"
                        >
                          <MenuItem value="date">Date</MenuItem>
                          <MenuItem value="price">Price (Low to High)</MenuItem>
                          <MenuItem value="-price">Price (High to Low)</MenuItem>
                          <MenuItem value="seats">Available Seats</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowFilters(!showFilters)}
                    startIcon={<FilterIcon />}
                  >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                  {showFilters && (
                    <Button
                      variant="contained"
                      onClick={handleApplyFilters}
                      startIcon={<FilterIcon />}
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Apply Filters'}
                    </Button>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Results */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {totalRides} ride{totalRides !== 1 ? 's' : ''} found
            </Typography>
          </Box>

          {/* Rides List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : rides.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No rides found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {Object.keys(searchParams).length > 0 
                  ? 'No rides match your current filters. Try adjusting your search criteria or explore other options.'
                  : 'Try adjusting your search criteria or check back later'
                }
              </Typography>
              {Object.keys(searchParams).length > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear All Filters
                </Button>
              )}
            </Paper>
          ) : (
            <>
              <List>
                {rides.map((ride, index) => (
                  <React.Fragment key={ride._id}>
                    <ListItem
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1,
                        mb: 1
                      }}
                      onClick={() => navigate(`/rides/${ride._id}`)}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {ride.providerId?.name?.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                              {ride.pickupLocation} → {ride.destination}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                              ₹{ride.pricePerSeat}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="div">
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mb: 0.5 }}>
                              {ride.providerId?.name} • {formatDate(ride.date)} at {formatTime(ride.time)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                icon={<CarIcon />}
                                label={`${getVehicleIcon(ride.vehicleType)} ${ride.vehicleType}`}
                                size="small"
                                color="info"
                              />
                              <Chip
                                icon={<PeopleIcon />}
                                label={`${ride.availableSeats}/${ride.totalSeats} seats`}
                                size="small"
                                color={ride.availableSeats > 0 ? 'success' : 'error'}
                              />
                              {ride.providerId?.averageRating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Rating
                                    value={ride.providerId.averageRating}
                                    readOnly
                                    size="small"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ({ride.providerId.totalReviews})
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < rides.length - 1 && <Divider />}
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
        </Box>
      </Container>
  );
};

export default SearchRidesPage;
