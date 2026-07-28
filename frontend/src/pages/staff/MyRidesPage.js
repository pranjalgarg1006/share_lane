import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const MyRidesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [activeRides, setActiveRides] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [hasEverCreatedRides, setHasEverCreatedRides] = useState(false);
  const [pagination, setPagination] = useState({
    active: { currentPage: 1, totalPages: 1, totalRides: 0 },
    history: { currentPage: 1, totalPages: 1, totalRides: 0 }
  });

  useEffect(() => {
    fetchRides();
  }, [activeTab]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 0) {
        // Fetch active rides (excludes expired)
        const response = await ridesAPI.getMyRides({ 
          page: pagination.active.currentPage,
          limit: 10
        });
        setActiveRides(response.data.data.rides);
        setPagination(prev => ({
          ...prev,
          active: response.data.data.pagination
        }));
      } else {
        // Fetch ride history (includes expired)
        const response = await ridesAPI.getMyRideHistory({ 
          page: pagination.history.currentPage,
          limit: 10
        });
        setRideHistory(response.data.data.rides);
        setPagination(prev => ({
          ...prev,
          history: response.data.data.pagination
        }));
      }

      // Check if staff member has ever created rides (using history tab data)
      const historyResponse = await ridesAPI.getMyRideHistory({ limit: 1 });
      const hasEverCreatedRides = historyResponse.data.data.pagination.totalRides > 0;
      console.log('MyRidesPage - Ride history check:', {
        totalRides: historyResponse.data.data.pagination.totalRides,
        hasEverCreatedRides,
        rides: historyResponse.data.data.rides
      });
      setHasEverCreatedRides(hasEverCreatedRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <ScheduleIcon />;
      case 'completed': return <HistoryIcon />;
      case 'cancelled': return <DeleteIcon />;
      case 'expired': return <HistoryIcon />;
      default: return <CarIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEditRide = (rideId) => {
    navigate(`/staff/rides/edit/${rideId}`);
  };

  const handleViewRide = (rideId) => {
    navigate(`/rides/${rideId}`);
  };

  const handleDeleteRide = async (rideId) => {
    if (window.confirm('Are you sure you want to delete this ride?')) {
      try {
        await ridesAPI.deleteRide(rideId);
        toast.success('Ride deleted successfully');
        fetchRides();
      } catch (error) {
        console.error('Error deleting ride:', error);
        toast.error('Failed to delete ride');
      }
    }
  };

  const renderRideList = (rides, isHistory = false) => {
    if (loading) {
      return <LinearProgress />;
    }

    if (rides.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {isHistory ? 'No ride history found' : 'No active rides found'}
          </Typography>
          {!isHistory && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/staff/rides/create')}
            >
              {hasEverCreatedRides ? 'Create New Ride' : 'Create Your First Ride'}
            </Button>
          )}
        </Box>
      );
    }

    return (
      <List>
        {rides.map((ride, index) => (
          <React.Fragment key={ride._id}>
            <ListItem
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper'
              }}
            >
              <ListItemIcon>
                {getStatusIcon(ride.status)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">
                      {ride.pickupLocation} → {ride.destination}
                    </Typography>
                    <Chip
                      label={ride.status}
                      size="small"
                      color={getStatusColor(ride.status)}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatDate(ride.date)} at {formatTime(ride.time)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {ride.availableSeats}/{ride.totalSeats} seats available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{ride.pricePerSeat} per seat
                      </Typography>
                      {ride.vehicleType && (
                        <Typography variant="body2" color="text.secondary">
                          {ride.vehicleType}
                        </Typography>
                      )}
                    </Box>
                    {ride.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {ride.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => handleViewRide(ride._id)}
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                {ride.status === 'active' && (
                  <>
                    <Tooltip title="Edit Ride">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRide(ride._id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Ride">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRide(ride._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </ListItem>
            {index < rides.length - 1 && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            My Rides
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/staff/rides/create')}
          >
            Create New Ride
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label={`Active Rides (${pagination.active.totalRides})`} 
              icon={<ScheduleIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`Ride History (${pagination.history.totalRides})`} 
              icon={<HistoryIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Content */}
        {activeTab === 0 ? renderRideList(activeRides) : renderRideList(rideHistory, true)}
      </Box>
    </Container>
  );
};

export default MyRidesPage;
