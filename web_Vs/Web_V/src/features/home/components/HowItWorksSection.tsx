import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { LocationOn, ShoppingCart, LocalShipping, CheckCircle } from '@mui/icons-material';

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: <LocationOn sx={{ fontSize: 40 }} />,
    title: 'Set Your Location',
    description: 'Enter your delivery address to see restaurants near you',
    color: '#FF6B6B',
  },
  {
    id: 2,
    icon: <ShoppingCart sx={{ fontSize: 40 }} />,
    title: 'Browse & Order',
    description: 'Choose from thousands of dishes from your favorite restaurants',
    color: '#4ECDC4',
  },
  {
    id: 3,
    icon: <LocalShipping sx={{ fontSize: 40 }} />,
    title: 'Fast Delivery',
    description: 'Get your food delivered hot and fresh in 20-40 minutes',
    color: '#FFD93D',
  },
  {
    id: 4,
    icon: <CheckCircle sx={{ fontSize: 40 }} />,
    title: 'Enjoy Your Meal',
    description: 'Savor delicious food from the comfort of your home',
    color: '#6BCB77',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main' }}>
          SIMPLE PROCESS
        </Typography>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          How It Works
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Ordering delicious food has never been easier. Follow these simple steps
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {STEPS.map((step, index) => (
          <Grid item xs={12} sm={6} md={3} key={step.id}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                border: `2px solid ${step.color}`,
                background: `linear-gradient(135deg, ${step.color}10 0%, ${step.color}05 100%)`,
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-8px)',
                },
              }}
            >
              {/* Step Number Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 50,
                  height: 50,
                  bgcolor: step.color,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  boxShadow: `0 4px 12px ${step.color}40`,
                }}
              >
                {step.id}
              </Box>

              <CardContent sx={{ pt: 5 }}>
                <Stack spacing={2} alignItems="center">
                  <Box sx={{ color: step.color }}>{step.icon}</Box>
                  <Typography variant="h6" fontWeight={700}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {step.description}
                  </Typography>
                </Stack>
              </CardContent>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: '-50%',
                    top: '50%',
                    width: '100%',
                    height: '3px',
                    bgcolor: 'divider',
                    display: { xs: 'none', md: 'block' },
                  }}
                />
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HowItWorksSection;
