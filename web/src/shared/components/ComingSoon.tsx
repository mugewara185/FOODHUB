import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface ComingSoonProps {
  title?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname.startsWith('/owner')) return navigate('/owner');
    if (location.pathname.startsWith('/admin')) return navigate('/admin');
    if (location.pathname.startsWith('/partner')) return navigate('/partner');
    return navigate('/');
  };

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
      <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <ConstructionIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {title || 'Coming Soon'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          This page is currently under construction. Please check back later.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleBack}>
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default ComingSoon;
