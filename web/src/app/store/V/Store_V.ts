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

import authReducer from "../../../features/auth/authSlice";
import cartReducer from "../../../features/cart/cartSlice";
import restaurantReducer from "../../../features/restaurant/restaurantSlice";
import uislice from "../../../features/ui/uiSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  restaurants: restaurantReducer,
  ui: uislice,
});

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth", "cart"], // Preserving auth and cart
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: true,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;