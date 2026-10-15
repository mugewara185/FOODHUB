import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { appConfig } from '../../../core/config/app.config';
import { ROUTE_PATHS } from '../config/routePaths';

interface AuthenticationGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export const AuthenticationGuard: React.FC<AuthenticationGuardProps> = ({
  children,
  redirectTo = ROUTE_PATHS.LOGIN,
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  // Wait for authentication initialization before any routing decision
  if (!isInitialized || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Allow developer bypass if configured
  if (appConfig.dev.bypassAuth) {
    return <>{children ? children : <Outlet />}</>;
  }

  // If unauthenticated, redirect to login preserving intended target
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children ? children : <Outlet />}</>;
};

export default AuthenticationGuard;
