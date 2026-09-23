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
import { ShoppingCart } from '@mui/icons-material';
import foodItems from '../../../core/data/factories/foodItems';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../app/store';
import { showToast } from '../../ui/uiSlice';

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

// Map actual food items from the factory
const ACTUAL_TOP_DISHES: Dish[] = foodItems
  .filter(item => item.isBestSeller)
  .slice(0, 8) // Get 8 items for a 4-column layout
  .map((item, index) => ({
    id: item.id,
    name: item.name,
    restaurant: item.restaurantName,
    image: item.image,
    price: item.price,
    rating: item.rating,
    orders: 1200 + (index * 340), 
    badge: index < 2 ? 'TRENDING' : (index % 3 === 0 ? 'BESTSELLER' : undefined),
  }));

const DishCard: React.FC<Dish & { onAdd: () => void }> = ({
  name,
  restaurant,
  image,
  price,
  rating,
  orders,
  badge,
  onAdd,
}) => (
  <Card
    sx={{
      height: '100%',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 3,
      '&:hover': {
        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
        transform: 'translateY(-6px)',
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
          top: 10,
          right: 10,
          zIndex: 10,
          fontWeight: 800,
          fontSize: '0.65rem',
          height: 22,
        }}
      />
    )}

    <CardMedia 
      component="img" 
      height="140" 
      image={image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'} 
      alt={name} 
      sx={{ objectFit: 'cover' }}
      onError={(e: any) => {
        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
      }}
    />

    <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:last-child': { pb: 2 } }}>
      <Stack spacing={1}>
        {/* Name & Restaurant */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap title={name}>
            {name}
          </Typography>
          <Typography variant="caption" color="textSecondary" noWrap title={restaurant} sx={{ display: 'block', mt: 0.5 }}>
            {restaurant}
          </Typography>
        </Box>

        {/* Rating & Orders */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Rating value={Math.floor(rating)} size="small" readOnly sx={{ fontSize: '0.9rem' }} />
            <Typography variant="caption" fontWeight={700}>
              {rating}
            </Typography>
          </Stack>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
            {orders.toLocaleString()} orders
          </Typography>
        </Stack>

        {/* Price & Button */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={800} color="primary.main">
            ₹{price}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCart sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'capitalize', px: 2, py: 0.5, borderRadius: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            Add
          </Button>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

const TopDishesSection: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1.5 }}>
          MOST ORDERED
        </Typography>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
          Popular Dishes
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Discover what our customers love the most in your area
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {ACTUAL_TOP_DISHES.map((dish) => (
          <Grid item xs={12} sm={6} md={3} key={dish.id}>
            <DishCard 
              {...dish} 
              onAdd={() => dispatch(showToast({ message: `${dish.name} added to cart!`, type: 'success' }))} 
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Button
          variant="outlined"
          size="large"
          sx={{ textTransform: 'capitalize', px: 4, py: 1.2, borderRadius: 3, fontWeight: 600 }}
          onClick={() => navigate('/restaurants')}
        >
          Explore More Dishes
        </Button>
      </Box>
    </Container>
  );
};

export default TopDishesSection;
