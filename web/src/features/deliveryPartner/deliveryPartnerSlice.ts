import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { DeliveryAssignment } from '../../core/types/delivery';
import { showToast } from '../ui/uiSlice';
import api from '../../core/utils/api';

export type PartnerStatus = 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY';

export interface DeliveryPartnerState {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  completedDeliveries: number;
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

const initialState: DeliveryPartnerState = {
  name: '',
  phone: '',
  vehicle: '',
  rating: 5.0,
  completedDeliveries: 0,
  status: 'OFFLINE',
  isOnline: false,
  isLoading: false,               // no longer defaults to true; fetch is opt-in
  currentLocation: null,          // set by GPS simulator or socket
  activeAssignment: null,
  availableAssignments: [],
  history: [],
  stats: {
    todayDeliveries: 0,
    todayEarnings: 0,
    onlineHours: 0,
    avgRating: 0,
    acceptanceRate: 0,
    weeklyEarnings: 0,
    totalEarnings: 0,
  },
};

// ============================================================================
// THUNKS
// ============================================================================

/**
 * Fetches the partner's current state from the backend.
 * Replaces the old fetchActiveAssignmentThunk which just returned null.
 */
export const fetchPartnerStateThunk = createAsyncThunk(
  'deliveryPartner/fetchPartnerState',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('delivery/partner/me');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Toggles partner availability. Uses /partner/me/status with userId from JWT.
 * No partner ID in URL — the backend resolves the partner from the session.
 */
export const setOnlineStatusThunk = createAsyncThunk(
  'deliveryPartner/setOnlineStatus',
  async (shouldBeOnline: boolean, { dispatch, rejectWithValue }) => {
    try {
      const data = await api.patch('delivery/partner/me/status', { status: shouldBeOnline ? 'available' : 'offline' });
      return data;
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to update status', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Updates an active delivery's status. Backend validates the transition.
 */
export const updateAssignmentStatusThunk = createAsyncThunk(
  'deliveryPartner/updateAssignmentStatus',
  async (
    { deliveryId, status }: { deliveryId: string; status: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const data = await api.patch(`delivery/${deliveryId}/status`, { status });
      return { deliveryId, status, delivery: data };
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to update delivery status', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);
/**
 * Accept an available delivery.
 * For now, this calls the backend accept endpoint. If the backend doesn't
 * have it yet, the thunk fails cleanly and shows a toast.
 *
 * TODO: Replace the placeholder URL with the real endpoint once the
 * assignment vertical is built.
 */
export const acceptAssignmentThunk = createAsyncThunk(
  'deliveryPartner/acceptAssignment',
  async (
    { orderId }: { orderId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const data = await api.post(`delivery/partner/${orderId}/accept`);
      return data;
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to accept delivery', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Decline an available delivery.
 */
export const rejectAssignmentThunk = createAsyncThunk(
  'deliveryPartner/rejectAssignment',
  async (
    { orderId }: { orderId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await api.post(`delivery/partner/${orderId}/reject`);
      return { orderId };
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to decline delivery', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);
// ─────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────

const deliveryPartnerSlice = createSlice({
  name: 'deliveryPartner',
  initialState,
  reducers: {
    /**
     * Server-projected updates via socket.
     * These should be dispatched by useDeliverySocket when delivery events arrive.
     * They do NOT mutate authoritative state — they mirror what the backend sends.
     */
    partnerStateUpdated: (state, action: PayloadAction<Partial<DeliveryPartnerState>>) => {
      Object.assign(state, action.payload);
    },

    setActiveAssignment: (state, action: PayloadAction<DeliveryAssignment | null>) => {
      state.activeAssignment = action.payload;
      state.status = action.payload ? 'ON_DELIVERY' : (state.isOnline ? 'ONLINE' : 'OFFLINE');
    },

    // ── Socket-projected events ──────────────────────────────────────────

    assignmentBroadcastReceived: (state, action: PayloadAction<any>) => {
      const exists = state.availableAssignments.some(a => a.orderId === action.payload.orderId);
      if (!exists) {
        // Map backend payload to frontend expected model
        const p = action.payload;
        state.availableAssignments.push({
          deliveryId: p.orderId, // Fake delivery ID until accepted
          orderId: p.orderId,
          restaurant: p.restaurantName || 'Restaurant',
          restaurantImage: '',
          customer: p.customerName || 'Customer',
          pickupLocation: { lat: 0, lng: 0 },
          dropoffLocation: { lat: 0, lng: 0 },
          pickupAddress: p.restaurantAddress || 'Restaurant Address',
          dropAddress: typeof p.deliveryAddress === 'string' ? p.deliveryAddress : (p.deliveryAddress?.street || 'Delivery Address'),
          distance: '3 km',
          estimatedTime: '15 mins',
          amount: p.totalAmount || 0,
          priority: 'medium',
          status: 'partner_assigned',
          items: p.items || []
        });
      }
    },

    assignmentAccepted: (state, action: PayloadAction<DeliveryAssignment>) => {
      state.activeAssignment = action.payload;
      state.status = 'ON_DELIVERY';
      state.availableAssignments = state.availableAssignments.filter(a => a.orderId !== action.payload.orderId);
    },

    deliveryAssignedReceived: (state, action: PayloadAction<DeliveryAssignment>) => {
      state.activeAssignment = action.payload;
      state.status = 'ON_DELIVERY';
    },

    deliveryStatusChangedReceived: (
      state,
      action: PayloadAction<{ deliveryId: string; status: DeliveryAssignment['status'] }>
    ) => {
      if (
        state.activeAssignment &&
        (String(state.activeAssignment.deliveryId) === String(action.payload.deliveryId) ||
         String(state.activeAssignment.orderId) === String(action.payload.deliveryId))
      ) {
        state.activeAssignment.status = action.payload.status;

        if (action.payload.status === 'delivered') {
          state.history.unshift(state.activeAssignment);
          state.stats.todayDeliveries += 1;
          state.stats.todayEarnings += state.activeAssignment.amount || 0;
          state.stats.weeklyEarnings += state.activeAssignment.amount || 0;
          state.stats.totalEarnings += state.activeAssignment.amount || 0;
          state.status = state.isOnline ? 'ONLINE' : 'OFFLINE';
        }
      }
    },

    partnerLocationReceived: (
      state,
      action: PayloadAction<
        | { lat: number; lng: number; etaSeconds?: number; distanceRemainingMeters?: number; status?: DeliveryAssignment['status'] }
        | { location: { lat: number; lng: number }; etaSeconds?: number; distanceRemainingMeters?: number; status?: DeliveryAssignment['status'] }
      >
    ) => {
      const payload = action.payload as any;
      const loc = payload.location && typeof payload.location.lat === 'number'
        ? { lat: payload.location.lat, lng: payload.location.lng }
        : { lat: payload.lat, lng: payload.lng };
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        state.currentLocation = loc;
        if (state.activeAssignment) {
          state.activeAssignment.currentLocation = loc;
          if (typeof payload.etaSeconds === 'number') {
            state.activeAssignment.etaSeconds = payload.etaSeconds;
            if (payload.etaSeconds > 0) {
              state.activeAssignment.estimatedTime = `${Math.max(1, Math.ceil(payload.etaSeconds / 60))} mins`;
            }
          }
          if (typeof payload.distanceRemainingMeters === 'number') {
            state.activeAssignment.distanceRemainingMeters = payload.distanceRemainingMeters;
            state.activeAssignment.distance = `${(payload.distanceRemainingMeters / 1000).toFixed(1)} km`;
          }
          if (payload.status && payload.status !== state.activeAssignment.status) {
            state.activeAssignment.status = payload.status;
          }
        }
      }
    },

    /**
     * Dev-only: allow UI to seed available assignments for local testing.
     * Do NOT use this in production paths.
     */
    seedAvailableAssignments: (state, action: PayloadAction<DeliveryAssignment[]>) => {
      state.availableAssignments = action.payload;
    },
  },

  extraReducers: (builder) => {
    // fetchPartnerStateThunk
    builder.addCase(fetchPartnerStateThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchPartnerStateThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      const p = (action.payload && typeof action.payload === 'object' && 'data' in action.payload && action.payload.data)
        ? action.payload.data
        : (action.payload ?? {});
      if (p.name) state.name = p.name;
      if (p.phone) state.phone = p.phone;
      if (p.vehicle) state.vehicle = p.vehicle;
      if (typeof p.rating === 'number') state.rating = p.rating;
      if (typeof p.completedDeliveries === 'number') state.completedDeliveries = p.completedDeliveries;
      
      if (p.status) {
        state.status = p.status === 'available'
          ? 'ONLINE'
          : (p.status === 'on_delivery' || p.status === 'assigned')
          ? 'ON_DELIVERY'
          : 'OFFLINE';
      }
      if (typeof p.isOnline === 'boolean') state.isOnline = p.isOnline;
      if (p.activeAssignment !== undefined) {
        state.activeAssignment = p.activeAssignment;
        if (p.activeAssignment) {
          state.status = 'ON_DELIVERY';
        }
      }
      if (p.currentLocation && (p.currentLocation.lat !== 0 || p.currentLocation.lng !== 0)) {
        state.currentLocation = p.currentLocation;
      } else if (
        p.activeAssignment?.currentLocation &&
        (p.activeAssignment.currentLocation.lat !== 0 || p.activeAssignment.currentLocation.lng !== 0)
      ) {
        state.currentLocation = p.activeAssignment.currentLocation;
      }
      if (Array.isArray(p.availableAssignments)) {
        state.availableAssignments = p.availableAssignments.map((ap: any) => ({
          deliveryId: ap.orderId,
          orderId: ap.orderId,
          restaurant: ap.restaurantName || 'Restaurant',
          restaurantImage: '',
          customer: ap.customerName || 'Customer',
          pickupLocation: ap.pickupLocation || { lat: 0, lng: 0 },
          dropoffLocation: ap.dropoffLocation || { lat: 0, lng: 0 },
          pickupAddress: ap.restaurantAddress || 'Restaurant Address',
          dropAddress: typeof ap.deliveryAddress === 'string' ? ap.deliveryAddress : (ap.deliveryAddress?.street || 'Delivery Address'),
          distance: '3 km',
          estimatedTime: '15 mins',
          amount: ap.totalAmount || 0,
          priority: 'medium',
          status: 'partner_assigned',
          items: ap.items || []
        }));
      }
      if (Array.isArray(p.history)) state.history = p.history;
      if (p.stats) state.stats = { ...state.stats, ...p.stats };
    });
    builder.addCase(fetchPartnerStateThunk.rejected, (state) => {
      state.isLoading = false;
    });

    // setOnlineStatusThunk — server is authoritative
    builder.addCase(setOnlineStatusThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(setOnlineStatusThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      const p = (action.payload && typeof action.payload === 'object' && 'data' in action.payload && action.payload.data)
        ? action.payload.data
        : (action.payload ?? {});
      const serverStatus = p.status ?? (p.isOnline ? 'available' : 'offline');
      state.isOnline = serverStatus === 'available' || serverStatus === 'on_delivery' || serverStatus === 'assigned';
      state.status =
        (serverStatus === 'on_delivery' || serverStatus === 'assigned') ? 'ON_DELIVERY'
        : serverStatus === 'available' ? 'ONLINE'
        : 'OFFLINE';
    });
    builder.addCase(setOnlineStatusThunk.rejected, (state) => {
      state.isLoading = false;
      // Toast was already dispatched in the thunk. State unchanged.
    });

    // updateAssignmentStatusThunk
    builder.addCase(updateAssignmentStatusThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateAssignmentStatusThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      const { status } = action.payload;
      const rawDelivery = action.payload.delivery;
      const delivery = (rawDelivery && typeof rawDelivery === 'object' && 'data' in rawDelivery && rawDelivery.data)
        ? rawDelivery.data
        : rawDelivery;
      if (state.activeAssignment) {
        state.activeAssignment.status = status as DeliveryAssignment['status'];
        if (status === 'delivered') {
          state.history.unshift(state.activeAssignment);
          state.stats.todayDeliveries += 1;
          state.stats.todayEarnings += state.activeAssignment.amount;
          state.stats.weeklyEarnings += state.activeAssignment.amount;
          state.stats.totalEarnings += state.activeAssignment.amount;
          state.activeAssignment = null;
          state.status = state.isOnline ? 'ONLINE' : 'OFFLINE';
        }
      }
      // Backend may return the canonical updated delivery. Trust it if present.
      if (delivery?.currentLocation) {
        const loc = delivery.currentLocation.coordinates
          ? { lat: delivery.currentLocation.coordinates[1], lng: delivery.currentLocation.coordinates[0] }
          : delivery.currentLocation;
        state.currentLocation = loc;
        if (state.activeAssignment) {
          state.activeAssignment.currentLocation = loc;
        }
      }
    });
    builder.addCase(updateAssignmentStatusThunk.rejected, (state) => {
      state.isLoading = false;
      // Toast already dispatched. State unchanged (no optimistic update).
    });
    // acceptAssignmentThunk
    builder.addCase(acceptAssignmentThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(acceptAssignmentThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.status = 'ON_DELIVERY';
      
      const d = (action.payload && typeof action.payload === 'object' && 'data' in action.payload && action.payload.data)
        ? action.payload.data
        : (action.payload || {});
      const orderId = action.meta.arg.orderId;
      const matched = state.availableAssignments.find(a => a.orderId === orderId);

      const extractCoords = (loc: any, fallback: { lat: number; lng: number }) => {
        if (!loc) return fallback;
        if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
          return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
        }
        if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          return { lat: loc.lat, lng: loc.lng };
        }
        return fallback;
      };

      const pickupLoc = extractCoords(d.pickupLocation, matched?.pickupLocation || { lat: 0, lng: 0 });
      const dropoffLoc = extractCoords(d.destinationLocation || d.dropoffLocation, matched?.dropoffLocation || { lat: 0, lng: 0 });
      const currentLoc = extractCoords(d.currentLocation, pickupLoc);

      if (currentLoc.lat !== 0 || currentLoc.lng !== 0) {
        state.currentLocation = currentLoc;
      }

      state.activeAssignment = {
        deliveryId: d._id || d.deliveryId,
        orderId: d.orderId || orderId,
        partnerId: d.partnerId || '',
        restaurant: d.restaurantName || matched?.restaurant || 'Restaurant',
        restaurantImage: '',
        customer: d.customerName || matched?.customer || 'Customer',
        pickupLocation: pickupLoc,
        dropoffLocation: dropoffLoc,
        currentLocation: currentLoc,
        pickupAddress: d.pickupAddress || matched?.pickupAddress || 'Pickup',
        dropAddress: d.dropAddress || matched?.dropAddress || 'Dropoff',
        distance: d.distance || (typeof d.distanceRemainingMeters === 'number' ? `${(d.distanceRemainingMeters / 1000).toFixed(1)} km` : matched?.distance || '2.5 km'),
        estimatedTime: d.estimatedTime || (typeof d.etaSeconds === 'number' && d.etaSeconds > 0 ? `${Math.max(1, Math.ceil(d.etaSeconds / 60))} mins` : matched?.estimatedTime || '15 mins'),
        etaSeconds: d.etaSeconds,
        distanceRemainingMeters: d.distanceRemainingMeters,
        amount: d.amount ?? matched?.amount ?? 0,
        priority: 'medium',
        status: d.status || 'partner_assigned',
        items: Array.isArray(d.items) && d.items.length > 0 ? d.items : (matched?.items || [])
      };

      state.availableAssignments = state.availableAssignments.filter(
        (a) => a.orderId !== orderId
      );
    });
    builder.addCase(acceptAssignmentThunk.rejected, (state, action) => {
      state.isLoading = false;
      const errorMsg = action.payload as string;
      if (errorMsg === 'already_assigned or invalid state' || errorMsg?.includes('already_assigned')) {
        state.availableAssignments = state.availableAssignments.filter(
          (a) => a.orderId !== action.meta.arg.orderId
        );
      }
    });

    // rejectAssignmentThunk
    builder.addCase(rejectAssignmentThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(rejectAssignmentThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.availableAssignments = state.availableAssignments.filter(
        (a) => a.orderId !== action.payload.orderId
      );
    });
    builder.addCase(rejectAssignmentThunk.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export const {
  partnerStateUpdated,
  setActiveAssignment,
  assignmentBroadcastReceived,
  assignmentAccepted,
  deliveryAssignedReceived,
  deliveryStatusChangedReceived,
  partnerLocationReceived,
  seedAvailableAssignments,
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
