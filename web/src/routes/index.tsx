import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../features/auth/protectedRoute';
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
// import Orders from '../pages/Orders';
// import OrderDetail from '../pages/OrderDetail';
// import Search from '../pages/Search';
// import NotFound from '../pages/NotFound';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={
          // <ProtectedRoute requireAuth={false}>
            <Login />
          // </ProtectedRoute>
        } />
        <Route path="signup" element={
          <ProtectedRoute requireAuth={false}>
            <Signup />
          </ProtectedRoute>
        } />
        <Route path="forgot-password" element={
          <ProtectedRoute requireAuth={false}>
            <ForgotPassword />
          </ProtectedRoute>
        } />
        <Route path="reset-password" element={
          <ProtectedRoute requireAuth={false}>
            <ResetPassword />
          </ProtectedRoute>
        } />
        
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
        {/* <Route path="orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } /> */}
        {/* ... other protected routes */}
        
        {/* Public Routes */}
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:id" element={<RestaurantDetail />} />
        {/* <Route path="search" element={<Search />} /> */}
        
        {/* 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;