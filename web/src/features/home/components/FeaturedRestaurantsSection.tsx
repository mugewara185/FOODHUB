import { Alert, Box, Button, Grid, Skeleton, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { motion } from 'framer-motion';

import RestaurantCard from '@/features/restaurant/components/RestaurantCard/RestaurantCard_V';
import type { Restaurant } from '@/core/types';

interface FeaturedRestaurantsSectionProps {
  restaurants?: Restaurant[];
  loading?: boolean;
  onViewAll?: () => void;
  // onRestaurantClick?: (restaurantId: string) => void;
}
const FeaturedRestaurantsSection_V = ({
  restaurants=[],
  loading = false,
  onViewAll,
}: FeaturedRestaurantsSectionProps) => {
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
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Featured Restaurants
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Discover top-rated restaurants near you
          </Typography>
        </Box>

        <Button
          endIcon={<NavigateNext />}
          onClick={onViewAll}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 3,

            '&:hover': {
              transform: 'translateX(5px)',
              transition: 'transform 0.3s ease',
            },
          }}
        >
          View All Restaurants
        </Button>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton
                variant="rectangular"
                height={300}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Restaurant List */}
          <Grid container spacing={3}>
            {restaurants.slice(0, 6).map((restaurant, index) => (
              <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.2 },
                  }}
                >
                  <RestaurantCard restaurant={restaurant} />
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {restaurants?.length === 0 && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 4, mt: 4 }}>
              No featured restaurants available at the moment.
              Check back soon!
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default FeaturedRestaurantsSection_V;