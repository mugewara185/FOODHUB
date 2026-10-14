import React from 'react';
import { Card, CardContent, Box, Skeleton, Stack } from '@mui/material';

export const RestaurantCardSkeleton: React.FC = () => {
  return (
    <Card
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* 16:9 Media Skeleton */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          bgcolor: 'action.hover',
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </Box>

      {/* Content Skeleton */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        {/* Title and Rating row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            minHeight: 28,
          }}
        >
          <Skeleton variant="text" width="60%" height={26} />
          <Skeleton variant="rectangular" width={44} height={22} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Cuisine Chips row */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            mb: 1.25,
            minHeight: 24,
            alignItems: 'center',
          }}
        >
          <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" width={50} height={22} sx={{ borderRadius: 3 }} />
        </Stack>

        {/* Metadata lines */}
        <Stack spacing={0.5} sx={{ mb: 1 }}>
          <Skeleton variant="text" width="75%" height={18} />
          <Skeleton variant="text" width="45%" height={18} />
          <Skeleton variant="text" width="55%" height={18} />
        </Stack>

        {/* Bottom tags slot */}
        <Box sx={{ mt: 'auto', pt: 0.5, minHeight: 24, display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="rectangular" width={64} height={20} sx={{ borderRadius: 3 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default RestaurantCardSkeleton;
