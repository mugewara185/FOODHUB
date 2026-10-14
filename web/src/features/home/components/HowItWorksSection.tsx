import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { LocationOn, ShoppingCart, LocalShipping, CheckCircle } from '@mui/icons-material';
import { SectionHeader } from './shared/SectionHeader';
import { Reveal } from './shared/Reveal';

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
    icon: <LocationOn sx={{ fontSize: 32 }} />,
    title: 'Explore Restaurants',
    description: 'Browse curated menus, dietary filters, and ratings near you',
    color: '#1976D2',
  },
  {
    id: 2,
    icon: <ShoppingCart sx={{ fontSize: 32 }} />,
    title: 'Choose Your Dishes',
    description: 'Select your favorite dishes and add them to your cart with one click',
    color: '#00897B',
  },
  {
    id: 3,
    icon: <LocalShipping sx={{ fontSize: 32 }} />,
    title: 'Seamless Checkout',
    description: 'Experience simulated fast checkout with transparent delivery fees',
    color: '#F57C00',
  },
  {
    id: 4,
    icon: <CheckCircle sx={{ fontSize: 32 }} />,
    title: 'Live Order Tracking',
    description: 'Follow your food order status from kitchen prep to doorstep',
    color: '#43A047',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <Box>
      <SectionHeader
        title="How It Works"
        subtitle="Ordering delicious food has never been easier. Follow these simple steps"
      />

      <Grid container spacing={{ xs: 2.5, md: 3 }}>
        {STEPS.map((step, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.id} sx={{ display: 'flex' }}>
            <Reveal delay={index * 0.08} style={{ width: '100%', display: 'flex' }}>
              <Card
                elevation={0}
                sx={{
                  width: '100%',
                  textAlign: 'center',
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                {/* Step Number Tag */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: `${step.color}18`,
                    color: step.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                  }}
                >
                  {step.id}
                </Box>

                <CardContent sx={{ p: '0 !important' }}>
                  <Stack spacing={1.25} alignItems="center">
                    <Box sx={{ color: step.color }}>{step.icon}</Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1rem', sm: '1.05rem' } }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, lineHeight: 1.5 }}
                    >
                      {step.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Reveal>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HowItWorksSection;
