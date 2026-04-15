import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  Paper,
  InputBase,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Search,
  NavigateNext,
  LocalOffer,
  Timer,
  DeliveryDining,
  Star,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  fetchRestaurants,
  selectFeaturedRestaurants,
  selectAllRestaurants,
  selectRestaurantLoading,
  filterByCuisine,
} from '../../../features/restaurant/restaurantSlice';
import RestaurantCard from '../../../features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { showToast } from '../../../features/ui/uiSlice';

// Import new section components
import PromoSection from '@features/home/components/PromoSection';
import CuisinesSection from '@features/home/components/CuisinesSection';
import HowItWorksSection from '@features/home/components/HowItWorksSection';
import TestimonialsSection from '@features/home/components/TestimonialsSection';
import StatsSection from '@features/home/components/StatsSection';
import TopDishesSection from '@features/home/components/TopDishesSection';
import QuickDeliverySection from '@features/home/components/QuickDeliverySection';

const HomeV: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const loading = useAppSelector(selectRestaurantLoading);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch restaurants on component mount
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
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Order food from the best restaurants near you
              </Typography>

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

        {/* Why Choose Us Section - Brand Differentiation */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Why Choose FoodHub?
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            We deliver excellence with every order
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: <Timer sx={{ fontSize: 40, color: 'primary.main' }} />,
                title: 'Fast Delivery',
                description: 'Get your food delivered in 30 minutes or less',
              },
              {
                icon: <Star sx={{ fontSize: 40, color: 'warning.main' }} />,
                title: 'Quality Food',
                description: 'Fresh ingredients from trusted restaurants',
              },
              {
                icon: <LocalOffer sx={{ fontSize: 40, color: 'success.main' }} />,
                title: 'Best Offers',
                description: 'Enjoy great discounts and cashback offers',
              },
              {
                icon: <DeliveryDining sx={{ fontSize: 40, color: 'error.main' }} />,
                title: 'Easy Ordering',
                description: 'Simple and intuitive ordering process',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* App Download Banner */}
        <Paper
          sx={{
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Get the FoodHub App
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Download our app for faster ordering, exclusive offers, and better experience
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: 'black',
                color: 'white',
                px: 4,
                '&:hover': { bgcolor: '#333' },
              }}
            >
              App Store
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                px: 4,
                '&:hover': { bgcolor: 'success.dark' },
              }}
            >
              Google Play
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default HomeV;
