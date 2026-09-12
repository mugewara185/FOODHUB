import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export type PartnerStatus = 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY';

export interface DeliveryAssignment {
  id: string; // matches order ID
  restaurant: string;
  restaurantImage: string;
  customer: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  pickupAddress: string;
  dropAddress: string;
  distance: string;
  estimatedTime: string;
  amount: number;
  status: 'assigned' | 'accepted' | 'arrived_pickup' | 'picked_up' | 'out_for_delivery' | 'delivered';
  items: { name: string; quantity: number }[];
}

export interface DeliveryPartnerState {
  status: PartnerStatus;
  isOnline: boolean;
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
    id: 'ORD-2024-001',
    restaurant: 'Spice Garden',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
    customer: 'John Doe',
    pickupLocation: { lat: 19.076, lng: 72.8777 },
    dropoffLocation: { lat: 19.080, lng: 72.880 },
    pickupAddress: '123 Park Avenue, Andheri East',
    dropAddress: '456 Main Street, Andheri West',
    distance: '3.2 km',
    estimatedTime: '15 min',
    amount: 89,
    status: 'assigned',
    items: [
      { name: 'Butter Chicken', quantity: 1 },
      { name: 'Garlic Naan', quantity: 2 },
    ],
  },
];

const initialState: DeliveryPartnerState = {
  status: 'OFFLINE',
  isOnline: false,
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

export const deliveryPartnerSlice = createSlice({
  name: 'deliveryPartner',
  initialState,
  reducers: {
    toggleOnlineStatus: (state) => {
      state.isOnline = !state.isOnline;
      state.status = state.isOnline ? 'ONLINE' : 'OFFLINE';
      if (state.isOnline && state.availableAssignments.length === 0 && !state.activeAssignment) {
        state.availableAssignments = mockAssignments; // load mock assignments
      } else if (!state.isOnline) {
        state.availableAssignments = [];
      }
    },
    acceptAssignment: (state, action: PayloadAction<string>) => {
      const idx = state.availableAssignments.findIndex(a => a.id === action.payload);
      if (idx !== -1) {
        const assignment = state.availableAssignments[idx];
        assignment.status = 'accepted';
        state.activeAssignment = assignment;
        state.availableAssignments.splice(idx, 1);
        state.status = 'ON_DELIVERY';
      }
    },
    rejectAssignment: (state, action: PayloadAction<string>) => {
      state.availableAssignments = state.availableAssignments.filter(a => a.id !== action.payload);
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
export const selectActiveAssignment = (state: RootState) => state.deliveryPartner.activeAssignment;
export const selectAvailableAssignments = (state: RootState) => state.deliveryPartner.availableAssignments;
export const selectPartnerLocation = (state: RootState) => state.deliveryPartner.currentLocation;
export const selectPartnerStats = (state: RootState) => state.deliveryPartner.stats;
export const selectDeliveryHistory = (state: RootState) => state.deliveryPartner.history;

export default deliveryPartnerSlice.reducer;
