import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Rating,
} from '@mui/material';
import { FormatQuote } from '@mui/icons-material';

interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role: string;
  text: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    role: 'Regular Customer',
    text: 'Amazing platform! Food arrives faster than expected and always hot. The app is so easy to use. Highly recommended!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    avatar: 'https://i.pravatar.cc/150?u=rajesh',
    role: 'Food Lover',
    text: 'Best food delivery app I\'ve used. Great discounts, variety of restaurants, and reliable delivery partners.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Priya Sharma',
    avatar: 'https://i.pravatar.cc/150?u=priya',
    role: 'Busy Professional',
    text: 'Saves me so much time! With work pressure, I rely on this app. Love the scheduled delivery feature.',
    rating: 4,
  },
  {
    id: '4',
    name: 'Amit Patel',
    avatar: 'https://i.pravatar.cc/150?u=amit',
    role: 'Family Person',
    text: 'Quality food, amazing service, and the rewards program is fantastic. Worth every penny!',
    rating: 5,
  },
];

const TestimonialCard: React.FC<Testimonial> = ({
  name,
  avatar,
  role,
  text,
  rating,
}) => (
  <Card
    sx={{
      height: '100%',
      position: 'relative',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: 4,
        transform: 'translateY(-4px)',
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      {/* Quote Icon */}
      <Box sx={{ mb: 2, color: 'primary.main', opacity: 0.3 }}>
        <FormatQuote sx={{ fontSize: 40 }} />
      </Box>

      {/* Testimonial Text */}
      <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic', color: 'textSecondary' }}>
        "{text}"
      </Typography>

      {/* Rating */}
      <Box sx={{ mb: 2 }}>
        <Rating value={rating} readOnly size="small" />
      </Box>

      {/* User Info */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={avatar} alt={name} sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {role}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const TestimonialsSection: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main' }}>
            TESTIMONIALS
          </Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            What Our Customers Say
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Join thousands of happy customers enjoying delicious food delivered to their doorstep
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {TESTIMONIALS.map((testimonial) => (
            <Grid item xs={12} sm={6} md={3} key={testimonial.id}>
              <TestimonialCard {...testimonial} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
