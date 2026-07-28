import React from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

export const AuthProvider = ({ children }) => {
  return <>{children}</>;
};

export const useAuth = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded, isSignedIn, signOut } = useClerkAuth();
  
  const loading = !userLoaded || !authLoaded;
  
  const formattedUser = React.useMemo(() => {
    return user ? {
      _id: user.id,
      name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
      role: 'student', // Mock role for now, in a real app this would be synced from Convex
    } : null;
  }, [user]);
  
  return {
    user: formattedUser,
    isAuthenticated: isSignedIn,
    loading,
    logout: () => signOut(),
    // Mock implementations for old custom auth functions to prevent crashes
    login: () => {},
    register: () => {},
    verifyOtp: () => {},
    resendOtp: () => {},
    updateProfile: () => {},
    clearError: () => {},
    loadUser: () => {}
  };
};

export default { AuthProvider, useAuth };
