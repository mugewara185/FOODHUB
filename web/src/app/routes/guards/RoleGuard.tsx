import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { appConfig } from '../../../core/config/app.config';
import type { UserRole } from '../../../core/types/auth';
import { resolveUserRoles } from '../resolvers/resolveUserRoles';
import { ROUTE_PATHS } from '../config/routePaths';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Developer bypass or dev role can access all permitted route trees
  if (appConfig.dev.bypassAuth) {
    return <>{children ? children : <Outlet />}</>;
  }

  const userRoles = resolveUserRoles(user);

  // 'dev' role has access to all permitted domain trees
  if (userRoles.includes('dev')) {
    return <>{children ? children : <Outlet />}</>;
  }

  // Check if user has at least one of the allowed roles
  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to={ROUTE_PATHS.UNAUTHORIZED} state={{ from: location }} replace />;
  }

  return <>{children ? children : <Outlet />}</>;
};

export default RoleGuard;
