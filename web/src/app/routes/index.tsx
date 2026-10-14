import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteLogger } from './RouteLogger';
import { useAuth } from '@contexts/AuthContext';
// Domain Routes
import { UserRoutes } from './domain/UserRoutes';
import { AdminRoutes } from './domain/AdminRoutes';
import { PartnerRoutes } from './domain/PartnerRoutes';
import { OwnerRoutes } from './domain/OwnerRoutes';
import { DevRoutes } from './domain/DevRoutes';
import type { User, UserRole } from '@/data/types/auth';

const AppRoutes: React.FC = () => {
  const { user } = useAuth() as { user: User | null };

  const roles = user?.role ?? [];
  const has = (r: UserRole) => roles.includes(r);
  const isDev = has('dev');

  return (
    <>
      <RouteLogger />
      <Routes>
        {/* Landing redirects — first match wins, priority ordered */}
        {has('admin') && <Route path="/" element={<Navigate to="/admin" replace />} />}
        {has('owner') && <Route path="/" element={<Navigate to="/owner" replace />} />}
        {has('partner') && <Route path="/" element={<Navigate to="/partner" replace />} />}

        {/* Always mount customer tree */}
        {UserRoutes}

        {/* Mount additional domain trees when permitted */}
        {(has('admin') || isDev) && AdminRoutes}
        {(has('owner') || isDev) && OwnerRoutes}
        {(has('partner') || isDev) && PartnerRoutes}
        {isDev && DevRoutes}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default AppRoutes;

//TODO:
// should add a fallBack/warning page in case of no paths found like errors 