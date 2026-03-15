import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../features/auth/protectedRoute';
  //user routes
import MainLayout from '../components/layout/MainLayout';
import Home from '../pages/Home';
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';
import Profile from '../pages/Profile';
import RestaurantDetail from '../pages/RestaurantDetails/versions/RestaurantDetail_V4';
import Checkout from '../pages/Checkout';
import Cart from '../pages/Cart';
import Restaurants from '../pages/restaurantListings';
import type Dashboard from '../pages/admin/AdminDashboard';
import Orders from '../pages/Orders';
// import OrderDetail from '../pages/OrderDetail';
// import Search from '../pages/Search';
// import NotFound from '../pages/NotFound';
  //admin routes
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import OrdersList from '../pages/admin/orders/OrdersList';
import RestaurantsList from '../pages/admin/restaurants/RestaurantsList';
import AddRestaurant from '../pages/admin/restaurants/AddRestaurants';
import {Promotions, Reports, Settings, Users} from '../pages/admin';
const AppRoutes: React.FC = () => {
  return (
    <Routes>
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

      <Route path="/" element={<MainLayout />}>
      {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:id" element={<RestaurantDetail />} />
        
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
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
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