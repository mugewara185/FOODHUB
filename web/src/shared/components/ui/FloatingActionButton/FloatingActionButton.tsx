import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Badge,
  Button,
  type SxProps,
  type Theme,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

export interface FloatingActionButtonProps {
  count: number;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  count,
  label,
  onClick,
  icon,
  sx,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 70,
        right: 20,
        zIndex: 1000,
        display: { xs: 'block', lg: 'none' },
        ...sx,
      }}
    >
      <Badge badgeContent={count} color="error">
        <Button
          variant="contained"
          startIcon={icon}
          onClick={onClick}
          sx={{
            borderRadius: 10,
            px: 3,
            py: 1.5,
            boxShadow: 6,
          }}
        >
          {label}
        </Button>
      </Badge>
    </Box>
  );
};

export default FloatingActionButton;
