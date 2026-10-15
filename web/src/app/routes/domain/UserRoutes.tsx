import React from 'react';
import { Route, Navigate } from 'react-router-dom';
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
import { useSearchParams } from 'react-router-dom';
import AuthenticationGuard from '../guards/AuthenticationGuard';
import RoleGuard from '../guards/RoleGuard';
import GuestGuard from '../guards/GuestGuard';

// Redirects /search or /search?q= to /restaurants?q=
const SearchRouteRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const target = q ? `/restaurants?q=${encodeURIComponent(q)}` : '/restaurants';
  return <Navigate to={target} replace />;
};

// Customer protected route wrapper using centralized guards
const UserProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthenticationGuard>
      <RoleGuard allowedRoles={['user', 'admin', 'owner', 'partner', 'dev']}>
        {children}
      </RoleGuard>
    </AuthenticationGuard>
  );
};

export const UserRoutes = (
  <Route element={<MainLayout />}>
    {/* Customer Landing Page */}
    <Route path="user" element={<Home />} />
    <Route path="home" element={<Navigate to="/user" replace />} />

    {/* Public & Guest Routes */}
    <Route path="login" element={<GuestGuard><Login /></GuestGuard>} />
    <Route path="signup" element={<GuestGuard><Signup /></GuestGuard>} />
    <Route path="forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />
    <Route path="reset-password" element={<GuestGuard><ResetPassword /></GuestGuard>} />

    {/* Public Content Routes */}
    <Route path="restaurants" element={<Restaurants />} />
    <Route path="restaurants/:id" element={<RestaurantDetail />} />
    <Route path="favorites" element={<Favourites />} />
    <Route path="notification" element={<Notifications />} />
    <Route path="search" element={<SearchRouteRedirect />} />
    <Route path="settings" element={<Settings />} />
    <Route path="showcase" element={<Showcase />} />
    <Route path="tour" element={<Navigate to="/showcase" replace />} />
    <Route path="orders/confirmation" element={<Orderconfirmation />} />

    {/* Customer Protected Routes */}
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

export default UserRoutes;
