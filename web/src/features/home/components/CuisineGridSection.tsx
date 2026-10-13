import React from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Stack,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SafeImage } from '@/shared/components/ui/SafeImage';
import type { CuisineSummary } from '@/features/restaurant/restaurantSlice';

interface CuisineGridSectionProps {
  cuisines?: CuisineSummary[];
  loading?: boolean;
  onCuisineClick?: (cuisineName: string) => void;
}

const CuisineGridSection: React.FC<CuisineGridSectionProps> = ({
  cuisines = [],
  loading = false,
  onCuisineClick,
}) => {
  const navigate = useNavigate();

  const handleCuisineSelect = (name: string) => {
    if (onCuisineClick) {
      onCuisineClick(name);
    } else {
      navigate(`/restaurants?cuisine=${encodeURIComponent(name)}`);
    }
  };

  const topCuisines = cuisines.slice(0, 6);

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
          <Typography
            variant="overline"
            sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1.2 }}
          >
            EXPLORE
          </Typography>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Browse by Cuisine
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover restaurants by your favorite culinary styles
          </Typography>
        </Box>

        <Button
          endIcon={<ArrowForward />}
          onClick={() => navigate('/restaurants')}
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
          View All Restaurants
        </Button>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Cuisine Cards Grid */}
          <Grid container spacing={3}>
            {topCuisines.map((cuisine, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cuisine.name} sx={{ display: 'flex' }}>
                <motion.div
                  style={{ height: '100%', width: '100%', display: 'flex' }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <Card
                    onClick={() => handleCuisineSelect(cuisine.name)}
                    sx={{
                      width: '100%',
                      position: 'relative',
                      height: 220,
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    {/* Cover Image using SafeImage */}
                    <SafeImage
                      src={cuisine.coverImage}
                      alt={cuisine.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />

                    {/* Dark gradient overlay for readable text */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        p: 2.5,
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ color: 'white', lineHeight: 1.2 }}
                        >
                          {cuisine.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}
                        >
                          {cuisine.count} {cuisine.count === 1 ? 'restaurant' : 'restaurants'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {topCuisines.length === 0 && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 3, mt: 2, borderRadius: 2 }}>
              No cuisines available right now.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default CuisineGridSection;
