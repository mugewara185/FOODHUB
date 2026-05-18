import React from 'react';
import {
  Box,
  Grid,
  Skeleton,
  type SxProps,
  type Theme,
} from '@mui/material';

export interface SkeletonGridProps {
  count?: number;
  cardHeight?: number;
  columns?: { xs: number; sm: number; md: number };
  sx?: SxProps<Theme>;
}

const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 6,
  cardHeight = 200,
  columns = { xs: 12, sm: 6, md: 4 },
  sx,
}) => {
  return (
    <Grid container spacing={3} sx={sx}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={columns.xs} sm={columns.sm} md={columns.md} key={i}>
          <Skeleton
            variant="rectangular"
            height={cardHeight}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton variant="text" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </Grid>
      ))}
    </Grid>
  );
};

export default SkeletonGrid;
