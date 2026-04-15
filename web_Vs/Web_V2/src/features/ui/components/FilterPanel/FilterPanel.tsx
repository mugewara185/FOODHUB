import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Drawer,
  IconButton,
  type SxProps,
  type Theme,
} from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';
import DebugWrapper from '../DebugWrapper';

export interface FilterPanelProps {
  children: React.ReactNode;
  activeFilterCount?: number;
  onClearAll?: () => void;
  /** Desktop sidebar mode */
  variant?: 'sidebar' | 'drawer';
  open?: boolean;
  onClose?: () => void;
  sx?: SxProps<Theme>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  children,
  activeFilterCount = 0,
  onClearAll,
  variant = 'sidebar',
  open = false,
  onClose,
  sx,
}) => {
  const header = (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: variant === 'sidebar' ? 0 : 2,
          pt: variant === 'sidebar' ? 0 : 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          <Typography variant="h6" fontWeight={700}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {activeFilterCount > 0 && onClearAll && (
            <Button onClick={onClearAll} size="small">
              Clear All
            </Button>
          )}
          {variant === 'drawer' && onClose && (
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          )}
        </Box>
      </Box>
      <Divider sx={{ m: 1 }} />
    </Box>
  );

  if (variant === 'drawer') {
    return (
      <DebugWrapper componentName="FilterPanelDrawer">
        <Drawer
          anchor="left"
          open={open}
          onClose={onClose}
          PaperProps={{ sx: { width: '90%', maxWidth: 360 } }}
        >
          {header}
          <Box sx={{ p: 2, ...sx }}>{children}</Box>
        </Drawer>
      </DebugWrapper>
    );
  }

  return (
    <DebugWrapper componentName="FilterPanel">
      <Box sx={{ width: '100%', ...sx }}>
        {header}
      <Box
        sx={{
          width: '100%',
          maxHeight: '60vh',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
    </DebugWrapper>
  );
};

export default FilterPanel;
