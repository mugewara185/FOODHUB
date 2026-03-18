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
import Profile from '../../pages/Profile';
import RestaurantDetail from '../../pages/RestaurantDetails/versions/RestaurantDetail_V';
import Checkout from '../../pages/Checkout';
import Cart from '../../pages/Cart';
import Restaurants from '../../pages/restaurantListings';
import type Dashboard from '../../pages/admin/AdminDashboard';
import Orders from '../../pages/Orders';
// import OrderDetail from '../pages/OrderDetail';
// import Search from '../pages/Search';
// import NotFound from '../pages/NotFound';
  //admin routes
import AdminLayout from '../../shared/layout/AdminLayout';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import OrdersList from '../../pages/admin/orders/OrdersList';
import RestaurantsList from '../../pages/admin/restaurants/RestaurantsList';
import AddRestaurant from '../../pages/admin/restaurants/AddRestaurants';
import {Promotions, Reports, Settings, Users} from '../../pages/admin';
import OrderTracking from '../../pages/Orders/OrderTracking';
import PartnerLayout from '../../shared/layout/PartnerLayout';
import PartnerDashboard from '../../pages/_deliveryPartner/PartnerDashboard';
import AvailableOrders from '../../pages/_deliveryPartner/AvailableOrdders';
import ActiveDelivery from '../../pages/_deliveryPartner/ActiveDelivery';
import OwnerLayout from '../../shared/layout/OwnerLayout';
import OwnerDashboard from '../../pages/_ownerPages/DashBoard';
// import OrderTracking from '../pages/Orders/OrderTracking/index';
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* admin routes */}
      <Route path="/admin" element={<AdminLayout />} >
        <Route index element={<AdminDashboard />} />
        <Route path='orders' element={<OrdersList />} />
        <Route path='restaurants' element={<RestaurantsList />} />
        <Route path='restaurants/add' element={<AddRestaurant />} />
        <Route path='promotions' element={<Promotions />} />
        <Route path='reports' element={<Reports />} />
        <Route path='settings' element={<Settings />} />
        <Route path='users' element={<Users />} />
      </Route>
      {/* partner routes */}
      <Route path="/partner/*" element={<PartnerLayout />} >
        <Route index element={<PartnerDashboard />} />
        <Route path='orders' element={<AvailableOrders />} />
        <Route path='active' element={<ActiveDelivery />} />
      </Route>
      {/* owner routes  */}
      <Route path="/owner/*" element={<OwnerLayout />} >
        <Route index element={<OwnerDashboard />} />
      </Route>
      {/* user routes */}
      <Route path="/" element={<MainLayout />}>
      {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurant/:id" element={<RestaurantDetail />} />
        
      {/* Protected Routes */}
        <Route path="profile" element={
          // <ProtectedRoute>
            <Profile />
          // </ProtectedRoute>
        } />
        <Route path="cart" element={
          // <ProtectedRoute>
            <Cart />
          // </ProtectedRoute>
        } />
        <Route path="checkout" element={
          // <ProtectedRoute>
            <Checkout />
          // </ProtectedRoute>
        } />
        <Route path="orders" element={
          // <ProtectedRoute>
            <Orders />
          // </ProtectedRoute>
        } />
        <Route path='orders/:id/track' element={<OrderTracking />} />
        {/* ... other routes */}
        
        {/* Public Routes */}
        {/* <Route path="search" element={<Search />} /> */}
        
        {/* 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;