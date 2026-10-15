import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import OwnerLayout from '../../../shared/layout/OwnerLayout';
import OwnerDashboard from '../../../pages/_ownerPages/DashBoard';
import OwnerSettings from '../../../pages/_ownerPages/Settings';
import Queue from '../../../pages/_owner/Queue';
import Active from '../../../pages/_owner/Active';
import ComingSoon from '../../../shared/components/ComingSoon';
import AuthenticationGuard from '../guards/AuthenticationGuard';
import RoleGuard from '../guards/RoleGuard';

const OwnerProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthenticationGuard>
      <RoleGuard allowedRoles={['owner', 'dev']}>
        {children}
      </RoleGuard>
    </AuthenticationGuard>
  );
};

export const OwnerRoutes = (
  <Route
    path="/owner"
    element={
      <OwnerProtected>
        <OwnerLayout />
      </OwnerProtected>
    }
  >
    <Route index element={<OwnerDashboard />} />
    <Route path="settings" element={<OwnerSettings />} />
    <Route path="queue" element={<Queue />} />
    <Route path="active" element={<Active />} />

    {/* Redirects and Coming Soon Routes */}
    <Route path="orders" element={<Navigate to="/owner/queue" replace />} />
    <Route path="menu" element={<ComingSoon title="Menu Management" />} />
    <Route path="analytics" element={<ComingSoon title="Analytics" />} />
    <Route path="promotions" element={<ComingSoon title="Promotions" />} />
    <Route path="reviews" element={<ComingSoon title="Reviews" />} />
    <Route path="staff" element={<ComingSoon title="Staff" />} />
    <Route path="finance" element={<ComingSoon title="Finance" />} />
    <Route path="support" element={<ComingSoon title="Support" />} />
    <Route path="profile" element={<ComingSoon title="Restaurant Profile" />} />
  </Route>
);

export default OwnerRoutes;
