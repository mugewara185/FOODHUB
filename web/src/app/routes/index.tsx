import React from 'react';
import { Routes } from 'react-router-dom';
import { RouteLogger } from './RouteLogger';

// Domain Routes
import { UserRoutes } from './domain/UserRoutes';
import { AdminRoutes } from './domain/AdminRoutes';
import { PartnerRoutes } from './domain/PartnerRoutes';
import { OwnerRoutes } from './domain/OwnerRoutes';
import { DevRoutes } from './domain/DevRoutes';

const AppRoutes: React.FC = () => {
  return (
    <>
      <RouteLogger />
      <Routes>
        {UserRoutes}
        {AdminRoutes}
        {PartnerRoutes}
        {OwnerRoutes}
        {DevRoutes}
      </Routes>
    </>
  );
};

export default AppRoutes;