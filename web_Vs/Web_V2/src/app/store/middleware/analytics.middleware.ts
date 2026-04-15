// import { Middleware } from '@reduxjs/toolkit';
// import { APP_CONFIG } from '../../core/config/app.config';

// // Track user actions for analytics
// export const analyticsMiddleware: Middleware = (store) => (next) => (action) => {
//   if (!APP_CONFIG.enableAnalytics) {
//     return next(action);
//   }

//   const result = next(action);
//   const state = store.getState();

//   // Track specific actions
//   switch (action.type) {
//     case 'auth/login/fulfilled':
//       trackEvent('user_login', { userId: state.auth.user?.id });
//       break;
//     case 'cart/addItem':
//       trackEvent('add_to_cart', { 
//         itemId: action.payload.id,
//         restaurantId: action.payload.restaurantId 
//       });
//       break;
//     case 'orders/createOrder/fulfilled':
//       trackEvent('order_placed', {
//         orderId: action.payload.id,
//         amount: action.payload.total,
//       });
//       break;
//   }

//   return result;
// };

// // Google Analytics / Mixpanel / Segment integration
// const trackEvent = (eventName: string, properties?: Record<string, any>) => {
//   if (typeof window.gtag !== 'undefined') {
//     window.gtag('event', eventName, properties);
//   }
  
//   if (typeof window.mixpanel !== 'undefined') {
//     window.mixpanel.track(eventName, properties);
//   }
// };