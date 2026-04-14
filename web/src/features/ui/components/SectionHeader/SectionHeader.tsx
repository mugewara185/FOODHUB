import React from 'react';
import { Box, Typography, Button, type SxProps, type Theme } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  align?: 'left' | 'center' | 'right';
  sx?: SxProps<Theme>;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  align = 'left',
  sx,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2,
        textAlign: align,
        ...sx,
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Button
          endIcon={action.icon ?? <NavigateNext />}
          onClick={action.onClick}
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
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export default SectionHeader;
