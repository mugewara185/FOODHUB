import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { 
  persistStore, 
  persistReducer, 
  FLUSH, 
  REHYDRATE, 
  PAUSE, 
  PERSIST, 
  PURGE, 
  REGISTER 
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";
import { IS_DEV } from "../../../core/config/app.config";

import authReducer from "../../../features/auth/authSlice";
import cartReducer from "../../../features/cart/cartSlice";
import restaurantReducer from "../../../features/restaurant/restaurantSlice";
import uislice from "../../../features/ui/uiSlice";
import orderReducer from "../../../features/orders/orderSlice";
import notificationReducer from "../../../core/notifications/notificationSlice";

// Import state initializers
import { initializeAllStatesFromFactory } from "./stateInitializers";

// Import Redux logger
import { createReduxLoggerMiddleware } from "./reduxLogger.middleware";
import { reduxLoggerControl, REDUX_LOGGER_CONFIG } from "./reduxLogger.config";

// Initialize root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  restaurants: restaurantReducer,
  ui: uislice,
  orders: orderReducer,
  notifications: notificationReducer,
});

// Select storage engine: session isolation mode uses sessionStorage for multi-tab testing
const SESSION_ISOLATION_KEY = "zom2_dev_session_isolation";
const useSessionStorage = IS_DEV && localStorage.getItem(SESSION_ISOLATION_KEY) === "true";
const storageEngine = useSessionStorage ? storageSession : storage;

const persistConfig = {
  key: "root",
  version: 1,
  storage: storageEngine,
  whitelist: ["cart", "notifications"], // Preserving cart and notifications.
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Create store with factory-initialized state
 * Pre-loads realistic data from unifiedFactory on app start
 * 
 * Best Practices:
 * 1. Preloaded state is combined with persisted state
 * 2. Cart and Auth are persisted across sessions
 * 3. Restaurant data is re-generated on each app start (CMS data should come from API)
 * 4. Error handling gracefully falls back to empty states
 */
const store = configureStore({
  reducer: persistedReducer,
  // preloadedState: initializeAllStatesFromFactory({
  //   restaurantCount: 20,
  //   foodItemCount: 50,
  //   userCount: 5,
  //   orderCount: 5,
  //   reviewCount: 10,
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // }) as any, // Type assertion needed because redux-persist adds _persist property after initialization
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
    // .concat(
    //   // Add Redux logger middleware
    //   createReduxLoggerMiddleware()
    // )
  ,devTools: IS_DEV, //true
});

console.log("Redux store initialized with factory data:", store.getState());

// Initialize Redux logger control with config
// if (IS_DEV) {
//   // Make logger control available globally for debugging
//   (window as any).reduxLoggerControl = reduxLoggerControl;
  
//   console.log(
//     '%c[REDUX_LOGGER] Initialized with config:',
//     'color: #1976d2; font-weight: bold;',
//   );
//   console.table({
//     'Enabled': REDUX_LOGGER_CONFIG.enabled,
//     'Log Actions': REDUX_LOGGER_CONFIG.logActions,
//     'Log State Changes': REDUX_LOGGER_CONFIG.logStateChanges,
//     'Performance': REDUX_LOGGER_CONFIG.enablePerformanceMetrics,
//     'Auth Logging': REDUX_LOGGER_CONFIG.featureLogging.auth,
//     'Cart Logging': REDUX_LOGGER_CONFIG.featureLogging.cart,
//     'Restaurant Logging': REDUX_LOGGER_CONFIG.featureLogging.restaurants,
//     'UI Logging': REDUX_LOGGER_CONFIG.featureLogging.ui,
//   });
  
//   console.log(
//     '%cUsage: reduxLoggerControl.setEnabled(false) to disable, reduxLoggerControl.printStatus() for quick status',
//     'color: #666; font-style: italic;'
//   );
// }

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;