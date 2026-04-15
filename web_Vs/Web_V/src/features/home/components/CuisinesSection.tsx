import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface Cuisine {
  id: string;
  name: string;
  image: string;
  count: number;
  emoji: string;
}

const CUISINES: Cuisine[] = [
  {
    id: '1',
    name: 'Pizza & Italian',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=300&fit=crop',
    count: 45,
    emoji: '🍕',
  },
  {
    id: '2',
    name: 'Burgers & Western',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=300&fit=crop',
    count: 38,
    emoji: '🍔',
  },
  {
    id: '3',
    name: 'Indian Curry',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=300&fit=crop',
    count: 52,
    emoji: '🍛',
  },
  {
    id: '4',
    name: 'Chinese & Noodles',
    image: 'https://images.unsplash.com/photo-1608050546052-fa457b4d6dfd?w=500&h=300&fit=crop',
    count: 41,
    emoji: '🍜',
  },
  {
    id: '5',
    name: 'Sushi & Japanese',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=300&fit=crop',
    count: 33,
    emoji: '🍣',
  },
  {
    id: '6',
    name: 'Desserts & Sweets',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=300&fit=crop',
    count: 28,
    emoji: '🍰',
  },
];

const CuisinesSection: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main' }}>
            EXPLORE
          </Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Food Cuisines & Restaurants
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Browse through tons of restaurants serving your favorite cuisines
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {CUISINES.map((cuisine) => (
            <Grid item xs={12} sm={6} md={4} key={cuisine.id}>
              <Card
                sx={{
                  position: 'relative',
                  height: 280,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  group: true,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="280"
                  image={cuisine.image}
                  alt={cuisine.name}
                  sx={{
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                />
                {/* Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 2,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h4">{cuisine.emoji}</Typography>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="white">
                        {cuisine.name}
                      </Typography>
                      <Typography variant="caption" color="grey.300">
                        {cuisine.count} restaurants
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{ textTransform: 'capitalize', px: 4, py: 1.5 }}
          >
            View All Cuisines
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CuisinesSection;
