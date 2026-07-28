import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Box } from '@mui/material';

const RegisterPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <SignUp routing="path" path="/register" signInUrl="/login" forceRedirectUrl="/student/dashboard" />
    </Box>
  );
};

export default RegisterPage;
