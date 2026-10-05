import React from 'react';
import { Box, LinearProgress } from '@mui/material';
import { ErrorState } from './ErrorState';
import type { AsyncStatus, NormalizedApiError } from '@/core/utils/asyncState';

export interface AsyncBoundaryProps {
  status: AsyncStatus;
  error?: NormalizedApiError | string | null;
  hasData: boolean;
  onRetry?: () => void;
  loadingComponent: React.ReactNode;
  emptyComponent: React.ReactNode;
  children: React.ReactNode;
  
  /**
   * If true, background refreshes will show a top LinearProgress indicator.
   * Default: true
   */
  showBackgroundLoading?: boolean;
}

/**
 * Reusable component to handle common async loading, error, empty, and data states.
 * - Initial Loading: Shows `loadingComponent` (e.g. Skeletons)
 * - Initial Error: Shows `ErrorState` with retry option
 * - Empty: Shows `emptyComponent` when success but no data
 * - Success/Refetching: Renders `children`. Uses `showBackgroundLoading` to show a progress bar if refetching.
 */
export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  status,
  error,
  hasData,
  onRetry,
  loadingComponent,
  emptyComponent,
  children,
  showBackgroundLoading = true,
}) => {
  const isInitialLoading = status === 'loading' && !hasData;
  const isInitialError = status === 'error' && !hasData;
  const isEmpty = status === 'success' && !hasData;
  const isBackgroundLoading = status === 'loading' && hasData;

  if (isInitialLoading) {
    return <>{loadingComponent}</>;
  }

  if (isInitialError) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <>{emptyComponent}</>;
  }

  return (
    <Box position="relative">
      {isBackgroundLoading && showBackgroundLoading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1,
            borderRadius: '4px 4px 0 0'
          }} 
        />
      )}
      {children}
    </Box>
  );
};
