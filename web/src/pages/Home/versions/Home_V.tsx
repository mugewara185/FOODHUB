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
import { CUISINES } from '../../../core/constants/food';
//dev
import { useDevContext } from '../../../core/dev/contexts/DevContext';
import { FloatingDevConsole } from '../../../features/ui/components/FloatingDevConsole';

// Import section components
import PromoSection from '@features/home/components/PromoSection';
import CuisinesSection from '@features/home/components/CuisinesSection';
import HowItWorksSection from '@features/home/components/HowItWorksSection';
import TestimonialsSection from '@features/home/components/TestimonialsSection';
import StatsSection from '@features/home/components/StatsSection';
import TopDishesSection from '@features/home/components/TopDishesSection';
import QuickDeliverySection from '@features/home/components/QuickDeliverySection';

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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { availableVersions, selectedVersions } = useDevContext();
  
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
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 4, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&auto=format)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp}>
                  <Chip 
                    label="⚡ Development Mode - V2 Renderer" 
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ 
                      mb: 3, 
                      color: 'white', 
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      fontWeight: 800,
                      mb: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    Craving something{' '}
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      delicious?
                    </Box>
                  </Typography>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 4, 
                      opacity: 0.95,
                      fontSize: { xs: '1.2rem', md: '1.5rem' }
                    }}
                  >
                    Order food from the best restaurants near you
                  </Typography>
                </motion.div>
                
                <motion.div variants={fadeInUp}>
                  {/* Search Bar */}
                  <Paper
                    component="form"
                    onSubmit={handleSearch}
                    sx={{
                      p: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 5,
                      bgcolor: 'white',
                      maxWidth: 600,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    }}
                  >
                    <InputBase
                      sx={{ ml: 2, flex: 1, fontSize: '1.1rem' }}
                      placeholder="Search for restaurants or dishes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <IconButton 
                      type="submit" 
                      sx={{ 
                        p: '12px', 
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 4,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }} 
                    >
                      <Search />
                    </IconButton>
                  </Paper>
                </motion.div>

                {/* Quick Stats */}
                <motion.div variants={fadeInUp}>
                  <Stack 
                    direction="row" 
                    spacing={{ xs: 2, md: 4 }} 
                    sx={{ mt: 5, flexWrap: 'wrap', gap: 2 }}
                  >
                    {stats.map((stat, index) => (
                      <Box key={index} sx={{ textAlign: 'center' }}>
                        <Stack direction="row" spacing={1} alignItems="baseline">
                          <stat.icon sx={{ fontSize: 28, opacity: 0.9 }} />
                          <Typography variant="h3" fontWeight={700}>
                            {stat.value}
                            {stat.suffix}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </motion.div>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 100 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, type: 'spring' }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop"
                  alt="Food Delivery"
                  onLoad={() => setHeroImageLoaded(true)}
                  sx={{
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    transform: 'perspective(1000px) rotateY(-5deg)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'perspective(1000px) rotateY(0deg)',
                    },
                  }}
                />
                {!heroImageLoaded && (
                  <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 4 }} />
                )}
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Section Indicator */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip 
            icon={<Code />}
            label="DEV MODE - Live Component Swapping" 
            color="warning" 
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography 
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
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }}>
          <Chip label="What makes us different" size="medium" />
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
                    <RestaurantCard restaurant={restaurant} />
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

        {/* How It Works Section - User Education */}
        <Box sx={{ my: 8 }}>
          <HowItWorksSection />
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