import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Alert,
} from '@mui/material';
import {
    NavigateNext,
    Restaurant,
    LocalOffer,
    AccessTime,
    Refresh,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
    fetchRestaurants,
    fetchMenuHighlights,
    selectFeaturedRestaurants,
    selectAllRestaurants,
    selectRestaurantLoading,
    selectRestaurantError,
    selectCuisineSummary,
    selectFastestRestaurants,
    selectMenuHighlights,
    filterByCuisine,
} from '../../../features/restaurant/restaurantSlice';
import { showToast } from '../../../features/ui/uiSlice';
import { useHideGlobalSearch } from '@/features/ui/hooks/useHideGlobalSearch';

// Truthful section components
import HeroCompact from '@/features/home/components/hero/HeroCompact';
import FeaturedRestaurantsSection from '@/features/home/components/FeaturedRestaurantsSection';
import FastestDeliverySection from '@/features/home/components/FastestDeliverySection';
import CuisineGridSection from '@/features/home/components/CuisineGridSection';
import MenuHighlightsSection from '@/features/home/components/MenuHighlightsSection';
import HowItWorksSection from '@/features/home/components/HowItWorksSection';

const HomeV2: React.FC = () => {
    useHideGlobalSearch();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
    const allRestaurants = useAppSelector(selectAllRestaurants);
    const loading = useAppSelector(selectRestaurantLoading);
    const error = useAppSelector(selectRestaurantError);
    const cuisineSummary = useAppSelector(selectCuisineSummary);
    const fastestRestaurants = useAppSelector(selectFastestRestaurants);
    const menuHighlightsState = useAppSelector(selectMenuHighlights);

    const [searchQuery, setSearchQuery] = useState('');
    const [heroImageLoaded] = useState(true);

    useEffect(() => {
        dispatch(fetchRestaurants())
            .unwrap()
            .then(() => {
                dispatch(fetchMenuHighlights());
            })
            .catch((err) => {
                dispatch(showToast({
                    message: String(err) || 'Failed to load restaurants',
                    type: 'error'
                }));
            });
    }, [dispatch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleCuisineClick = (cuisine: string) => {
        dispatch(filterByCuisine(cuisine));
        navigate(`/restaurants?cuisine=${encodeURIComponent(cuisine)}`);
    };

    const handleViewAll = (type: string) => {
        if (type === 'featured') {
            navigate('/restaurants?featured=1');
        } else {
            navigate(`/restaurants?filter=${type}`);
        }
    };

    // Truthful stats derived from genuine store data
    const fastestMinutes = fastestRestaurants[0]
        ? parseInt(String(fastestRestaurants[0].deliveryTime), 10) || 25
        : 25;

    const stats = [
        { value: allRestaurants.length, label: 'Restaurants', icon: Restaurant },
        { value: cuisineSummary.length, label: 'Cuisines', icon: LocalOffer },
        { value: fastestMinutes, label: 'Fastest Delivery', icon: AccessTime, suffix: 'm' },
    ];

    return (
        <Box sx={{ overflowX: 'hidden' }}>
            {/* Hero Section with truthful stats & search */}
            <HeroCompact
                heroImageLoaded={heroImageLoaded}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                stats={stats}
                loading={loading}
            />

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
                {/* Global Restaurant Fetch Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 4, borderRadius: 2 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<Refresh />}
                                onClick={() => {
                                    dispatch(fetchRestaurants())
                                        .unwrap()
                                        .then(() => dispatch(fetchMenuHighlights()));
                                }}
                            >
                                Retry
                            </Button>
                        }
                    >
                        Unable to load restaurants. Please check your connection and try again.
                    </Alert>
                )}

                {/* 1. Featured Restaurants */}
                <FeaturedRestaurantsSection
                    restaurants={featuredRestaurants}
                    loading={loading}
                    onViewAll={() => handleViewAll('featured')}
                />

                {/* 2. Menu Highlights (Real Items with Add-to-Cart) */}
                <MenuHighlightsSection
                    highlights={menuHighlightsState.items}
                    loading={menuHighlightsState.status === 'loading'}
                    error={menuHighlightsState.error ? 'Could not load menu highlights' : null}
                    onRetry={() => dispatch(fetchMenuHighlights())}
                />

                {/* 3. Fastest Delivery (Real Restaurants by Delivery Time) */}
                <FastestDeliverySection
                    restaurants={fastestRestaurants}
                    loading={loading}
                />

                {/* 4. Browse by Cuisine (Real Distinct Cuisines) */}
                <CuisineGridSection
                    cuisines={cuisineSummary}
                    loading={loading}
                    onCuisineClick={handleCuisineClick}
                />

                {/* 5. How It Works (Truthful Consumer Flow) */}
                <HowItWorksSection />

                {/* 6. Truthful Final Call to Action */}
                <Box
                    sx={{
                        mt: 8,
                        p: { xs: 4, md: 6 },
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                        color: 'white',
                        textAlign: 'center',
                        boxShadow: '0 12px 32px rgba(255, 107, 107, 0.25)',
                    }}
                >
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Ready to Order?
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 4, opacity: 0.95, maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
                        Discover top-rated local kitchens and enjoy fresh meals delivered right to your doorstep.
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
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            borderRadius: 3,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                            '&:hover': {
                                bgcolor: 'grey.100',
                                transform: 'scale(1.03)',
                                transition: 'transform 0.2s ease',
                            }
                        }}
                    >
                        Browse All Restaurants
                        <NavigateNext sx={{ ml: 0.5 }} />
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default HomeV2;