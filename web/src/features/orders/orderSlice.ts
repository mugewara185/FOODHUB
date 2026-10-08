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
import type { Order, Coordinates, DeliveryPartner, OrderChatMessage } from '../../core/types';
import type { RootState } from '../../app/store';
import { appConfig } from '../../core/config/app.config';
import {
  orderApi,
  mapCartItemToOrderItem,
  mapPaymentMethod,
  type CreateOrderPayload,
} from './api/orderApi';
import { normalizeError, type AsyncStatus, type NormalizedApiError } from '../../core/utils/asyncState';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface LiveTrackingData {
  orderId: string;
  status: string;
  partner: DeliveryPartner | null;
  location: Coordinates | null;
  etaSeconds: number;
  distance: number;
  chatMessages: OrderChatMessage[];
  unreadCount: number;
  lastUpdatedAt: number;
}

export interface OrderState {
  items: Order[];
  currentOrder: Order | null;
  liveTracking: LiveTrackingData | null;
  fetchStatus: AsyncStatus;
  createStatus: AsyncStatus;
  cancelStatus: AsyncStatus;
  error: NormalizedApiError | null;
}

const initialState: OrderState = {
  items: [],
  currentOrder: null,
  liveTracking: null,
  fetchStatus: 'idle',
  createStatus: 'idle',
  cancelStatus: 'idle',
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
      return rejectWithValue(normalizeError(err));
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
      return rejectWithValue(normalizeError(err));
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
      return rejectWithValue(normalizeError(err));
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
      return rejectWithValue(normalizeError(err));
    }
  },
);

export const submitReviewThunk = createAsyncThunk<void, { orderId: string, restaurantRating: number, partnerRating: number, comment?: string }, { state: RootState }>(
  'orders/submitReview',
  async (payload, { rejectWithValue }) => {
    try {
      await orderApi.submitReview(payload);
    } catch (err) {
      return rejectWithValue(normalizeError(err));
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

      // Update live tracking if active
      if (state.liveTracking && state.liveTracking.orderId === orderId) {
        state.liveTracking.status = status;
      }
    },
    setLiveTrackingOrder(state, action: PayloadAction<{ orderId: string; status: string; }>) {
      if (!state.liveTracking || state.liveTracking.orderId !== action.payload.orderId) {
        state.liveTracking = {
          orderId: action.payload.orderId,
          status: action.payload.status,
          partner: null,
          location: null,
          etaSeconds: 0,
          distance: 0,
          chatMessages: [],
          unreadCount: 0,
          lastUpdatedAt: Date.now()
        };
      } else {
        state.liveTracking.status = action.payload.status;
      }
    },
    updateLiveTrackingLocation(state, action: PayloadAction<{ location: Coordinates; etaSeconds: number; distance: number }>) {
      if (state.liveTracking) {
        state.liveTracking.location = action.payload.location;
        state.liveTracking.etaSeconds = action.payload.etaSeconds;
        state.liveTracking.distance = action.payload.distance;
        state.liveTracking.lastUpdatedAt = Date.now();
      }
    },
    updateLiveTrackingPartner(state, action: PayloadAction<DeliveryPartner>) {
      if (state.liveTracking) {
        state.liveTracking.partner = action.payload;
      }
    },
    addLiveTrackingChatMessage(state, action: PayloadAction<{ message: OrderChatMessage; isChatOpen: boolean }>) {
      if (state.liveTracking && state.liveTracking.orderId === action.payload.message.orderId) {
        state.liveTracking.chatMessages.push(action.payload.message);
        if (!action.payload.isChatOpen) {
          state.liveTracking.unreadCount += 1;
        }
      }
    },
    setLiveTrackingChatHistory(state, action: PayloadAction<{ orderId: string; messages: OrderChatMessage[] }>) {
      if (state.liveTracking && state.liveTracking.orderId === action.payload.orderId) {
        state.liveTracking.chatMessages = action.payload.messages;
      }
    },
    clearLiveTrackingUnreadCount(state) {
      if (state.liveTracking) {
        state.liveTracking.unreadCount = 0;
      }
    },
    clearLiveTracking(state) {
      state.liveTracking = null;
    },
  },
  extraReducers: (builder) => {
    // fetchOrdersThunk
    builder
      .addCase(fetchOrdersThunk.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchOrdersThunk.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.fetchStatus = 'success';
        state.items = action.payload;
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      });

    // fetchOrderByIdThunk
    builder
      .addCase(fetchOrderByIdThunk.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchOrderByIdThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.fetchStatus = 'success';
        state.currentOrder = action.payload;
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchOrderByIdThunk.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      });

    // createOrderThunk
    builder
      .addCase(createOrderThunk.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.createStatus = 'success';
        state.currentOrder = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(createOrderThunk.rejected, (state, action) => {
        state.createStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      });

    // cancelOrderThunk
    builder
      .addCase(cancelOrderThunk.pending, (state) => {
        state.cancelStatus = 'loading';
        state.error = null;
      })
      .addCase(cancelOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.cancelStatus = 'success';
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrderThunk.rejected, (state, action) => {
        state.cancelStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      });
  },
});

// export const { clearCurrentOrder, clearOrderError, updateOrderStatusLocally, setLiveTrackingOrder, updateLiveTrackingLocation, updateLiveTrackingPartner, addLiveTrackingChatMessage, setLiveTrackingChatHistory, clearLiveTrackingUnreadCount, clearLiveTracking } = orderSlice.actions;
export const { clearCurrentOrder, clearOrderError, updateOrderStatusLocally, setLiveTrackingOrder, updateLiveTrackingLocation, updateLiveTrackingPartner, addLiveTrackingChatMessage, setLiveTrackingChatHistory, clearLiveTrackingUnreadCount, clearLiveTracking } = orderSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectOrders = (state: RootState) => state.orders.items;
export const selectCurrentOrder = (state: RootState) => state.orders.currentOrder;
export const selectLiveTracking = (state: RootState) => state.orders.liveTracking;
export const selectOrdersLoading = (state: RootState) => state.orders.fetchStatus === 'loading';
export const selectOrderCreating = (state: RootState) => state.orders.createStatus === 'loading';
export const selectOrderCancelling = (state: RootState) => state.orders.cancelStatus === 'loading';
export const selectOrderError = (state: RootState) => state.orders.error;

export default orderSlice.reducer;

export const selectFetchStatus = (state: RootState) => state.orders.fetchStatus;


