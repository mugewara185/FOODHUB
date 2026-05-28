import React, { useEffect, useState } from 'react';
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
  Skeleton,
  Fade,
  Grow,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  NavigateNext,
  Restaurant,
  DeliveryDining,
  Star,
  LocalOffer,
  Schedule,
  TrendingUp,
  Code,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import store, { useAppDispatch, useAppSelector } from '../../../app/store';
import { 
  fetchRestaurants, 
  selectFeaturedRestaurants,
  selectAllRestaurants,
  selectRestaurantLoading,
  filterByCuisine,
} from '../../../features/restaurant/restaurantSlice';
import RestaurantCard from '../../../features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { Restaurants_Card, RestaurantsCard as RestaurantCard2 } from '@features/restaurant/components/RestaurantCard';
import { showToast } from '../../../features/ui/uiSlice';
// import { CUISINES } from '../../../core/constants/food';
//dev
import { useDevContext } from '../../../core/dev/contexts/DevContext';

// Import section components
import PromoSection from '@features/home/components/PromoSection';
import CuisinesSection from '@features/home/components/CuisinesSection';
import HowItWorksSection from '@features/home/components/HowItWorksSection';
import HowItWorksSection1 from '@/features/home/components/howItWorks/HowItWorks_V1';
import TestimonialsSection from '@features/home/components/TestimonialsSection';
import StatsSection from '@features/home/components/StatsSection';
import TopDishesSection from '@features/home/components/TopDishesSection';
import QuickDeliverySection from '@features/home/components/QuickDeliverySection';
import Hero from '@/features/home/components/hero/Hero_V';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const HomeV2: React.FC = () => {
  console.log('store states',store.getState())
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // const { availableVersions, selectedVersions } = useDevContext();
  
  const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const loading = useAppSelector(selectRestaurantLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

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

  // Quick stats data
  const stats = [
    { value: allRestaurants.length, label: 'Restaurants', icon: Restaurant, suffix: '+' },
    { value: '200', label: 'Dishes', icon: LocalOffer, suffix: '+' },
    { value: '10k', label: 'Customers', icon: TrendingUp, suffix: '+' },
    { value: '30', label: 'min Delivery', icon: Schedule, suffix: '' },
  ];

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Hero Section with Parallax Effect */}
      <Hero heroImageLoaded={heroImageLoaded} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} 
        stats={stats} />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>

        {/* Featured Restaurants - Existing Redux Integration */}
        <Box sx={{ my: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
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
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: 3,
                '&:hover': {
                  transform: 'translateX(5px)',
                  transition: 'transform 0.3s ease',
                }
              }}
            >
              View All Restaurants
            </Button>
          </Box>
          
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {featuredRestaurants.slice(0, 6).map((restaurant, index) => (
                <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    {/* <RestaurantCard restaurant={restaurant} /> */}
                    <RestaurantCard2 restaurant={restaurant}/>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}

          {!loading && featuredRestaurants.length === 0 && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
              No featured restaurants available at the moment. Check back soon!
            </Alert>
          )}
        </Box>

        {/* Top Dishes Section - Popular Items */}
        <Box sx={{ my: 8 }}>
          <TopDishesSection />
        </Box>
        {/* Section Indicator */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip 
            icon={<Code />}
            label="DEV MODE - Home_V Renderer Active" 
            color="warning" 
            variant="outlined"
            sx={{ mb: 2 }}
          />
          {/* <Typography 
            variant="h3" 
            fontWeight={800} 
            gutterBottom
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Experience the Future
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Dynamic component swapping, A/B testing ready, and blazing fast performance
          </Typography> */}
        </Box>

        <Divider sx={{ my: 4 }}>
          <Chip label="Explore" size="medium" />
        </Divider>

        {/* Stats Section - Credibility & Impact */}
        <Fade in timeout={1000}>
          <Box>
            <StatsSection />
          </Box>
        </Fade>

        {/* Promo Section - Call to Action with Offers */}
        <Zoom in timeout={800}>
          <Box sx={{ my: 6 }}>
            <PromoSection />
          </Box>
        </Zoom>

        {/* Quick Delivery Section - Express Service Hook */}
        <Grow in timeout={600}>
          <Box sx={{ my: 6 }}>
            <QuickDeliverySection />
          </Box>
        </Grow>

        {/* Cuisines Section - Browse by Category */}
        <Box sx={{ my: 8 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
            Browse by Cuisine
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Explore your favorite food categories
          </Typography>
          <CuisinesSection />
        </Box>

        {/* How It Works Section - User Education */}
        <Box sx={{ my: 8 }}>
          <HowItWorksSection />
          {/* <HowItWorksSection1/> */}
        </Box>

        {/* Testimonials Section - Social Proof */}
        <Box sx={{ my: 8 }}>
          <TestimonialsSection />
        </Box>

        {/* Final CTA Section */}
        <Box
          sx={{
            mt: 8,
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Ready to Order?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Join thousands of satisfied customers and get your favorite food delivered
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/restaurants')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 5,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 700,
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'scale(1.05)',
                transition: 'transform 0.3s ease',
              }
            }}
          >
            Browse Restaurants
            <NavigateNext sx={{ ml: 1 }} />
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomeV2;