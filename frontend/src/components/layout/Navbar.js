import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Menu as MenuIcon,
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { notificationsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const { user, logout } = useAuth();
  const { isConnected, socket, onNewNotification } = useSocket();
  const { theme, toggleTheme } = useAppTheme();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle notification menu
  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 10 });
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Listen for new notifications via Socket.IO
  useEffect(() => {
    if (socket && isConnected && onNewNotification) {
      const handleNewNotification = (data) => {
        if (data.notification) {
          // Add notification to the list
          setNotifications(prev => [data.notification, ...prev]);
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          // Show toast notification
          toast.info(data.notification.message, {
            onClick: () => {
              if (data.notification.actionUrl) {
                navigate(data.notification.actionUrl);
              }
            }
          });
        }
      };

      onNewNotification(handleNewNotification);

      return () => {
        if (socket) {
          socket.off('new_notification', handleNewNotification);
        }
      };
    }
  }, [socket, isConnected, onNewNotification, navigate]);

  // Fetch initial notification count
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Refresh notification count periodically
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    handleProfileMenuClose();
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];
    
    if (user.role === 'staff') {
      return [
        { label: 'Dashboard', path: '/staff/dashboard' },
        { label: 'My Rides', path: '/staff/rides' },
        { label: 'Create Ride', path: '/staff/rides/create' },
      ];
    } else {
      return [
        { label: 'Dashboard', path: '/student/dashboard' },
        { label: 'Search Rides', path: '/student/search' },
        { label: 'My Bookings', path: '/student/bookings' },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* Menu Button - Only show when sidebar is closed */}
        {!sidebarOpen && (
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Box
          display="flex"
          alignItems="center"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <CarIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            ShareLane
          </Typography>
        </Box>

        {/* Navigation Items - Desktop */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, ml: 4 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Right side items */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          {/* Theme Toggle */}
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: 1 }}
            aria-label="toggle theme"
          >
            {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Connection Status */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              mr: 1
            }}
          />

          {/* Notifications */}
          {user && (
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}

          {/* Profile Menu */}
          {user ? (
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
            <AccountCircle sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => { navigate('/payments/history'); handleProfileMenuClose(); }}>
            Payment History
          </MenuItem>
          <MenuItem onClick={() => { navigate('/reviews'); handleProfileMenuClose(); }}>
            Reviews
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { width: 320, maxHeight: 400 }
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Notifications</Typography>
          </Box>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification._id}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification._id);
                    }
                    if (notification.actionUrl) {
                      navigate(notification.actionUrl);
                    }
                    handleNotificationMenuClose();
                  }}
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.1)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: notification.isRead ? 'action.hover' : 'rgba(59, 130, 246, 0.2)'
                    }
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
