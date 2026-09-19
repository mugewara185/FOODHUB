import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { DeliveryAssignment } from '../../core/types/delivery';
import { showToast } from '../ui/uiSlice';

export type PartnerStatus = 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY';

export interface DeliveryPartnerState {
  status: PartnerStatus;
  isOnline: boolean;
  isLoading: boolean;
  currentLocation: { lat: number; lng: number } | null;
  activeAssignment: DeliveryAssignment | null;
  availableAssignments: DeliveryAssignment[];
  history: DeliveryAssignment[];
  stats: {
    todayDeliveries: number;
    todayEarnings: number;
    onlineHours: number;
    avgRating: number;
    acceptanceRate: number;
    weeklyEarnings: number;
    totalEarnings: number;
  };
}

const mockAssignments: DeliveryAssignment[] = [
  {
    deliveryId: 'DEL-2024-001',
    orderId: 'ORD-2024-001',
    restaurant: 'Spice Garden',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
    customer: 'John Doe',
    status: 'pending',
    pickupLocation: { lat: 19.0760, lng: 72.8777 },
    dropoffLocation: { lat: 19.0500, lng: 72.9000 },
    amount: 120,
    distance: 4.5,
    estimatedTime: 25,
    items: [{ name: 'Butter Chicken', quantity: 1 }, { name: 'Naan', quantity: 2 }]
  },
  {
    deliveryId: 'DEL-2024-002',
    orderId: 'ORD-2024-002',
    restaurant: 'Burger Hub',
    restaurantImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
    customer: 'Jane Smith',
    status: 'pending',
    pickupLocation: { lat: 19.0800, lng: 72.8800 },
    dropoffLocation: { lat: 19.0600, lng: 72.8900 },
    amount: 85,
    distance: 2.1,
    estimatedTime: 15,
    items: [{ name: 'Classic Burger', quantity: 2 }]
  }
];

const initialState: DeliveryPartnerState = {
  status: 'OFFLINE',
  isOnline: false,
  isLoading: true, // initial fetch assumed
  currentLocation: { lat: 19.0760, lng: 72.8777 },
  activeAssignment: null,
  availableAssignments: [],
  history: [],
  stats: {
    todayDeliveries: 4,
    todayEarnings: 450,
    onlineHours: 3.5,
    avgRating: 4.8,
    acceptanceRate: 95,
    weeklyEarnings: 2100,
    totalEarnings: 15400,
  }
};

// Simulated mock fetch to toggle loading state manually if needed, or just set it
export const fetchActiveAssignmentThunk = createAsyncThunk(
  'deliveryPartner/fetchActiveAssignment',
  async (_, { rejectWithValue }) => {
    // Mock network delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    return null; // Simulate returning no active assignment on load for now
  }
);

export const setOnlineStatusThunk = createAsyncThunk(
  'deliveryPartner/setOnlineStatus',
  async (status: boolean, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const partnerId = state.auth.user?.id;
      
      if (!partnerId) {
        dispatch(showToast({ message: 'User not authenticated or missing ID', type: 'error' }));
        return rejectWithValue('User not authenticated');
      }

      const response = await fetch(`http://localhost:5000/api/delivery/partner/${partnerId}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // simple mock
        },
        body: JSON.stringify({ status: status ? 'available' : 'offline' })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      return status;
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to update status', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

export const updateAssignmentStatusThunk = createAsyncThunk(
  'deliveryPartner/updateAssignmentStatusThunk',
  async ({ deliveryId, status }: { deliveryId: string, status: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update delivery status');
      }
      return { deliveryId, status };
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to update delivery status', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

const deliveryPartnerSlice = createSlice({
  name: 'deliveryPartner',
  initialState,
  reducers: {
    toggleOnlineStatus: (state) => {
      // Legacy UI fallback, now mostly replaced by thunk
      state.isOnline = !state.isOnline;
      state.status = state.isOnline ? 'ONLINE' : 'OFFLINE';
      if (state.isOnline && state.availableAssignments.length === 0 && !state.activeAssignment) {
        state.availableAssignments = mockAssignments; 
      } else if (!state.isOnline) {
        state.availableAssignments = [];
      }
    },
    acceptAssignment: (state, action: PayloadAction<string>) => {
      const idx = state.availableAssignments.findIndex(a => a.orderId === action.payload);
      if (idx !== -1) {
        const assignment = state.availableAssignments[idx];
        assignment.status = 'accepted';
        state.activeAssignment = assignment;
        state.availableAssignments.splice(idx, 1);
        state.status = 'ON_DELIVERY';
      }
    },
    rejectAssignment: (state, action: PayloadAction<string>) => {
      state.availableAssignments = state.availableAssignments.filter(a => a.orderId !== action.payload);
    },
    updateAssignmentStatus: (state, action: PayloadAction<DeliveryAssignment['status']>) => {
      if (state.activeAssignment) {
        state.activeAssignment.status = action.payload;
        if (action.payload === 'delivered') {
          state.history.unshift(state.activeAssignment);
          state.activeAssignment = null;
          state.status = 'ONLINE'; // back to online
          state.stats.todayDeliveries += 1;
          state.stats.todayEarnings += state.history[0].amount;
          state.stats.weeklyEarnings += state.history[0].amount;
          state.stats.totalEarnings += state.history[0].amount;
        }
      }
    },
    updateLocation: (state, action: PayloadAction<{ lat: number, lng: number }>) => {
      state.currentLocation = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchActiveAssignmentThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchActiveAssignmentThunk.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(fetchActiveAssignmentThunk.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(setOnlineStatusThunk.fulfilled, (state, action) => {
      state.isOnline = action.payload;
      state.status = action.payload ? 'ONLINE' : 'OFFLINE';
      if (state.isOnline && state.availableAssignments.length === 0 && !state.activeAssignment) {
        state.availableAssignments = mockAssignments; 
      } else if (!state.isOnline) {
        state.availableAssignments = [];
      }
    });
    // Removed native alerts from .rejected cases
  }
});

export const {
  toggleOnlineStatus,
  acceptAssignment,
  rejectAssignment,
  updateAssignmentStatus,
  updateLocation
} = deliveryPartnerSlice.actions;

export const selectPartnerStatus = (state: RootState) => state.deliveryPartner.status;
export const selectIsPartnerOnline = (state: RootState) => state.deliveryPartner.isOnline;
export const selectIsLoading = (state: RootState) => state.deliveryPartner.isLoading;
export const selectActiveAssignment = (state: RootState) => state.deliveryPartner.activeAssignment;
export const selectAvailableAssignments = (state: RootState) => state.deliveryPartner.availableAssignments;
export const selectPartnerLocation = (state: RootState) => state.deliveryPartner.currentLocation;
export const selectPartnerStats = (state: RootState) => state.deliveryPartner.stats;
export const selectDeliveryHistory = (state: RootState) => state.deliveryPartner.history;

export default deliveryPartnerSlice.reducer;
