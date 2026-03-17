// import { configureStore, combineReducers } from '@reduxjs/toolkit';
// import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';

// // Import slices
// import authReducer from '../features/auth/store/auth.slice';
// import cartReducer from '../features/customer/cart/store/cart.slice';
// import restaurantReducer from '../features/customer/restaurants/store/restaurants.slice';
// import orderReducer from '../features/shared/orders/store/orders.slice';
// import notificationReducer from '../features/shared/notifications/store/notifications.slice';
// import uiReducer from './slices/ui.slice';

// // Persist configuration
// const persistConfig = {
//   key: 'root',
//   storage,
//   whitelist: ['auth', 'cart'], // Only persist these reducers
//   blacklist: ['ui', 'notifications'], // Don't persist these
// };

// const rootReducer = combineReducers({
//   auth: authReducer,
//   cart: cartReducer,
//   restaurants: restaurantReducer,
//   orders: orderReducer,
//   notifications: notificationReducer,
//   ui: uiReducer,
// });

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       },
//     }).concat([
//       // Add custom middlewares
//       apiMiddleware,
//       analyticsMiddleware,
//       websocketMiddleware,
//     ]),
//   devTools: process.env.NODE_ENV !== 'production',
// });

// export const persistor = persistStore(store);

// // TypeScript types
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// // Typed hooks
// import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;