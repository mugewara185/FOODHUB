import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../../features/auth/protectedRoute';
import MainLayout from '../../../shared/layout/MainLayout';
import Home from '../../../pages/Home';
import Login from '../../../pages/Auth/Login';
import Signup from '../../../pages/Auth/Signup';
import ForgotPassword from '../../../pages/Auth/ForgotPassword';
import ResetPassword from '../../../pages/Auth/ResetPassword';
import RestaurantDetail from '../../../pages/RestaurantDetails';
import Checkout from '../../../pages/Checkout';
import Cart from '../../../pages/Cart';
import Restaurants from '../../../pages/restaurantListings';
import Orderconfirmation from '../../../pages/OrderConfirmation';
import Orders from '../../../pages/Orders';
import OrderTracking from '../../../pages/Orders/OrderTracking';
import ComingSoon from '../../../shared/components/ComingSoon';
import {
  Favourites,
  Profile,
  Notifications,
  Settings
} from '@pages/index';
import Showcase from '../../../pages/Showcase';
import { appConfig } from '../../../core/config/app.config';
import { useSearchParams } from 'react-router-dom';

// Redirects /search or /search?q= to /restaurants?q=
const SearchRouteRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const target = q ? `/restaurants?q=${encodeURIComponent(q)}` : '/restaurants';
  return <Navigate to={target} replace />;
};

// Bypasses the route protection if DEV_BYPASS_AUTH is active
const UserProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (appConfig.dev.bypassAuth) return <>{children}</>;
  return <ProtectedRoute allowedRoles={['user']}>{children}</ProtectedRoute>;
};

export const UserRoutes = (
  <Route path="/" element={<MainLayout />}>
    {/* Public Routes */}
    <Route index element={<Home />} />
    <Route path="login" element={<Login />} />
    <Route path="signup" element={<Signup />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route path="reset-password" element={<ResetPassword />} />
    <Route path="restaurants" element={<Restaurants />} />
    <Route path="restaurants/:id" element={<RestaurantDetail />} />
    <Route path="favorites" element={<Favourites />} />
    <Route path="notification" element={<Notifications />} />
    <Route path="search" element={<SearchRouteRedirect />} />
    <Route path="settings" element={<Settings />} />
    <Route path="showcase" element={<Showcase />} />
    <Route path="tour" element={<Navigate to="/showcase" replace />} />
    <Route path="orders/confirmation" element={<Orderconfirmation />} />
    
    {/* Protected Routes */}
    <Route path="profile" element={<UserProtected><Profile /></UserProtected>} />
    <Route path="cart" element={<UserProtected><Cart /></UserProtected>} />
    <Route path="checkout" element={<UserProtected><Checkout /></UserProtected>} />
    <Route path="orders" element={<UserProtected><Orders /></UserProtected>} />
    <Route path="orders/tracking/:id" element={<OrderTracking />} />
    
    {/* Redirects and Coming Soon */}
    <Route path="history" element={<Navigate to="/orders" replace />} />
    <Route path="help" element={<ComingSoon title="Help & Support" />} />
  </Route>
);
