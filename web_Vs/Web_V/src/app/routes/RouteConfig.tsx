// import React, { Suspense } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { CircularProgress, Box } from '@mui/material';
// import { lazyLoad } from '../../core/utils/performance.utils';
// import { ProtectedRoute } from '../../shared/components/ProtectedRoute/ProtectedRoute';
// import { ROLES } from '../../core/constants/roles';

// // Lazy load all pages for code splitting
// const CustomerLayout = lazyLoad(() => import('../../features/customer/layouts/CustomerLayout'));
// const HomePage = lazyLoad(() => import('../../features/customer/home/HomePage'));
// const RestaurantsPage = lazyLoad(() => import('../../features/customer/restaurants/RestaurantsPage'));
// const RestaurantDetailPage = lazyLoad(() => import('../../features/customer/restaurants/RestaurantDetailPage'));
// const CartPage = lazyLoad(() => import('../../features/customer/cart/CartPage'));
// const CheckoutPage = lazyLoad(() => import('../../features/customer/checkout/CheckoutPage'));
// const OrdersPage = lazyLoad(() => import('../../features/customer/orders/OrdersPage'));
// const OrderTrackingPage = lazyLoad(() => import('../../features/customer/orders/OrderTrackingPage'));
// const ProfilePage = lazyLoad(() => import('../../features/shared/profile/ProfilePage'));

// // Admin pages
// const AdminLayout = lazyLoad(() => import('../../features/admin/layouts/AdminLayout'));
// const AdminDashboard = lazyLoad(() => import('../../features/admin/dashboard/AdminDashboard'));
// const AdminOrders = lazyLoad(() => import('../../features/admin/orders/OrdersManagement'));
// const AdminRestaurants = lazyLoad(() => import('../../features/admin/restaurants/RestaurantsManagement'));

// // Restaurant Owner pages
// const OwnerLayout = lazyLoad(() => import('../../features/owner/layouts/OwnerLayout'));
// const OwnerDashboard = lazyLoad(() => import('../../features/owner/dashboard/OwnerDashboard'));
// const OwnerMenu = lazyLoad(() => import('../../features/owner/menu/MenuManagement'));
// const OwnerOrders = lazyLoad(() => import('../../features/owner/orders/OrderQueue'));

// // Delivery Partner pages
// const PartnerLayout = lazyLoad(() => import('../../features/partner/layouts/PartnerLayout'));
// const PartnerDashboard = lazyLoad(() => import('../../features/partner/dashboard/PartnerDashboard'));
// const PartnerOrders = lazyLoad(() => import('../../features/partner/orders/AvailableOrders'));
// const PartnerEarnings = lazyLoad(() => import('../../features/partner/earnings/Earnings'));

// // Auth pages
// const LoginPage = lazyLoad(() => import('../../features/auth/LoginPage'));
// const SignupPage = lazyLoad(() => import('../../features/auth/SignupPage'));
// const ForgotPasswordPage = lazyLoad(() => import('../../features/auth/ForgotPasswordPage'));
// const ResetPasswordPage = lazyLoad(() => import('../../features/auth/ResetPasswordPage'));

// // Loading component
// const PageLoader = () => (
//   <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
//     <CircularProgress />
//   </Box>
// );

// export const RouteConfig: React.FC = () => {
//   return (
//     <Suspense fallback={<PageLoader />}>
//       <Routes>
//         {/* Public Routes */}
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />
//         <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//         <Route path="/reset-password" element={<ResetPasswordPage />} />

//         {/* Customer Routes */}
//         <Route element={<CustomerLayout />}>
//           <Route path="/" element={<HomePage />} />
//           <Route path="/restaurants" element={<RestaurantsPage />} />
//           <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
//           <Route path="/cart" element={<CartPage />} />
//           <Route
//             path="/checkout"
//             element={
//               <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
//                 <CheckoutPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/orders"
//             element={
//               <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
//                 <OrdersPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/orders/:id/track"
//             element={
//               <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
//                 <OrderTrackingPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/profile"
//             element={
//               <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
//                 <ProfilePage />
//               </ProtectedRoute>
//             }
//           />
//         </Route>

//         {/* Admin Routes */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <AdminLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<AdminDashboard />} />
//           <Route path="orders" element={<AdminOrders />} />
//           <Route path="restaurants" element={<AdminRestaurants />} />
//           <Route path="users" element={<AdminUsers />} />
//           <Route path="analytics" element={<AdminAnalytics />} />
//           <Route path="settings" element={<AdminSettings />} />
//         </Route>

//         {/* Restaurant Owner Routes */}
//         <Route
//           path="/owner"
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.RESTAURANT_OWNER]}>
//               <OwnerLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<OwnerDashboard />} />
//           <Route path="menu" element={<OwnerMenu />} />
//           <Route path="orders" element={<OwnerOrders />} />
//           <Route path="analytics" element={<OwnerAnalytics />} />
//           <Route path="reviews" element={<OwnerReviews />} />
//           <Route path="staff" element={<OwnerStaff />} />
//           <Route path="settings" element={<OwnerSettings />} />
//         </Route>

//         {/* Delivery Partner Routes */}
//         <Route
//           path="/partner"
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
//               <PartnerLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<PartnerDashboard />} />
//           <Route path="orders" element={<PartnerOrders />} />
//           <Route path="earnings" element={<PartnerEarnings />} />
//           <Route path="history" element={<PartnerHistory />} />
//           <Route path="profile" element={<PartnerProfile />} />
//         </Route>

//         {/* 404 */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </Suspense>
//   );
// };