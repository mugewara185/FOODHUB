import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Order } from '../../core/types/food';
import { fetchOwnerQueueThunk, fetchOwnerActiveThunk } from './ownerOrderApi';

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
        } else if (status === 'confirmed' || status === 'preparing') {
          state.activeOrders.unshift(updatedOrder);
        }
      }
    },
    ownerOrdersFetched(state, action: PayloadAction<Order[]>) {
      state.pendingOrders = action.payload.filter((o) => o.status === 'pending_owner');
      state.activeOrders = action.payload.filter((o) => o.status === 'confirmed' || o.status === 'preparing');
    },
    orderReceived(state, action: PayloadAction<any>) {
      const payload = action.payload;
      // We normalize manually here if it's raw, but socket might give us somewhat raw format. 
      // The socket sends: orderId, status, restaurantId, restaurantName, items, totalAmount, createdAt
      // Let's just build a minimal Order out of it for the UI
      if (payload.status === 'pending_owner') {
        // avoid duplicates
        if (!state.pendingOrders.find(o => o.id === payload.orderId)) {
          state.pendingOrders.unshift({
            id: payload.orderId,
            userId: '', // not strictly needed for owner UI
            restaurantId: payload.restaurantId,
            restaurantName: payload.restaurantName,
            items: payload.items.map((i: any) => ({
              menuItemId: i.menuItemId,
              name: i.name,
              price: i.price,
              quantity: i.quantity
            })),
            total: payload.totalAmount,
            status: payload.status,
            paymentMethod: 'cod', // fallback
            paymentStatus: 'pending',
            deliveryAddress: { id: '', name: '', phone: '', street: '', city: '', state: '', zipCode: '', isDefault: false, type: 'other' },
            createdAt: payload.createdAt || new Date().toISOString(),
            estimatedDelivery: '',
          } as Order);
        }
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

export const { orderStatusChanged, ownerOrdersFetched, orderReceived } = ownerOrderSlice.actions;
export default ownerOrderSlice.reducer;
