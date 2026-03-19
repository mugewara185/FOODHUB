import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { RootState } from '../../../../app/store';
import type { CartItem, CustomizedItem } from '../../../../core/types';
// Types
export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode: string | null;
  discount: number;
  itemCount: number;
}

const calculateTotals = (items: CartItem[], deliveryFee: number = 29, taxRate: number = 0.05) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const discount = 0; // Will be calculated when coupon applied
  const total = subtotal + deliveryFee + tax - discount;

  return {
    subtotal,
    tax,
    discount,
    total,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
  };
};

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  subtotal: 0,
  deliveryFee: 29, //add in mongo?
  tax: 0,
  total: 0,
  couponCode: null,
  discount: 0,
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'id'>>) => {
      const { foodItemId, restaurantId, restaurantName } = action.payload ; 

      // Check if adding from same restaurant
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        // Clear cart if different restaurant
        state.items = [];
        state.restaurantId = restaurantId;
        state.restaurantName = restaurantName;
      } else if (!state.restaurantId) {
        state.restaurantId = restaurantId;
        state.restaurantName = restaurantName;
      }

      // Check if item already exists
      const existingItem = state.items.find(item => item.foodItemId === foodItemId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        const newItem: CartItem | CustomizedItem = {
          ...action.payload,
          id: uuidv4(),
        };
        state.items.push(newItem);
      }

      // Recalculate totals
      const totals = calculateTotals(state.items, state.deliveryFee);
      Object.assign(state, totals);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }

      const totals = calculateTotals(state.items, state.deliveryFee);
      Object.assign(state, totals);
    },

    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== itemId);
        } else {
          item.quantity = quantity;
        }
      }

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }

      const totals = calculateTotals(state.items, state.deliveryFee);
      Object.assign(state, totals);
    },

    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.couponCode = null;
      state.discount = 0;

      const totals = calculateTotals([], state.deliveryFee);
      Object.assign(state, totals);
    },

    applyCoupon: (state, action: PayloadAction<string>) => {
      // Mock coupon logic
      const coupon = action.payload.toUpperCase();
      if (coupon === 'SAVE10') {
        state.couponCode = coupon;
        state.discount = state.subtotal * 0.1; // 10% off
      } else if (coupon === 'FLAT50') {
        state.couponCode = coupon;
        state.discount = 50; // ₹50 off
      } else {
        state.couponCode = null;
        state.discount = 0;
      }

      state.total = state.subtotal + state.deliveryFee + state.tax - state.discount;
    },

    removeCoupon: (state) => {
      state.couponCode = null;
      state.discount = 0;
      state.total = state.subtotal + state.deliveryFee + state.tax;
    },

    updateDeliveryFee: (state, action: PayloadAction<number>) => {
      state.deliveryFee = action.payload;
      state.total = state.subtotal + state.deliveryFee + state.tax - state.discount;
    },

    setSpecialInstructions: (state, action: PayloadAction<{ itemId: string; instructions: string }>) => {
      const item = state.items.find(item => item.id === action.payload.itemId);
      if (item) {
        item.specialInstructions = action.payload.instructions;
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  updateDeliveryFee,
  setSpecialInstructions,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: RootState) => (
                                                      console.dir({'restaurants': state.restaurants, 'ui': state.ui}), console.log({ 'CartItems': state.cart.items }), 
                                                      state.cart.items);
export const selectCartRestaurant = (state: RootState) => ({
  id: state.cart.restaurantId,
  name: state.cart.restaurantName,
});
export const selectCartTotals = (state: RootState) => ({
  subtotal: state.cart.subtotal,
  deliveryFee: state.cart.deliveryFee,
  tax: state.cart.tax,
  discount: state.cart.discount,
  total: state.cart.total,
  itemCount: state.cart.itemCount,
});
export const selectCartCoupon = (state: RootState) => ({
  code: state.cart.couponCode,
  discount: state.cart.discount,
});
export const selectIsCartEmpty = (state: RootState) => state.cart.items.length === 0;