import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  Rating,
} from '@mui/material';
import { ShoppingCart, Star } from '@mui/icons-material';

interface Dish {
  id: string;
  name: string;
  restaurant: string;
  image: string;
  price: number;
  rating: number;
  orders: number;
  badge?: string;
}

const TOP_DISHES: Dish[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    restaurant: 'Pizza Palace',
    image: 'https://images.unsplash.com/photo-1579192181049-1290520d00d5?w=400&h=300&fit=crop',
    price: 299,
    rating: 4.8,
    orders: 2400,
    badge: 'BESTSELLER',
  },
  {
    id: '2',
    name: 'Butter Chicken',
    restaurant: 'Curry Kitchen',
    image: 'https://images.unsplash.com/photo-1603070706739-b620dadc0ab0?w=400&h=300&fit=crop',
    price: 349,
    rating: 4.9,
    orders: 3100,
    badge: 'TOP RATED',
  },
  {
    id: '3',
    name: 'Classic Burger',
    restaurant: 'Burger Hub',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    price: 249,
    rating: 4.7,
    orders: 2800,
    badge: 'TRENDING',
  },
  {
    id: '4',
    name: 'Pad Thai',
    restaurant: 'Noodle House',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64e41?w=400&h=300&fit=crop',
    price: 279,
    rating: 4.6,
    orders: 2100,
  },
  {
    id: '5',
    name: 'Chocolate Lava Cake',
    restaurant: 'Sweet Delights',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    price: 199,
    rating: 4.9,
    orders: 1900,
  },
  {
    id: '6',
    name: 'Sushi Roll Combo',
    restaurant: 'Sushi Dreams',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    price: 399,
    rating: 4.8,
    orders: 1700,
  },
];

const DishCard: React.FC<Dish> = ({
  name,
  restaurant,
  image,
  price,
  rating,
  orders,
  badge,
}) => (
  <Card
    sx={{
      height: '100%',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'visible',
      '&:hover': {
        boxShadow: 4,
        transform: 'translateY(-8px)',
      },
    }}
  >
    {/* Badge */}
    {badge && (
      <Chip
        label={badge}
        size="small"
        color="primary"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          fontWeight: 700,
          fontSize: '0.7rem',
        }}
      />
    )}

    <CardMedia component="img" height="200" image={image} alt={name} />

    <CardContent sx={{ pb: 2 }}>
      <Stack spacing={1.5}>
        {/* Name & Restaurant */}
        <Box>
          <Typography variant="h6" fontWeight={700} noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {restaurant}
          </Typography>
        </Box>

        {/* Rating & Orders */}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Rating value={Math.floor(rating)} size="small" readOnly />
            <Typography variant="caption" fontWeight={700}>
              {rating}
            </Typography>
          </Stack>
          <Typography variant="caption" color="textSecondary">
            {orders.toLocaleString()} orders
          </Typography>
        </Stack>

        {/* Price & Button */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="h6" fontWeight={700} color="primary">
            ₹{price}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCart sx={{ fontSize: 18 }} />}
            sx={{ textTransform: 'capitalize' }}
          >
            Add
          </Button>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

const TopDishesSection: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main' }}>
          MOST ORDERED
        </Typography>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Popular Dishes
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Discover what our customers love the most
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {TOP_DISHES.map((dish) => (
          <Grid item xs={12} sm={6} md={4} key={dish.id}>
            <DishCard {...dish} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Button
          variant="outlined"
          size="large"
          sx={{ textTransform: 'capitalize', px: 4, py: 1.5 }}
        >
          Explore More Dishes
        </Button>
      </Box>
    </Container>
  );
};

export default TopDishesSection;
