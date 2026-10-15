import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { RouteLogger } from './RouteLogger';
import { useAuth } from '../../contexts/AuthContext';
import { resolveUserRoles } from './resolvers/resolveUserRoles';
import { LandingRedirect } from './redirects/LandingRedirect';
import { NotFoundPage } from './errors/NotFoundPage';
import { UnauthorizedPage } from './errors/UnauthorizedPage';

// Domain Routes
import { UserRoutes } from './domain/UserRoutes';
import { AdminRoutes } from './domain/AdminRoutes';
import { OwnerRoutes } from './domain/OwnerRoutes';
import { PartnerRoutes } from './domain/PartnerRoutes';
import { DevRoutes } from './domain/DevRoutes';
import { ROUTE_PATHS } from './config/routePaths';
import { DOMAIN_REGISTRATION_ROLES } from './config/routePermissions';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const roles = resolveUserRoles(user);

  const canRegister = (domainRoles: readonly UserRole[]) =>
    domainRoles.some((role) => roles.includes(role));

  // Conditional domain registration rules:
  // Admin   → User has 'admin' or 'dev'
  // Owner   → User has 'owner' or 'dev'
  // Partner → User has 'partner' or 'dev'
  // Dev     → User has 'dev'
  const shouldRegisterAdmin = canRegister(DOMAIN_REGISTRATION_ROLES.admin);
  const shouldRegisterOwner = canRegister(DOMAIN_REGISTRATION_ROLES.owner);
  const shouldRegisterPartner = canRegister(DOMAIN_REGISTRATION_ROLES.partner);
  const shouldRegisterDev = canRegister(DOMAIN_REGISTRATION_ROLES.dev);

  return (
    <>
      <RouteLogger />
      <Routes>
        {/* Centralized Root Landing Decision (unambiguous, single redirect) */}
        <Route path={ROUTE_PATHS.ROOT} element={<LandingRedirect />} />

        {/* Customer tree: ALWAYS registered regardless of role */}
        {UserRoutes}

        {/* Conditionally registered domain route trees */}
        {shouldRegisterAdmin && AdminRoutes}
        {shouldRegisterOwner && OwnerRoutes}
        {shouldRegisterPartner && PartnerRoutes}
        {shouldRegisterDev && DevRoutes}

        {/* Dedicated Error and Fallback Handlers */}
        <Route path={ROUTE_PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTE_PATHS.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
