import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Paper,
  InputBase,
  IconButton,
  Stack,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search,
  NavigateNext,
  Code,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store/';
import {
  fetchRestaurants,
  selectFeaturedRestaurants,
  selectAllRestaurants,
  selectRestaurantLoading,
  filterByCuisine,
} from '../../../features/restaurant/restaurantSlice';
import RestaurantCard from '../../../features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { showToast } from '../../../features/ui/uiSlice';
import { CUISINES } from '../../../core/constants/food';
//dev
import { useDevContext } from '../../../core/dev/contexts/DevContext';
import { FloatingDevConsole } from '../../../features/ui/components/FloatingDevConsole';

// Import new section components
import PromoSection from '@features/home/components/PromoSection';
import CuisinesSection from '@features/home/components/CuisinesSection';
import HowItWorksSection from '@features/home/components/HowItWorksSection';
import TestimonialsSection from '@features/home/components/TestimonialsSection';
import StatsSection from '@features/home/components/StatsSection';
import TopDishesSection from '@features/home/components/TopDishesSection';
import QuickDeliverySection from '@features/home/components/QuickDeliverySection';

const HomeV2: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { availableVersions, selectedVersions } = useDevContext();

  const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const loading = useAppSelector(selectRestaurantLoading);
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    dispatch(fetchRestaurants())
      .unwrap()
      .catch((error) => {
        dispatch(showToast({
          message: String(error) || 'Failed to load restaurants',
          type: 'error'
        }));
      });
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCuisineClick = (cuisine: string) => {
    dispatch(filterByCuisine(cuisine));
    navigate(`/restaurants?cuisine=${cuisine}`);
  };

  const handleViewAll = (type: string) => {
    navigate(`/restaurants?filter=${type}`);
  };

  return (
    <Box sx={{ pb: { xs: 7, md: 0 } }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" fontWeight={800} gutterBottom>
                Craving something delicious?
              </Typography>
              <Typography variant="h5" sx={{ mb: 2, opacity: 0.9 }}>
                Order food from the best restaurants near you
              </Typography>
              <Chip
                label="Development Mode - V2 Renderer"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ mb: 3, color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              />

              {/* Search Bar */}
              <Paper
                component="form"
                onSubmit={handleSearch}
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 3,
                  bgcolor: 'white',
                  maxWidth: 600,
                }}
              >
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search for restaurants or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <IconButton type="submit" sx={{ p: '10px' }} color="primary">
                  <Search />
                </IconButton>
              </Paper>

              {/* Quick Stats */}
              <Stack direction="row" spacing={4} sx={{ mt: 4 }}>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {allRestaurants.length}+
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Restaurants
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    200+
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Dishes
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    10k+
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Customers
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop"
                alt="Food Delivery"
                sx={{
                  width: '100%',
                  borderRadius: 4,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Divider sx={{ my: 4 }} />

        {/* Regular Home Page Content */}
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
          📍 Live Components (Swappable via Dev Renderer)
        </Typography>

        {/* Stats Section - Credibility & Impact */}
        <StatsSection />

        {/* Promo Section - Call to Action with Offers */}
        <PromoSection />

        {/* Quick Delivery Section - Express Service Hook */}
        <QuickDeliverySection />

        {/* Cuisines Section - Browse by Category */}
        <CuisinesSection />

        {/* Featured Restaurants - Existing Redux Integration */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Featured Restaurants
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Discover top-rated restaurants near you
              </Typography>
            </Box>
            <Button
              endIcon={<NavigateNext />}
              onClick={() => handleViewAll('featured')}
            >
              View All
            </Button>
          </Box>

          {loading ? (
            <Typography>Loading restaurants...</Typography>
          ) : (
            <Grid container spacing={3}>
              {featuredRestaurants.map((restaurant) => (
                <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
                  <RestaurantCard
                    restaurant={restaurant}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Top Dishes Section - Popular Items */}
        <TopDishesSection />

        {/* How It Works Section - User Education */}
        <HowItWorksSection />

        {/* Testimonials Section - Social Proof */}
        <TestimonialsSection />
      </Container>

      {/* Floating Dev Console */}
      <FloatingDevConsole
        allRestaurants={allRestaurants}
        featuredRestaurants={featuredRestaurants}
        loading={loading}
        availableVersions={availableVersions}
        selectedVersions={selectedVersions}
        cuisineLength={CUISINES.length}
      />
    </Box>
  );
};

export default HomeV2;
