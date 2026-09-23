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
  .slice(0, 9) // Get 9 items for a 3-column horizontal layout
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
    elevation={0}
    sx={{
      display: 'flex',
      flexDirection: 'row',
      height: 110, // Ultra compact height
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'grey.200',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      '&:hover': {
        borderColor: 'primary.main',
        bgcolor: 'rgba(255,107,107,0.02)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
    }}
  >
    {/* Left Side: Image */}
    <Box sx={{ position: 'relative', width: 110, height: 110, flexShrink: 0, p: 1 }}>
      <CardMedia 
        component="img" 
        image={image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'} 
        alt={name} 
        sx={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          borderRadius: 2,
        }}
        onError={(e: any) => {
          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop';
        }}
      />
      {badge && (
        <Chip
          label={badge}
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            fontWeight: 800,
            fontSize: '0.55rem',
            height: 18,
            px: 0.5,
            boxShadow: 1
          }}
        />
      )}
    </Box>

    {/* Right Side: Content */}
    <CardContent sx={{ 
      flex: 1, 
      p: 1.5, 
      pl: 0.5, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      '&:last-child': { pb: 1.5 } // Override MUI's default last-child padding
    }}>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2} noWrap title={name} sx={{ fontSize: '0.9rem' }}>
          {name}
        </Typography>
        <Typography variant="caption" color="textSecondary" noWrap title={restaurant} sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>
          {restaurant}
        </Typography>
      </Box>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Rating value={Math.floor(rating)} size="small" readOnly sx={{ fontSize: '0.8rem' }} />
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
              {rating}
            </Typography>
          </Stack>
          <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: '0.85rem' }}>
            ₹{price}
          </Typography>
        </Stack>

        <Button
          variant="contained"
          size="small"
          disableElevation
          sx={{ 
            minWidth: 0, 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            p: 0,
            color: 'white'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <ShoppingCart sx={{ fontSize: 16 }} />
        </Button>
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
          <Grid item xs={12} sm={6} md={4} key={dish.id}>
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
