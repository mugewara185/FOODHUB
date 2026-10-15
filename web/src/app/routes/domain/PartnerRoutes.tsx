import React from 'react';
import { Route } from 'react-router-dom';
import PartnerLayout from '../../../shared/layout/PartnerLayout';
import PartnerDashboard from '../../../pages/_deliveryPartner/PartnerDashboard';
import PartnerProfile from '../../../pages/_deliveryPartner/Profile';
import AvailableOrders from '../../../pages/_deliveryPartner/AvailableOrdders';
import ActiveDelivery from '../../../pages/_deliveryPartner/ActiveDelivery';
import DeliveryHistory from '../../../pages/_deliveryPartner/DeliveryHistory';
import Earnings from '../../../pages/_deliveryPartner/Earnings';
import Support from '../../../pages/_deliveryPartner/PartnerSupport';
import PartnerSettings from '../../../pages/_deliveryPartner/Settings';
import AuthenticationGuard from '../guards/AuthenticationGuard';
import RoleGuard from '../guards/RoleGuard';

const PartnerProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthenticationGuard>
      <RoleGuard allowedRoles={['partner', 'dev']}>
        {children}
      </RoleGuard>
    </AuthenticationGuard>
  );
};

export const PartnerRoutes = (
  <Route 
    path="/partner" 
    element={
      <PartnerProtected>
        <PartnerLayout />
      </PartnerProtected>
    } 
  >
    <Route index element={<PartnerDashboard />} />
    <Route path="orders" element={<AvailableOrders />} />
    <Route path="active" element={<ActiveDelivery />} />
    <Route path="profile" element={<PartnerProfile />} />
    <Route path="history" element={<DeliveryHistory />} />
    <Route path="earnings" element={<Earnings />} />
    <Route path="support" element={<Support />} />
    <Route path="settings" element={<PartnerSettings />} />
  </Route>
);

export default PartnerRoutes;
