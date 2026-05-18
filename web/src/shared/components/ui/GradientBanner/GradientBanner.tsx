import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  type SxProps,
  type Theme,
} from '@mui/material';

export interface GradientBannerProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  gradient?: string;
  /** Content rendered on the right side of the banner */
  rightContent?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const GradientBanner: React.FC<GradientBannerProps> = ({
  title,
  subtitle,
  action,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  rightContent,
  sx,
}) => {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 6 },
        borderRadius: 4,
        background: gradient,
        color: 'white',
        textAlign: rightContent ? 'left' : 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: rightContent ? 'space-between' : 'center',
        flexWrap: 'wrap',
        gap: 4,
        ...sx,
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="h6" sx={{ mb: action ? 4 : 0, opacity: 0.95 }}>
            {subtitle}
          </Typography>
        )}
        {action && (
          <Button
            variant="contained"
            size="large"
            onClick={action.onClick}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 5,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 700,
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'scale(1.05)',
                transition: 'transform 0.3s ease',
              },
            }}
          >
            {action.label}
          </Button>
        )}
      </Box>
      {rightContent && <Box>{rightContent}</Box>}
    </Box>
  );
};

export default GradientBanner;
