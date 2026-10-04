import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../../features/auth/protectedRoute';
import AdminLayout from '../../../shared/layout/AdminLayout';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import OrdersList from '../../../pages/admin/orders/OrdersList';
import RestaurantsList from '../../../pages/admin/restaurants/RestaurantsList';
import AddRestaurant from '../../../pages/admin/restaurants/AddRestaurants';
import AdminProfile from '../../../pages/admin/Profile';
import { Promotions, Reports, Settings as AdminSettings, Users } from '../../../pages/admin';
import { AdminMenu } from '../../../pages/admin/menu';
import AdminAIPage from '../../../pages/admin/ai/AdminAIPage';
import InvestigationPage from '../../../pages/admin/ai/InvestigationPage';
import AdminDeliveryDashboard from '../../../pages/admin/delivery';
import ComingSoon from '../../../shared/components/ComingSoon';
import { appConfig } from '../../../core/config/app.config';

// Bypasses the route protection if DEV_BYPASS_AUTH is active
const AdminProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (appConfig.dev.bypassAuth) return <>{children}</>;
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
};

export const AdminRoutes = (
  <Route 
    path="/admin/*" 
    element={
      <AdminProtected>
        <AdminLayout />
      </AdminProtected>
    } 
  >
    <Route index element={<AdminDashboard />} />
    <Route path='orders' element={<OrdersList />} />
    <Route path='restaurants' element={<RestaurantsList />} />
    <Route path='restaurants/add' element={<AddRestaurant />} />
    <Route path='menu' element={<AdminMenu />} />
    <Route path='promotions' element={<Promotions />} />
    <Route path='reports' element={<Reports />} />
    <Route path='settings' element={<AdminSettings />} />
    <Route path='users' element={<Users />} />
    <Route path='profile' element={<AdminProfile />} />
    <Route path='ai' element={<AdminAIPage />} />
    <Route path='ai/investigations/:id' element={<InvestigationPage />} />
    <Route path='delivery' element={<AdminDeliveryDashboard />} />
    
    {/* Coming Soon Routes */}
    <Route path='payments' element={<ComingSoon title="Payments" />} />
    <Route path='orders/analytics' element={<ComingSoon title="Order Analytics" />} />
    <Route path='restaurants/categories' element={<ComingSoon title="Restaurant Categories" />} />
    <Route path='menu/categories' element={<ComingSoon title="Menu Categories" />} />
    <Route path='menu/add' element={<ComingSoon title="Add Menu Item" />} />
    <Route path='users/delivery' element={<ComingSoon title="Delivery Personnel" />} />
  </Route>
);
