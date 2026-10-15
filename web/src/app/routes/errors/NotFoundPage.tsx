import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../config/routePaths';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          background: 'background.paper',
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          sx={{ width: 64, height: 64, color: 'warning.main', mb: 2, display: 'inline-block' }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Page Not Found (404)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          We couldn't find the page you were looking for:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            bgcolor: 'action.hover',
            p: 1,
            borderRadius: 1,
            mb: 3,
            wordBreak: 'break-all',
          }}
        >
          {location.pathname}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(ROUTE_PATHS.ROOT)}
        >
          Return to Home
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
