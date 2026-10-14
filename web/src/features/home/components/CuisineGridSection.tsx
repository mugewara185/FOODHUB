import React from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SafeImage } from '@/shared/components/ui/SafeImage';
import type { CuisineSummary } from '@/features/restaurant/restaurantSlice';
import { SectionHeader } from './shared/SectionHeader';
import { Reveal } from './shared/Reveal';

interface CuisineGridSectionProps {
  cuisines?: CuisineSummary[];
  loading?: boolean;
  onCuisineClick?: (cuisineName: string) => void;
}

export const CuisineGridSection: React.FC<CuisineGridSectionProps> = ({
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
    <Box>
      <SectionHeader
        title="Browse by Cuisine"
        subtitle="Discover restaurants by your favorite culinary styles"
        actionLabel="View All Restaurants"
        onActionClick={() => navigate('/restaurants')}
      />

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}>
              <Skeleton
                variant="rectangular"
                height={160}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Cuisine Cards Grid - 2 cols on mobile, 3 on tablet, 6 on desktop */}
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {topCuisines.map((cuisine, index) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cuisine.name} sx={{ display: 'flex' }}>
                <Reveal delay={index * 0.05} style={{ width: '100%', display: 'flex' }}>
                  <Card
                    onClick={() => handleCuisineSelect(cuisine.name)}
                    sx={{
                      width: '100%',
                      position: 'relative',
                      height: { xs: 140, sm: 160, md: 180 },
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        transform: 'translateY(-3px)',
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
                      }}
                    />

                    {/* Dark gradient overlay for high text contrast (WCAG >= 4.5:1) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        p: { xs: 1.5, sm: 2 },
                      }}
                    >
                      <Stack spacing={0.25}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                          sx={{
                            color: 'white',
                            lineHeight: 1.2,
                            fontSize: { xs: '0.9rem', sm: '1.05rem' },
                            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                          }}
                        >
                          {cuisine.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.85)',
                            fontWeight: 500,
                            fontSize: { xs: '0.68rem', sm: '0.75rem' },
                          }}
                        >
                          {cuisine.count} {cuisine.count === 1 ? 'place' : 'places'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Card>
                </Reveal>
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
