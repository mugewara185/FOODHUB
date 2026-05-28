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
import FeaturedRestaurantsSection from '@/features/home/components/FeaturedRestaurantsSection';


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
      {/*Vref: Hero Section with Parallax Effect */}
      {/* <Hero heroImageLoaded={heroImageLoaded} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} stats={stats} /> */}

      {/*Vref: Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/*Vref: Featured Restaurants */}
        <FeaturedRestaurantsSection restaurants={featuredRestaurants} loading={loading} onViewAll={() => handleViewAll('featured')}  />

        {/*Vref: Top Dishes Section - Popular Items */}
        <Box sx={{ my: 8 }}>
          <TopDishesSection />
        </Box>
        {/*Vref: Section Indicator */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip 
            icon={<Code />}
            label="DEV MODE - Home_V Renderer Active" 
            color="warning" 
            variant="outlined"
            sx={{ mb: 2 }}
          />
          {/*: <Typography 
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

        {/*Vref: Stats Section - Credibility & Impact */}
        <Fade in timeout={1000}>
          <Box>
            <StatsSection />
          </Box>
        </Fade>

        {/*Vref: Promo Section - Call to Action with Offers */}
        <Zoom in timeout={800}>
          <Box sx={{ my: 6 }}>
            <PromoSection />
          </Box>
        </Zoom>

        {/*Vref: Quick Delivery Section - Express Service Hook */}
        <Grow in timeout={600}>
          <Box sx={{ my: 6 }}>
            <QuickDeliverySection />
          </Box>
        </Grow>

        {/*Vref: Cuisines Section - Browse by Category */}
        <Box sx={{ my: 8 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
            Browse by Cuisine
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Explore your favorite food categories
          </Typography>
          <CuisinesSection />
        </Box>

        {/*Vref: How It Works Section - User Education */}
        <Box sx={{ my: 8 }}>
          <HowItWorksSection />
          {/*Vref: <HowItWorksSection1/> */}
        </Box>

        {/*Vref: Testimonials Section - Social Proof */}
        <Box sx={{ my: 8 }}>
          <TestimonialsSection />
        </Box>

        {/*Vref: Final CTA Section */}
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