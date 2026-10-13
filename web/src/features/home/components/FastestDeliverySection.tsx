import React from 'react';
import { Box, Button, Grid, Typography, Alert } from '@mui/material';
import { NavigateNext, Bolt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RestaurantCard from '@/features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { RestaurantCardSkeleton } from '@/features/restaurant/components/RestaurantCard';
import type { Restaurant } from '@/core/types';

interface FastestDeliverySectionProps {
  restaurants?: Restaurant[];
  loading?: boolean;
}

const FastestDeliverySection: React.FC<FastestDeliverySectionProps> = ({
  restaurants = [],
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ my: 8 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Bolt sx={{ color: 'warning.main', fontSize: 20 }} />
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'warning.dark', letterSpacing: 1.2 }}
            >
              FAST & FRESH
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Fastest Delivery
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Top restaurants delivering to your doorstep in express time
          </Typography>
        </Box>

        <Button
          endIcon={<NavigateNext />}
          onClick={() => navigate('/restaurants?sort=deliveryTime')}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 3,
            fontWeight: 600,
            '&:hover': {
              transform: 'translateX(5px)',
              transition: 'transform 0.3s ease',
            },
          }}
        >
          View All Fast Delivery
        </Button>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item} sx={{ display: 'flex' }}>
              <RestaurantCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Restaurant Grid */}
          <Grid container spacing={3}>
            {restaurants.slice(0, 3).map((restaurant, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={restaurant.id} sx={{ display: 'flex' }}>
                <motion.div
                  style={{ height: '100%', width: '100%', display: 'flex' }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <RestaurantCard restaurant={restaurant} />
                </motion.div>
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
