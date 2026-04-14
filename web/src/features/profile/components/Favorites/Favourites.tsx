import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogger, logComponent } from '@/core/dev/logger';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Button,
  Rating,
  Divider,
  Stack,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Restaurant,
  LocalDining,
  Delete,
  ShoppingCart,
} from '@mui/icons-material';
import RestaurantCard from '@/features/restaurant/components/RestaurantCard';
import FoodItemCard from '@/features/food/components/FoodItemCard';
import { MOCK_FOOD_ITEMS } from '@/core/constants/food';
//redux
import { useAppSelector } from '@/app/store';
import { selectSelectedRestaurant, selectAllRestaurants } from '@/features/restaurant/restaurantSlice';
import type { Restaurant as restaurantType } from '@/core/types';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { info, debug } = useLogger();
  const [activeTab, setActiveTab] = useState(0);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<restaurantType[]>(
    useAppSelector(selectAllRestaurants)
  );
  const [favoriteFoods, setFavoriteFoods] = useState(
    MOCK_FOOD_ITEMS.slice(0, 4)
  );

  useEffect(() => {
    logComponent.mount('Favorites');
    // Log initial state once on mount
    info('FEATURE', 'Favorites component mounted', {
      restaurants: favoriteRestaurants.length,
      foods: favoriteFoods.length,
    }, 'Favorites');

    return () => {
      logComponent.unmount('Favorites');
    };
  }, []);

  const handleRemoveFavorite = (id: string, type: 'restaurant' | 'food') => {
    debug('INTERACTION', `Removing ${type} from favorites`, { id, type }, 'Favorites');
    
    if (type === 'restaurant') {
      setFavoriteRestaurants(prev => prev?.filter(r => r.id !== id));
      info('ACTION', `Restaurant removed from favorites`, { restaurantId: id }, 'Favorites');
    } else {
      setFavoriteFoods(prev => prev.filter(f => f.id !== id));
      info('ACTION', `Food item removed from favorites`, { foodId: id }, 'Favorites');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const tabName = newValue === 0 ? 'Restaurants' : 'Food Items';
    info('INTERACTION', `Switched to ${tabName} tab`, { tabIndex: newValue }, 'Favorites');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          My Favorites
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your saved restaurants and dishes
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              py: 2,
            },
          }}
        >
          <Tab
            icon={<Restaurant />}
            iconPosition="start"
            label={`Restaurants (${favoriteRestaurants?.length})`}
          />
          <Tab
            icon={<LocalDining />}
            iconPosition="start"
            label={`Food Items (${favoriteFoods.length})`}
          />
        </Tabs>
      </Paper>

      {/* Favorites Grid */}
      {activeTab === 0 ? (
        favoriteRestaurants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FavoriteBorder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No favorite restaurants yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start adding restaurants to your favorites
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                info('NAVIGATION', 'Navigating to restaurants', {}, 'Favorites');
                navigate('/restaurants');
              }}
            >
              Browse Restaurants
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {favoriteRestaurants.map((restaurant) => (
              <Grid item xs={12} sm={6} lg={4} key={restaurant.id}>
                <Box sx={{ position: 'relative' }}>
                  <RestaurantCard
                    restaurant={restaurant}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'error.main', color: 'white' },
                      zIndex: 2,
                    }}
                    onClick={() => handleRemoveFavorite(restaurant.id, 'restaurant')}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        favoriteFoods.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FavoriteBorder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No favorite dishes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Save your favorite dishes for quick ordering
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                info('NAVIGATION', 'Navigating to restaurants', {}, 'Favorites');
                navigate('/restaurants');
              }}
            >
              Explore Menu
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {favoriteFoods.map((foodItem) => (
              <Box key={foodItem.id} sx={{ position: 'relative' }}>
                <FoodItemCard
                  foodItem={foodItem}
                  quantity={0}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'error.main', color: 'white' },
                    zIndex: 2,
                  }}
                  onClick={() => handleRemoveFavorite(foodItem.id, 'food')}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )
      )}

      {/* Recommendations */}
      {((activeTab === 0 && favoriteRestaurants.length > 0) ||
        (activeTab === 1 && favoriteFoods.length > 0)) && (
          <Box sx={{ mt: 6 }}>
            <Divider sx={{ mb: 4 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              You might also like
            </Typography>
            <Grid container spacing={3}>
              {favoriteRestaurants.slice(4, 7).map((restaurant) => (
                <Grid item xs={12} sm={6} lg={4} key={restaurant.id}>
                  <RestaurantCard
                    restaurant={restaurant}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
    </Container>
  );
};

export default Favorites;