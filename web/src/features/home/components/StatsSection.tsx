import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
} from '@mui/material';
import { People, LocalDining, TrendingUp, Bolt } from '@mui/icons-material';

interface Stat {
  id: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
  color: string;
}

const STATS: Stat[] = [
  {
    id: '1',
    icon: <LocalDining sx={{ fontSize: 48 }} />,
    value: '2500+',
    label: 'Restaurants',
    description: 'Across major cities',
    color: '#FF6B6B',
  },
  {
    id: '2',
    icon: <People sx={{ fontSize: 48 }} />,
    value: '50K+',
    label: 'Happy Users',
    description: 'And counting',
    color: '#4ECDC4',
  },
  {
    id: '3',
    icon: <TrendingUp sx={{ fontSize: 48 }} />,
    value: '100K+',
    label: 'Orders Delivered',
    description: 'Every month',
    color: '#FFD93D',
  },
  {
    id: '4',
    icon: <Bolt sx={{ fontSize: 48 }} />,
    value: '20-40',
    label: 'Min Delivery',
    description: 'Average time',
    color: '#6BCB77',
  },
];

const StatCard: React.FC<Stat> = ({ icon, value, label, description, color }) => (
  <Box
    sx={{
      textAlign: 'center',
      p: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'scale(1.05)',
      },
    }}
  >
    <Box sx={{ color, mb: 2, display: 'inline-block' }}>{icon}</Box>
    <Typography variant="h3" fontWeight={800} sx={{ color, mb: 1 }}>
      {value}
    </Typography>
    <Typography variant="h6" fontWeight={700} gutterBottom>
      {label}
    </Typography>
    <Typography variant="body2" color="textSecondary">
      {description}
    </Typography>
  </Box>
);

const StatsSection: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Grid container spacing={4}>
        {STATS.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.id}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default StatsSection;
