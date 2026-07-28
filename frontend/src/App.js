import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme as useAppTheme } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CreateRidePage from './pages/staff/CreateRidePage';
import MyRidesPage from './pages/staff/MyRidesPage';
import ChatPage from './pages/staff/ChatPage';
import RideDetailsPage from './pages/RideDetailsPage';
import SearchRidesPage from './pages/student/SearchRidesPage';
import MyBookingsPage from './pages/student/MyBookingsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ReviewsPage from './pages/ReviewsPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// MUI Theme Component - dynamically creates theme based on app theme
const MUIThemeWrapper = ({ children }) => {
  const { theme: appTheme } = useAppTheme();
  
  const muiTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: appTheme === 'dark' ? 'dark' : 'light',
          primary: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#1d4ed8',
          },
          secondary: {
            main: '#22c55e',
            light: '#4ade80',
            dark: '#16a34a',
          },
          background: {
            default: appTheme === 'dark' ? '#111827' : '#f8fafc',
            paper: appTheme === 'dark' ? '#1f2937' : '#ffffff',
          },
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 600,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 500,
          },
          h5: {
            fontWeight: 500,
          },
          h6: {
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              },
            },
          },
        },
      }),
    [appTheme]
  );

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is not loaded yet, show loading
  if (!user) {
    return <LoadingSpinner />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useAppTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isAuthenticated) {
    return children;
  }

  const drawerWidth = 280;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div 
        className="flex flex-col transition-all duration-300 min-h-screen"
        style={{
          marginLeft: sidebarOpen ? `${drawerWidth}px` : '0px',
          width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
        }}
      >
        <Navbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// App Routes
const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={isAuthenticated && user ? <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard'} replace /> : <LandingPage />} 
      />
      <Route 
        path="/login" 
        element={isAuthenticated && user ? <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard'} replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated && user ? <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard'} replace /> : <RegisterPage />} 
      />

      {/* Staff Routes */}
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <StaffDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rides/create"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <CreateRidePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rides"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <MyRidesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rides/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <CreateRidePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/chat"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <ChatPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <StudentDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/search"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <SearchRidesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/bookings"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <MyBookingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared Routes */}
      <Route
        path="/rides/:id"
        element={
          <AppLayout>
            <RideDetailsPage />
          </AppLayout>
        }
      />
      <Route
        path="/payments/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaymentHistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReviewsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Toast Container with theme support
const ThemedToastContainer = () => {
  const { theme } = useAppTheme();
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <MUIThemeWrapper>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <ThemedToastContainer />
          </SocketProvider>
        </AuthProvider>
      </MUIThemeWrapper>
    </ThemeProvider>
  );
};

export default App;
