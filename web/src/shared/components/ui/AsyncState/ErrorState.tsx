import React from 'react';
import { Box, Typography, Button, type SxProps, type Theme, Paper, useTheme } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { getErrorMessage, type NormalizedApiError } from '@/core/utils/asyncState';

export interface ErrorStateProps {
  error: NormalizedApiError | string | null | undefined;
  onRetry?: () => void;
  title?: string;
  sx?: SxProps<Theme>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  sx,
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: 'center',
        p: 4,
        my: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'error.50',
        border: '1px solid',
        borderColor: 'error.main',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        ...sx,
      }}
    >
      <ErrorOutline sx={{ fontSize: 48, color: 'error.main' }} />
      <Typography variant="h6" color="error.main" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2" color="error.main" sx={{ opacity: 0.8, maxWidth: 500 }}>
        {getErrorMessage(error)}
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<Refresh />}
          onClick={onRetry}
          sx={{ mt: 1, borderRadius: 2 }}
        >
          Try Again
        </Button>
      )}
    </Paper>
  );
};
