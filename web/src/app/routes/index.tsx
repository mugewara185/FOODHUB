import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../features/auth/protectedRoute';
//user routes
import MainLayout from '../../shared/layout/MainLayout';
import Home from '../../pages/Home';
import Login from '../../pages/Auth/Login';
import Signup from '../../pages/Auth/Signup';
import ForgotPassword from '../../pages/Auth/ForgotPassword';
import ResetPassword from '../../pages/Auth/ResetPassword';
import RestaurantDetail from '../../pages/RestaurantDetails';
import Checkout from '../../pages/Checkout';
import Cart from '../../pages/Cart';
import Restaurants from '../../pages/restaurantListings';
import Orderconfirmation from '../../pages/OrderConfirmation';
// import orderTracking from '../../pages/Orders/OrderTracking';
import Orders from '../../pages/Orders';
// import Profile from '../../pages/zothers/Profile';
import {
  Favourites,
  Profile,
  Notifications,
  SearchPage,
  Settings
  // Addresses,
  // Checkout 
} from '@pages/index'
// import OrderDetail from '../pages/OrderDetail';
// import Search from '../pages/Search';
// import NotFound from '../pages/NotFound';

// delivery partner routes
import PartnerLayout from '../../shared/layout/PartnerLayout';
import PartnerDashboard from '../../pages/_deliveryPartner/PartnerDashboard';
import PartnerProfile from '../../pages/_deliveryPartner/Profile';
import AvailableOrders from '../../pages/_deliveryPartner/AvailableOrdders';
import ActiveDelivery from '../../pages/_deliveryPartner/ActiveDelivery';
import DeliveryHistory from '../../pages/_deliveryPartner/DeliveryHistory';
import Earnings from '../../pages/_deliveryPartner/Earnings';
import Support from '../../pages/_deliveryPartner/PartnerSupport';
import PartnerSettings from '../../pages/_deliveryPartner/Settings';

// owner routes
import OwnerLayout from '../../shared/layout/OwnerLayout';
import OwnerDashboard from '../../pages/_ownerPages/DashBoard';
import OwnerSettings from '../../pages/_ownerPages/Settings';

//admin routes
import AdminLayout from '../../shared/layout/AdminLayout';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import OrdersList from '../../pages/admin/orders/OrdersList';
import RestaurantsList from '../../pages/admin/restaurants/RestaurantsList';
import AddRestaurant from '../../pages/admin/restaurants/AddRestaurants';
import OrderTracking from '../../pages/Orders/OrderTracking';
import AdminProfile from '../../pages/admin/Profile';
import { Promotions, Reports, Settings as AdminSettings, Users } from '../../pages/admin';

import { de } from 'date-fns/locale';
import DevLayout from '@/core/dev/ui/layout/DevLayout';
import DevDashboard from '@/core/dev/ui/Dashboard';
import ComponentTreeExplorer from '@/core/dev/ui/pages/ComponentTree';
import StateInspector from '@/core/dev/ui/pages/StateInspector';
import PropsPanel from '@/core/dev/ui/pages/PropsPanel';
import VersionSwitcher from '@/core/dev/ui/pages/VersionSwitcher';
import NetworkInspector from '@/core/dev/ui/pages/NetworkInspector';
import LogPanel from '@/core/dev/ui/pages/LogPanel';
import PerformanceMetrics from '@/core/dev/ui/pages/PerformanceMetrics';
import ComponentPlayground from '@/core/dev/ui/pages/ComponentPlayground';
import DocumentationViewer from '@/core/dev/ui/pages/DocumentationViewer';

import { useLocation } from 'react-router-dom';
import { logPerformance } from '../../core/dev/logger';

const AppRoutes: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    logPerformance.navigation(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <Routes>
{/* user and public routes */}
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:id" element={<RestaurantDetail />} />
        <Route path='favorites' element={<Favourites />} />
        <Route path='notification' element={<Notifications />} />
        <Route path='search' element={<SearchPage />} />
        <Route path='settings' element={<Settings />} />
        <Route path='orders/confirmation' element={<Orderconfirmation />} />
        {/* Protected Routes */}
        <Route path="profile" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="cart" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="checkout" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path='orders/:id/track' element={<OrderTracking />} />
        {/* ... other routes */}

        {/* Public Routes */}
        {/* <Route path="search" element={<Search />} /> */}

        {/* 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>

{/* admin routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      } >
        <Route index element={<AdminDashboard />} />
        <Route path='orders' element={<OrdersList />} />
        {/* <Route path='orders/:id/track' element={<OrderTracking />} (//user component) for now /> */}
        <Route path='restaurants' element={<RestaurantsList />} />
        <Route path='restaurants/add' element={<AddRestaurant />} />
        <Route path='promotions' element={<Promotions />} />
        <Route path='reports' element={<Reports />} />
        <Route path='settings' element={<AdminSettings />} />
        <Route path='users' element={<Users />} />
        <Route path='profile' element={<AdminProfile />} />
      </Route>

{/* partner routes */}
      <Route path="/partner/*" element={
        <ProtectedRoute allowedRoles={['delivery_partner']}>
          <PartnerLayout />
        </ProtectedRoute>
      } >
        <Route index element={<PartnerDashboard />} />
        <Route path='orders' element={<AvailableOrders />} />
        <Route path='active' element={<ActiveDelivery />} />
        <Route path='profile' element={<PartnerProfile />} />
        <Route path='history' element={<DeliveryHistory />} />
        <Route path='earnings' element={<Earnings />} />
        <Route path='support' element={<Support />} />
        <Route path='settings' element={<PartnerSettings />} />
      </Route>

{/* owner routes  */}
      <Route path="/owner/*" element={
        <ProtectedRoute allowedRoles={['restaurant_owner']}>
          <OwnerLayout />
        </ProtectedRoute>
      } >
        <Route index element={<OwnerDashboard />} />
        <Route path='settings' element={<OwnerSettings />} />
        {/* <Route path='s' */}
      </Route>

{/* dev */}
      <Route path="/dev" element={<DevLayout />} >
        <Route index element={<DevDashboard />} />
        <Route path='component-tree' element={<ComponentTreeExplorer />} />
        <Route path='components' element={<ComponentPlayground />} />
        <Route path='state' element={<StateInspector />} />
        <Route path='props' element={<PropsPanel />} />
        <Route path='versions' element={<VersionSwitcher />} />
        <Route path='network' element={<NetworkInspector />} />
        <Route path='logs' element={<LogPanel />} />
        <Route path='performance' element={<PerformanceMetrics />} />
        <Route path='docs' element={<DocumentationViewer />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;