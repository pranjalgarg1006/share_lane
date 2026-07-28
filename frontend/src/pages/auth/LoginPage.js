import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Box } from '@mui/material';

const LoginPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <SignIn routing="path" path="/login" signUpUrl="/register" forceRedirectUrl="/student/dashboard" />
    </Box>
  );
};

export default LoginPage;
