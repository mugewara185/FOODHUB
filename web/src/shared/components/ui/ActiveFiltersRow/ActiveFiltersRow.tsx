import React from 'react';
import { Box, Chip, type SxProps, type Theme } from '@mui/material';

export interface ActiveFilterChip {
  key: string;
  label: string;
  onDelete: () => void;
}

export interface ActiveFiltersRowProps {
  filters: ActiveFilterChip[];
  sx?: SxProps<Theme>;
}

const ActiveFiltersRow: React.FC<ActiveFiltersRowProps> = ({ filters, sx }) => {
  if (filters.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        mb: 3,
        mt: 1,
        ...sx,
      }}
    >
      {filters.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.label}
          onDelete={filter.onDelete}
          size="small"
        />
      ))}
    </Box>
  );
};

export default ActiveFiltersRow;
