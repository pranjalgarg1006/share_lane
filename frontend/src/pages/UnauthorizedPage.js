import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert
} from '@mui/material';
import {
  Security as SecurityIcon,
  Logout as LogoutIcon,
  Home as HomeIcon
} from '@mui/icons-material';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <SecurityIcon
            sx={{
              fontSize: 64,
              color: 'error.main',
              mb: 2
            }}
          />
          
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            color="error"
            fontWeight="bold"
          >
            Access Denied
          </Typography>
          
          <Typography
            variant="h6"
            color="text.secondary"
            paragraph
          >
            You are not authorized to access this area.
          </Typography>
          
          <Alert
            severity="warning"
            sx={{ mb: 3, textAlign: 'left' }}
          >
            <Typography variant="body2">
              <strong>Staff Access Required:</strong> Only authorized staff members can access this area. 
              If you believe this is an error, please contact the administrator.
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{ minWidth: 120 }}
            >
              Go Home
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ minWidth: 120 }}
            >
              Logout
            </Button>
          </Box>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            Need help? Contact support at admin@sharelane.com
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default UnauthorizedPage;



