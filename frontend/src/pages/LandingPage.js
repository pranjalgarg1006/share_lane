import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon,
  TwoWheeler as BikeIcon,
  DirectionsBus as BusIcon,
  ElectricScooter as ScooterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <CarIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Easy Ride Sharing',
      description: 'Find or create rides with just a few clicks. Connect with fellow campus members for convenient transportation.'
    },
    {
      icon: <PaymentIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure Payments',
      description: 'Payment processing feature is currently under development. Coming soon!'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Verified Users',
      description: 'All users are verified with campus credentials. Ride with confidence knowing you\'re in safe hands.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Real-time Updates',
      description: 'Get instant notifications about bookings, payments, and ride updates. Stay informed every step of the way.'
    },
    {
      icon: <StarIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Rating System',
      description: 'Rate and review your ride experiences. Build trust and help others make informed decisions.'
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Community Driven',
      description: 'Join a community of students and staff working together to make campus transportation more efficient.'
    }
  ];


  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Student',
      avatar: 'SJ',
      text: 'ShareLane has made my daily commute so much easier and affordable. I\'ve met great people and saved money!',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Staff Member',
      avatar: 'MC',
      text: 'As a staff member, I love being able to offer rides and earn some extra income while helping students.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Student',
      avatar: 'ED',
      text: 'The payment system is so smooth and the real-time notifications keep me updated on everything.',
      rating: 5
    }
  ];

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      // For staff users, we need to validate authorization first
      if (user.role === 'staff') {
        // Navigate to staff dashboard - ProtectedRoute will handle authorization
        navigate('/staff/dashboard');
      } else {
        // Student users can go directly to their dashboard
        navigate('/student/dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  return (
    <Box>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          
          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            75% { transform: rotate(-2deg); }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
        `}
      </style>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    background: 'linear-gradient(45deg, #fff 30%, #e3f2fd 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  ShareLane
                </Typography>
                <Typography
                  variant={isMobile ? 'h3' : 'h2'}
                  component="h1"
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Campus Ride Sharing
                  <br />
                  Made Simple
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}
                >
                  Connect with fellow students and staff for convenient, 
                  affordable, and eco-friendly transportation around campus.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetStarted}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      backgroundColor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                textAlign: 'center', 
                position: 'relative',
                height: 300,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* Organized vehicle grid layout with animations */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: 3,
                  width: '100%',
                  maxWidth: 400,
                  alignItems: 'center',
                  justifyItems: 'center'
                }}>
                  {/* Top row */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'float 3s ease-in-out infinite',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(5deg)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(255,255,255,0.3)',
                      transition: 'all 0.3s ease'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                      animation: 'shimmer 2s infinite',
                      transform: 'rotate(45deg)'
                    }
                  }}>
                    <BusIcon sx={{ 
                      fontSize: 40, 
                      opacity: 0.9, 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      animation: 'bounce 2s ease-in-out infinite'
                    }} />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: 100,
                    height: 100,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'pulse 2s ease-in-out infinite',
                    '&:hover': {
                      transform: 'scale(1.15) rotate(-5deg)',
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      boxShadow: '0 12px 40px rgba(255,255,255,0.4)',
                      transition: 'all 0.3s ease'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.15), transparent)',
                      animation: 'shimmer 2.5s infinite',
                      transform: 'rotate(45deg)'
                    }
                  }}>
                    <CarIcon sx={{ 
                      fontSize: 50, 
                      opacity: 1, 
                      color: 'white',
                      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                      animation: 'wiggle 1.5s ease-in-out infinite'
                    }} />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'float 3.5s ease-in-out infinite',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(-3deg)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(255,255,255,0.3)',
                      transition: 'all 0.3s ease'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                      animation: 'shimmer 1.8s infinite',
                      transform: 'rotate(45deg)'
                    }
                  }}>
                    <ScooterIcon sx={{ 
                      fontSize: 40, 
                      opacity: 0.9, 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      animation: 'bounce 2.2s ease-in-out infinite'
                    }} />
                  </Box>
                  
                  {/* Bottom row */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'float 2.8s ease-in-out infinite',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(4deg)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(255,255,255,0.3)',
                      transition: 'all 0.3s ease'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                      animation: 'shimmer 2.2s infinite',
                      transform: 'rotate(45deg)'
                    }
                  }}>
                    <BikeIcon sx={{ 
                      fontSize: 40, 
                      opacity: 0.9, 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      animation: 'bounce 1.8s ease-in-out infinite'
                    }} />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: 100,
                    height: 100,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'pulse 2.3s ease-in-out infinite',
                    '&:hover': {
                      transform: 'scale(1.15) rotate(3deg)',
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      boxShadow: '0 12px 40px rgba(255,255,255,0.4)',
                      transition: 'all 0.3s ease'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.15), transparent)',
                      animation: 'shimmer 2.8s infinite',
                      transform: 'rotate(45deg)'
                    }
                  }}>
                    <CarIcon sx={{ 
                      fontSize: 50, 
                      opacity: 1, 
                      color: 'white',
                      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                      animation: 'wiggle 1.7s ease-in-out infinite'
                    }} />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'float 3.2s ease-in-out infinite',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(-4deg)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(255,255,255,0.3)',
                      transition: 'all 0.3s ease'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                      animation: 'shimmer 2.4s infinite',
                      transform: 'rotate(45deg)'
                    }
                  }}>
                    <BusIcon sx={{ 
                      fontSize: 40, 
                      opacity: 0.9, 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      animation: 'bounce 2.5s ease-in-out infinite'
                    }} />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>


      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: 'background.default' }} className="transition-colors duration-200">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Why Choose ShareLane?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              We provide a comprehensive platform that makes campus transportation 
              convenient, safe, and affordable for everyone.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 8, backgroundColor: 'background.paper' }} className="transition-colors duration-200">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              What Our Users Say
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Join thousands of satisfied users who trust ShareLane
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} sx={{ color: 'warning.main', fontSize: 20 }} />
                      ))}
                    </Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{testimonial.text}"
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          py: 8
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join our community today and experience the future of campus transportation
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 2,
                px: 6,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Start Your Journey
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, backgroundColor: 'background.default', borderTop: 1, borderColor: 'divider' }} className="transition-colors duration-200">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              ShareLane
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Campus Ride Sharing Platform
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
