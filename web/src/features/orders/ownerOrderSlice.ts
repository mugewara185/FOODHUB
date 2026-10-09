import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Order } from '../../core/types';
import { fetchOwnerQueueThunk, fetchOwnerActiveThunk, OWNER_ACTIVE_STATUSES } from './ownerOrderApi';
import { normalizeOrder } from './api/orderApi';

export interface OwnerOrderState {
  pendingOrders: Order[];
  activeOrders: Order[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OwnerOrderState = {
  pendingOrders: [],
  activeOrders: [],
  isLoading: false,
  error: null,
};

const ownerOrderSlice = createSlice({
  name: 'ownerOrders',
  initialState,
  reducers: {
    orderStatusChanged(
      state,
      action: PayloadAction<{ orderId: string; status: Order['status']; actorRole: string }>
    ) {
      const { orderId, status } = action.payload;

      // Find the order to move/remove
      let orderToMove = state.pendingOrders.find((o) => o.id === orderId);
      if (!orderToMove) {
        orderToMove = state.activeOrders.find((o) => o.id === orderId);
      }

      // Remove from both lists
      state.pendingOrders = state.pendingOrders.filter((o) => o.id !== orderId);
      state.activeOrders = state.activeOrders.filter((o) => o.id !== orderId);

      if (orderToMove) {
        // Update its status
        const updatedOrder = { ...orderToMove, status };
        
        // Add to correct list
        if (status === 'pending_owner') {
          state.pendingOrders.unshift(updatedOrder);
        } else if (OWNER_ACTIVE_STATUSES.includes(status)) {
          state.activeOrders.unshift(updatedOrder);
        }
      }
    },
    ownerOrdersFetched(state, action: PayloadAction<Order[]>) {
      state.pendingOrders = action.payload.filter((o) => o.status === 'pending_owner');
      state.activeOrders = action.payload.filter((o) => OWNER_ACTIVE_STATUSES.includes(o.status));
    },
    orderReceived(state, action: PayloadAction<any>) {
      const o = action.payload;
      const order = normalizeOrder(o);
      if (order.status === 'pending_owner') {
        if (!state.pendingOrders.find((x) => x.id === order.id)) {
          state.pendingOrders.unshift(order);
        }
      }
    },
    deliveryStatusChanged(
      state,
      action: PayloadAction<{ orderId: string; status: string }>
    ) {
      const { orderId, status } = action.payload;
      const order = state.activeOrders.find(o => o.id === orderId) || state.pendingOrders.find(o => o.id === orderId);
      if (order) {
        order.deliveryStatus = status;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Queue
    builder.addCase(fetchOwnerQueueThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchOwnerQueueThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingOrders = action.payload;
    });
    builder.addCase(fetchOwnerQueueThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Active
    builder.addCase(fetchOwnerActiveThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchOwnerActiveThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeOrders = action.payload;
    });
    builder.addCase(fetchOwnerActiveThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  }
});

export const { orderStatusChanged, ownerOrdersFetched, orderReceived, deliveryStatusChanged } = ownerOrderSlice.actions;
export default ownerOrderSlice.reducer;
