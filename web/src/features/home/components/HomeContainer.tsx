import React from 'react';
import Hero from './hero/Hero';
import PromoSection from './PromoSection';
import CuisinesSection from './CuisinesSection';
import HowItWorksSection from './HowItWorksSection';
import TestimonialsSection from './TestimonialsSection';
import StatsSection from './StatsSection';
import TopDishesSection from './TopDishesSection';
import QuickDeliverySection from './QuickDeliverySection';
import FeaturedRestaurantsSection from './FeaturedRestaurantsSection';
import DownloadAppSection from './DownloadAppSection';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '@app/store/V/Store_V';

export const HomeContainer: React.FC = () => {
  const restaurants = useSelector((state: RootState) => state.restaurants.restaurants);
  
  return (
    <Box>
      <Hero />
      <PromoSection />
      <CuisinesSection />
      <HowItWorksSection />
      <StatsSection />
      <TopDishesSection />
      <QuickDeliverySection />
      <FeaturedRestaurantsSection restaurants={restaurants} />
      <TestimonialsSection />
      <DownloadAppSection />
    </Box>
  );
};
