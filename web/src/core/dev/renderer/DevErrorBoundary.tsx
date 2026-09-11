import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Warning as WarningIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallbackVersionName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DevErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    import('../logger/logUtils').then(({ logError }) => {
      logError('REACT_ERROR', error, {
        componentStack: errorInfo.componentStack,
        fallbackVersionName: this.props.fallbackVersionName,
      }, 'ErrorBoundary');
    });
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Paper
          elevation={3}
          sx={{
            m: 3,
            p: 4,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'error.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h5" fontWeight="bold">
              Component Crash Detected
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The component version <strong>{this.props.fallbackVersionName || 'selected'}</strong> threw an error.
          </Typography>

          <Box sx={{ bgcolor: 'rgba(0,0,0,0.1)', p: 2, borderRadius: 1, mb: 3, overflow: 'auto', maxHeight: 300 }}>
            <Typography variant="body2" component="pre" sx={{ m: 0, fontWeight: 'bold' }}>
              {this.state.error && this.state.error.toString()}
            </Typography>
            {this.state.errorInfo && (
              <Typography variant="caption" component="pre" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo.componentStack}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
            sx={{ color: 'error.main', bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Reset to Default Version
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}
