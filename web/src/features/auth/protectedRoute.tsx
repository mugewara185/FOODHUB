import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../core/config/app.config';
import type { UserRole } from '../../data/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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

  // Developer mode bypass (or Dev God User bypass)
  if (APP_CONFIG.DEV_BYPASS_AUTH || (user && user.email === 'dev@')) {
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    // Redirect to login page, but save the current location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect to home if trying to access auth pages while logged in
    return <Navigate to="/" replace />;
  }

  // RBAC checks
  if (requireAuth && isAuthenticated && allowedRoles && user && user.role) {
    if (!allowedRoles.includes(user.role as UserRole)) {
      // Bounce user back to their respective native dashboard if they aren't authorized here
      switch (user.role) {
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'restaurant_owner':
          return <Navigate to="/owner" replace />;
        case 'delivery_partner':
          return <Navigate to="/partner" replace />;
        case 'user':
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect to home if trying to access auth pages while logged in
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;