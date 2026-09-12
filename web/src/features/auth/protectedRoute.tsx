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
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  // Block route resolution until we actually know if the user is logged in
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

  // Developer mode bypass (or Dev God User bypass)
  if (APP_CONFIG.DEV_BYPASS_AUTH || (user && user.roles?.includes('dev'))) {
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    import('../../core/dev/logger/Logger').then(({ logger }) => {
      logger.warn('ROUTER', 'ProtectedRoute observing unauthenticated state, redirecting to login', {
        event: 'AUTH_REDIRECT',
        route: location.pathname,
        source: 'ProtectedRoute'
      });
    });
    // Redirect to login page, but save the current location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect to home if trying to access auth pages while logged in
    return <Navigate to="/" replace />;
  }

  // RBAC checks
  if (requireAuth && isAuthenticated && allowedRoles && user && user.roles) {
    const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role as UserRole));
    if (!hasRequiredRole) {
      // Bounce user back to their respective native dashboard if they aren't authorized here
      // Priority: user homepage -> admin -> owner -> partner
      if (user.roles.includes('user')) {
        return <Navigate to="/" replace />;
      }
      if (user.roles.includes('admin')) {
        return <Navigate to="/admin" replace />;
      }
      if (user.roles.includes('restaurant_owner')) {
        return <Navigate to="/owner" replace />;
      }
      if (user.roles.includes('delivery_partner')) {
        return <Navigate to="/partner" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;