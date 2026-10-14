import React from 'react';
import { Alert, Grid, Box } from '@mui/material';
import RestaurantCard from '@/features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { RestaurantCardSkeleton } from '@/features/restaurant/components/RestaurantCard';
import type { Restaurant } from '@/core/types';
import { SectionHeader } from './shared/SectionHeader';
import { Reveal } from './shared/Reveal';

interface FeaturedRestaurantsSectionProps {
  restaurants?: Restaurant[];
  loading?: boolean;
  onViewAll?: () => void;
}

export const FeaturedRestaurantsSection: React.FC<FeaturedRestaurantsSectionProps> = ({
  restaurants = [],
  loading = false,
  onViewAll,
}) => {
  return (
    <Box>
      <SectionHeader
        title="Featured Restaurants"
        subtitle="Restaurants highlighted on FoodHub"
        actionLabel="View All Restaurants"
        onActionClick={onViewAll}
      />

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {[1, 2, 3].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item} sx={{ display: 'flex' }}>
              <RestaurantCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Restaurant List */}
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {restaurants.slice(0, 6).map((restaurant, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={restaurant.id} sx={{ display: 'flex' }}>
                <Reveal delay={index * 0.08} style={{ width: '100%', display: 'flex' }}>
                  <RestaurantCard restaurant={restaurant} />
                </Reveal>
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {restaurants.length === 0 && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 3, mt: 3, borderRadius: 2 }}>
              No featured restaurants available at the moment. Check back soon!
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default FeaturedRestaurantsSection;