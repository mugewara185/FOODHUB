import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionHref?: string;
  sx?: object;
}

/**
 * SectionHeader
 * Provides consistent heading hierarchy (semantic h2), readable contrast,
 * and responsive action alignment for FoodHub sections (S07 A11y & Visual Hierarchy).
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionClick,
  actionHref,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        mb: { xs: 3, md: 4 },
        gap: { xs: 1.5, sm: 2 },
        ...sx,
      }}
    >
      <Box sx={{ maxWidth: { xs: '100%', sm: 600 } }}>
        <Typography
          component="h2"
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            letterSpacing: '-0.02em',
            color: 'text.primary',
            lineHeight: 1.25,
            mb: subtitle ? 0.75 : 0,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {actionLabel && (
        <Button
          onClick={onActionClick}
          href={actionHref}
          endIcon={<NavigateNext />}
          sx={{
            minHeight: 44, // WCAG 2.1 touch target compliance
            px: 2,
            py: 1,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '0.95rem' },
            textTransform: 'none',
            whiteSpace: 'nowrap',
            alignSelf: { xs: 'flex-start', sm: 'center' },
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'translateX(3px)',
              transition: 'all 0.2s ease',
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default SectionHeader;
