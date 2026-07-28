import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ReviewsPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page will contain the reviews management interface.
        </Typography>
      </Box>
    </Container>
  );
};

export default ReviewsPage;
