import React from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from '@/features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { RestaurantCardSkeleton } from '@/features/restaurant/components/RestaurantCard';
import type { Restaurant } from '@/core/types';
import { SectionHeader } from './shared/SectionHeader';
import { Reveal } from './shared/Reveal';

interface FastestDeliverySectionProps {
  restaurants?: Restaurant[];
  loading?: boolean;
}

export const FastestDeliverySection: React.FC<FastestDeliverySectionProps> = ({
  restaurants = [],
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <Box>
      <SectionHeader
        title="Fastest Delivery"
        subtitle="Top kitchens with the lowest estimated delivery times"
        actionLabel="View Fast Delivery"
        onActionClick={() => navigate('/restaurants?sort=deliveryTime')}
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
          {/* Restaurant Grid */}
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {restaurants.slice(0, 3).map((restaurant, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={restaurant.id} sx={{ display: 'flex' }}>
                <Reveal delay={index * 0.08} style={{ width: '100%', display: 'flex' }}>
                  <RestaurantCard restaurant={restaurant} />
                </Reveal>
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {restaurants.length === 0 && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 3, mt: 2, borderRadius: 2 }}>
              No fast delivery restaurants available at the moment.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default FastestDeliverySection;
