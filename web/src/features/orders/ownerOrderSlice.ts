import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Order } from '../../core/types';
import { 
  fetchOwnerQueueThunk, 
  fetchOwnerActiveThunk, 
  acceptOrderThunk, 
  markPreparingThunk, 
  markReadyThunk, 
  confirmHandoffThunk, 
  OWNER_ACTIVE_STATUSES 
} from './ownerOrderApi';
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

function applyStatusChange(state: OwnerOrderState, orderId: string, status: string) {
  let orderToMove = state.pendingOrders.find((o) => o.id === orderId);
  if (!orderToMove) {
    orderToMove = state.activeOrders.find((o) => o.id === orderId);
  }

  state.pendingOrders = state.pendingOrders.filter((o) => o.id !== orderId);
  state.activeOrders = state.activeOrders.filter((o) => o.id !== orderId);

  if (orderToMove) {
    const updatedOrder = { ...orderToMove, status: status as any };
    if (status === 'pending_owner') {
      state.pendingOrders.unshift(updatedOrder);
    } else if (OWNER_ACTIVE_STATUSES.includes(status)) {
      state.activeOrders.unshift(updatedOrder);
    }
  }
}

const ownerOrderSlice = createSlice({
  name: 'ownerOrders',
  initialState,
  reducers: {
    orderStatusChanged(
      state,
      action: PayloadAction<{ orderId: string; status: Order['status']; actorRole?: string }>
    ) {
      applyStatusChange(state, action.payload.orderId, action.payload.status);
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

    // Action thunks optimistic updates
    builder.addCase(acceptOrderThunk.fulfilled, (state, action) => {
      applyStatusChange(state, action.meta.arg, 'confirmed');
    });
    builder.addCase(markPreparingThunk.fulfilled, (state, action) => {
      applyStatusChange(state, action.meta.arg, 'preparing');
    });
    builder.addCase(markReadyThunk.fulfilled, (state, action) => {
      applyStatusChange(state, action.meta.arg, 'ready_for_pickup');
    });
    builder.addCase(confirmHandoffThunk.fulfilled, (state, action) => {
      applyStatusChange(state, action.meta.arg, 'picked_up');
    });
  }
});

export const { orderStatusChanged, ownerOrdersFetched, orderReceived, deliveryStatusChanged } = ownerOrderSlice.actions;
export default ownerOrderSlice.reducer;
