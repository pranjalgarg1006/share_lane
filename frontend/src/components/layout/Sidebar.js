import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  Add as AddIcon,
  Search as SearchIcon,
  BookmarkBorder as BookingsIcon,
  Payment as PaymentIcon,
  RateReview as ReviewsIcon,
  Person as ProfileIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const drawerWidth = 280;

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    if (user.role === 'staff') {
      return [
        {
          label: 'Dashboard',
          path: '/staff/dashboard',
          icon: <DashboardIcon />,
          description: 'Overview and analytics'
        },
        {
          label: 'My Rides',
          path: '/staff/rides',
          icon: <CarIcon />,
          description: 'Manage your rides'
        },
        {
          label: 'Create Ride',
          path: '/staff/rides/create',
          icon: <AddIcon />,
          description: 'Add new ride'
        },
        {
          label: 'Chat',
          path: '/staff/chat',
          icon: <ChatIcon />,
          description: 'Chat with students'
        },
        {
          label: 'Earnings',
          path: '/staff/earnings',
          icon: <TrendingUpIcon />,
          description: 'View earnings'
        }
      ];
    } else {
      return [
        {
          label: 'Dashboard',
          path: '/student/dashboard',
          icon: <DashboardIcon />,
          description: 'Overview and recent activity'
        },
        {
          label: 'Search Rides',
          path: '/student/search',
          icon: <SearchIcon />,
          description: 'Find available rides'
        },
        {
          label: 'My Bookings',
          path: '/student/bookings',
          icon: <BookingsIcon />,
          description: 'View your bookings'
        }
      ];
    }
  };

  // Common navigation items
  const commonItems = [
    {
      label: 'Payment History',
      path: '/payments/history',
      icon: <PaymentIcon />,
      description: 'Transaction history'
    },
    {
      label: 'Reviews',
      path: '/reviews',
      icon: <ReviewsIcon />,
      description: 'View and manage reviews'
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: <ProfileIcon />,
      description: 'Account settings'
    }
  ];

  const navigationItems = [...getNavigationItems(), ...commonItems];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
            '&:hover': {
              color: 'text.primary',
              backgroundColor: 'action.hover'
            }
          }}
          aria-label="close sidebar"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', pr: 4 }}>
          {user && user.role === 'staff' ? 'Staff Portal' : 'Student Portal'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.name}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  onClose(); // Close sidebar after navigation
                }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'text.secondary',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: isActive ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          ShareLane v1.0.0
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Campus Ride Sharing
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          top: 0,
          height: '100vh',
          borderRight: 1,
          borderColor: 'divider',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
