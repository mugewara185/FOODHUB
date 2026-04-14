import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  type SxProps,
  type Theme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import DebugWrapper from '../DebugWrapper';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
  center?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  actions,
  sx,
  center,
}) => {
  return (
    <DebugWrapper componentName="PageHeader">
      <Box sx={{ mb: 4, textAlign: center ? 'center' : 'inherit', ...sx }}>
      {onBack && (
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ mb: 2 }}
        >
          {backLabel}
        </Button>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
      </Box>
    </DebugWrapper>
  );
};

export default PageHeader;
