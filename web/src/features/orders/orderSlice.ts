/**
 * orderSlice.ts
 *
 * Redux slice for the order domain.
 * Replaces the saga-era stub with createAsyncThunk-based async operations.
 * Follows the same pattern as restaurantSlice_V.ts and authSlice.ts.
 *
 * DATA_SOURCE switching:
 *   mock -> returns factory/mock order data
 *   api  -> calls real backend via orderApi
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Order } from '../../core/types';
import type { RootState } from '../../app/store';
import { appConfig } from '../../core/config/app.config';
import {
  orderApi,
  mapCartItemToOrderItem,
  mapPaymentMethod,
  type CreateOrderPayload,
} from './api/orderApi';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface OrderState {
  /** User's order history */
  items: Order[];
  /** The most recently placed order (for confirmation page) */
  currentOrder: Order | null;
  /** True while GET /api/orders is in-flight */
  loading: boolean;
  /** True while POST /api/orders is in-flight */
  creating: boolean;
  /** True while PATCH /api/orders/:id/cancel is in-flight */
  cancelling: boolean;
  error: string | null;
}

const initialState: OrderState = {
  items: [],
  currentOrder: null,
  loading: false,
  creating: false,
  cancelling: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getToken = (state: RootState): string => {
  const token = state.auth.user?.token;
  if (!token) throw new Error('Not authenticated — please log in');
  return token;
};

// Payload accepted by createOrderThunk from Checkout
export interface CheckoutPayload {
  /** Formatted delivery address string */
  deliveryAddress: string;
  /** UI payment method value (includes 'cod' and 'wallet') */
  paymentMethod: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

import { logger } from '../../core/dev/logger';

/**
 * Fetch the authenticated user's order history.
 * mock mode: returns factory-generated orders
 * api  mode: GET /api/orders
 */
export const fetchOrdersThunk = createAsyncThunk<Order[], void, { state: RootState }>(
  'orders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await orderApi.getUserOrders();
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch orders');
    }
  },
);

/**
 * Fetch a single order by ID.
 * mock mode: finds by id in factory-generated list
 * api  mode: GET /api/orders/:id
 */
export const fetchOrderByIdThunk = createAsyncThunk<Order, string, { state: RootState }>(
  'orders/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await orderApi.getById(id);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch order');
    }
  },
);

/**
 * Place a new order from the current cart.
 * Reads cart and auth state internally — Checkout only passes delivery details.
 *
 * mock mode: creates a synthetic order from cart state and returns it
 * api  mode: POST /api/orders
 */
export const createOrderThunk = createAsyncThunk<Order, CheckoutPayload, { state: RootState }>(
  'orders/create',
  async ({ deliveryAddress, paymentMethod, note }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const cart = state.cart;
      if (cart.items.length === 0 || !cart.restaurantId) {
        throw new Error('Cart is empty or missing restaurant info');
      }
      const backendPaymentMethod = mapPaymentMethod(paymentMethod);
      const payload: CreateOrderPayload = {
        restaurantId: cart.restaurantId,
        items: cart.items.map(mapCartItemToOrderItem),
        deliveryAddress,
        paymentMethod: backendPaymentMethod,
        note,
      };
      return await orderApi.create(payload);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to place order');
    }
  },
);

/**
 * Cancel an existing order.
 * Only orders with status 'pending_owner' or 'confirmed' can be cancelled (enforced by backend).
 *
 * mock mode: patches the order status locally
 * api  mode: PATCH /api/orders/:id/cancel
 */
export const cancelOrderThunk = createAsyncThunk<Order, string, { state: RootState }>(
  'orders/cancel',
  async (orderId, { rejectWithValue }) => {
    try {
      return await orderApi.cancel(orderId);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  },
);

export const submitReviewThunk = createAsyncThunk<void, { orderId: string, restaurantRating: number, partnerRating: number, comment?: string }, { state: RootState }>(
  'orders/submitReview',
  async (payload, { rejectWithValue }) => {
    try {
      await orderApi.submitReview(payload);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to submit review');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    /** Clear the currentOrder (e.g. when navigating away from confirmation) */
    clearCurrentOrder(state) {
      state.currentOrder = null;
    },
    /** Clear the error */
    clearOrderError(state) {
      state.error = null;
    },
    updateOrderStatusLocally(state, action: PayloadAction<{ orderId: string; status: Order['status'] }>) {
      const { orderId, status } = action.payload;

      // Update in history list if present
      const index = state.items.findIndex(o => o.id === orderId);
      if (index !== -1) {
        state.items[index].status = status;
      }

      // Update current order if it's the one being tracked
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchOrdersThunk
    builder
      .addCase(fetchOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersThunk.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchOrderByIdThunk
    builder
      .addCase(fetchOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderByIdThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        // Upsert into items list
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // createOrderThunk
    builder
      .addCase(createOrderThunk.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.creating = false;
        state.currentOrder = action.payload;
        // Prepend to history list
        state.items.unshift(action.payload);
      })
      .addCase(createOrderThunk.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });

    // cancelOrderThunk
    builder
      .addCase(cancelOrderThunk.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.cancelling = false;
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrderThunk.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload as string;
      });
  },
});

// export const { clearCurrentOrder, clearOrderError, updateOrderStatusLocally } = orderSlice.actions;
export const { clearCurrentOrder, clearOrderError, updateOrderStatusLocally } = orderSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectOrders = (state: RootState) => state.orders.items;
export const selectCurrentOrder = (state: RootState) => state.orders.currentOrder;
export const selectOrdersLoading = (state: RootState) => state.orders.loading;
export const selectOrderCreating = (state: RootState) => state.orders.creating;
export const selectOrderCancelling = (state: RootState) => state.orders.cancelling;
export const selectOrderError = (state: RootState) => state.orders.error;

export default orderSlice.reducer;
