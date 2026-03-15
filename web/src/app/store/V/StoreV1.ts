import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../../../features/auth/authSlice";
import cartReducer from "../../../features/cart/cartSlice";
import restaurantReducer from "../../../features/restaurant/restaurantSlice";

 const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    restaurant: restaurantReducer,
  },
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;