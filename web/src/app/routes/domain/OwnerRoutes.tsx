import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../../features/auth/protectedRoute';
import OwnerLayout from '../../../shared/layout/OwnerLayout';
import OwnerDashboard from '../../../pages/_ownerPages/DashBoard';
import OwnerSettings from '../../../pages/_ownerPages/Settings';
import Queue from '../../../pages/_owner/Queue';
import Active from '../../../pages/_owner/Active';
import ComingSoon from '../../../shared/components/ComingSoon';
import { APP_CONFIG } from '../../../core/config/app.config';

// Bypasses the route protection if DEV_BYPASS_AUTH is active
const OwnerProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (APP_CONFIG.DEV_BYPASS_AUTH) return <>{children}</>;
  return <ProtectedRoute allowedRoles={['owner']}>{children}</ProtectedRoute>;
};

export const OwnerRoutes = (
  <Route 
    path="/owner/*" 
    element={
      <OwnerProtected>
        <OwnerLayout />
      </OwnerProtected>
    } 
  >
    <Route index element={<OwnerDashboard />} />
    <Route path='settings' element={<OwnerSettings />} />
    <Route path='queue' element={<Queue />} />
    <Route path='active' element={<Active />} />
    
    {/* Redirects and Coming Soon Routes */}
    <Route path='orders' element={<Navigate to="/owner/queue" replace />} />
    <Route path='orders/*' element={<Navigate to="/owner/queue" replace />} />
    <Route path='menu' element={<ComingSoon title="Menu Management" />} />
    <Route path='menu/*' element={<ComingSoon title="Menu Management" />} />
    <Route path='analytics' element={<ComingSoon title="Analytics" />} />
    <Route path='analytics/*' element={<ComingSoon title="Analytics" />} />
    <Route path='promotions' element={<ComingSoon title="Promotions" />} />
    <Route path='promotions/*' element={<ComingSoon title="Promotions" />} />
    <Route path='reviews' element={<ComingSoon title="Reviews" />} />
    <Route path='reviews/*' element={<ComingSoon title="Reviews" />} />
    <Route path='staff' element={<ComingSoon title="Staff" />} />
    <Route path='staff/*' element={<ComingSoon title="Staff" />} />
    <Route path='finance' element={<ComingSoon title="Finance" />} />
    <Route path='finance/*' element={<ComingSoon title="Finance" />} />
    <Route path='support' element={<ComingSoon title="Support" />} />
    <Route path='support/*' element={<ComingSoon title="Support" />} />
    <Route path='profile' element={<ComingSoon title="Restaurant Profile" />} />
    <Route path='profile/*' element={<ComingSoon title="Restaurant Profile" />} />
  </Route>
);
