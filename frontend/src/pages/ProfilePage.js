import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ProfilePage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page will contain the user profile management interface.
        </Typography>
      </Box>
    </Container>
  );
};

export default ProfilePage;
