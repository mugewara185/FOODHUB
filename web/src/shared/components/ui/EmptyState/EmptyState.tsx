import React from 'react';
import { Box, Typography, Button, type SxProps, type Theme } from '@mui/material';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined' | 'text';
  };
  sx?: SxProps<Theme>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  sx,
}) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        ...sx,
      }}
    >
      <Box sx={{ fontSize: 80, color: 'text.secondary', mb: 1, lineHeight: 1 }}>
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant={action.variant ?? 'contained'}
          onClick={action.onClick}
          sx={{ mt: 1 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
