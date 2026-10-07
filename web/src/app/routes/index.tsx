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
import type { User } from '@/data/types/auth';

const AppRoutes: React.FC = () => {
  const { user } = useAuth() as { user: User | null };
  return (
    <>
      <RouteLogger />
      <Routes>
        <Route
          path="/*"
          element={
            user?.role.includes('owner')
              ? <Navigate to="/owner" replace />
              : user?.role.includes('admin')
                ? <Navigate to="/admin" replace />
                : user?.role.includes('partner')
                  ? <Navigate to="/partner" replace />
                  // : user?.role.includes('dev')
                  //   ? <Navigate to="/dev" replace />
                  : <Navigate to="/" replace />
          }
        />
        {/* {user?.role.includes('user') && UserRoutes} */}
        {
          user ? (
            user?.role[0] === 'user' ? UserRoutes :
              user?.role[0] === 'admin' ? AdminRoutes :
                user?.role[0] === 'partner' ? PartnerRoutes :
                  user?.role[0] === 'owner' ? OwnerRoutes :
                    // user?.role.includes('dev') ? (console.log(' dev routes'), DevRoutes) : 
                    (console.error('No roles found in user'), UserRoutes)
          ) : (
            console.log('%cuser is not defined', 'color:red; font-weight:bold'),
            UserRoutes
          )
        }
        {/* {
          user ? (console.log('%crcba navigating to user routes', 'color:green; font-weight:bold'),
            user?.role.includes('user') ? (console.log(' user routes'), UserRoutes) :
              user?.role.includes('admin') ? (console.log(' admin routes '), AdminRoutes) :
                user?.role.includes('partner') ? (console.log(' partner routes'), PartnerRoutes) :
                  user?.role.includes('owner') ? (console.log(' owner routes'), OwnerRoutes) :
                    // user?.role.includes('dev') ? (console.log(' dev routes'), DevRoutes) : 
                    (console.error('No roles found in user'), UserRoutes)
          ) : (
            console.log('rcba navigating to login routes'),
            UserRoutes
          )
        } */}
      </Routes>
    </>
  );
};

export default AppRoutes;

//TODO:
// should add a fallBack/warning page in case of no paths found like errors 