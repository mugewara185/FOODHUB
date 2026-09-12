import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Restaurant, FoodItem, Order, Review } from '../../../core/types/food';
import { ownerMockApi } from '../api/ownerMockApi';

interface OwnerState {
  restaurant: Restaurant | null;
  menu: FoodItem[];
  orders: Order[];
  reviews: Review[];
  analytics: {
    todayRevenue: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    outOfStock: number;
    averageRating: number;
    reviewCount: number;
    activeItems: number;
  } | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: OwnerState = {
  restaurant: null,
  menu: [],
  orders: [],
  reviews: [],
  analytics: null,
  status: 'idle',
  error: null,
};

export const fetchOwnerData = createAsyncThunk('owner/fetchAll', async () => {
  const [restaurant, menu, orders, reviews, analytics] = await Promise.all([
    ownerMockApi.getRestaurant(),
    ownerMockApi.getMenu(),
    ownerMockApi.getOrders(),
    ownerMockApi.getReviews(),
    ownerMockApi.getAnalytics(),
  ]);
  return { restaurant, menu, orders, reviews, analytics };
});

export const updateRestaurantStatus = createAsyncThunk(
  'owner/updateRestaurantStatus',
  async (isOpen: boolean) => {
    return await ownerMockApi.updateRestaurantStatus(isOpen);
  }
);

export const updateOrderStatus = createAsyncThunk(
  'owner/updateOrderStatus',
  async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
    return await ownerMockApi.updateOrderStatus(orderId, status);
  }
);

export const updateMenuItemAvailability = createAsyncThunk(
  'owner/updateMenuItemAvailability',
  async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
    return await ownerMockApi.updateMenuItemAvailability(itemId, isAvailable);
  }
);

const ownerSlice = createSlice({
  name: 'owner',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOwnerData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.restaurant = action.payload.restaurant;
        state.menu = action.payload.menu;
        state.orders = action.payload.orders;
        state.reviews = action.payload.reviews;
        state.analytics = action.payload.analytics;
      })
      .addCase(fetchOwnerData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load owner data';
      })
      .addCase(updateRestaurantStatus.fulfilled, (state, action) => {
        state.restaurant = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateMenuItemAvailability.fulfilled, (state, action) => {
        const index = state.menu.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.menu[index] = action.payload;
        }
      });
  },
});

export default ownerSlice.reducer;
