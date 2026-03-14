import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import RestaurantCard from '../components/restaurant/RestaurantCard';
import FoodItemCard from '../components/food/FoodItemCard';
import { MOCK_RESTAURANTS, MOCK_FOOD_ITEMS } from '../constants/food';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState(
    MOCK_RESTAURANTS.slice(0, 3)
  );
  const [favoriteFoods, setFavoriteFoods] = useState(
    MOCK_FOOD_ITEMS.slice(0, 4)
  );

  const handleRemoveFavorite = (id: string, type: 'restaurant' | 'food') => {
    if (type === 'restaurant') {
      setFavoriteRestaurants(prev => prev.filter(r => r.id !== id));
    } else {
      setFavoriteFoods(prev => prev.filter(f => f.id !== id));
    }
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
          onChange={(_, v) => setActiveTab(v)}
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
            label={`Restaurants (${favoriteRestaurants.length})`}
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
              onClick={() => navigate('/restaurants')}
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
                    isFavorite={true}
                    onToggleFavorite={() => handleRemoveFavorite(restaurant.id, 'restaurant')}
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
              onClick={() => navigate('/restaurants')}
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
            {MOCK_RESTAURANTS.slice(4, 7).map((restaurant) => (
              <Grid item xs={12} sm={6} lg={4} key={restaurant.id}>
                <RestaurantCard
                  restaurant={restaurant}
                  isFavorite={false}
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