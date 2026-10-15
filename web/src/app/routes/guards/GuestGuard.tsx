import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ROUTE_PATHS } from '../config/routePaths';

interface GuestGuardProps {
  children?: React.ReactNode;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (isInitialized && isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.ROOT} replace />;
  }

  return <>{children ? children : <Outlet />}</>;
};

export default GuestGuard;
