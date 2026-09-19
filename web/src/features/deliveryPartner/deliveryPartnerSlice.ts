import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
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

const initialState: DeliveryPartnerState = {
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

// ─────────────────────────────────────────────────────────────────────────
// THUNKS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fetches the partner's current state from the backend.
 * Replaces the old fetchActiveAssignmentThunk which just returned null.
 */
export const fetchPartnerStateThunk = createAsyncThunk(
  'deliveryPartner/fetchPartnerState',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/delivery/partner/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch partner state');
      }
      return data.data;
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
      const response = await fetch('http://localhost:5000/api/delivery/partner/me/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: shouldBeOnline ? 'available' : 'offline' }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update status');
      }
      return data.data;
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
      const response = await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update delivery status');
      }
      return { deliveryId, status, delivery: data.data };
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
      const response = await fetch(`http://localhost:5000/api/delivery/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to accept delivery');
      }
      return data.data;
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
      const response = await fetch(`http://localhost:5000/api/delivery/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to decline delivery');
      }
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

    deliveryAssignedReceived: (state, action: PayloadAction<DeliveryAssignment>) => {
      state.activeAssignment = action.payload;
      state.status = 'ON_DELIVERY';
    },

    deliveryStatusChangedReceived: (
      state,
      action: PayloadAction<{ deliveryId: string; status: DeliveryAssignment['status'] }>
    ) => {
      if (state.activeAssignment && state.activeAssignment.deliveryId === action.payload.deliveryId) {
        state.activeAssignment.status = action.payload.status;

        if (action.payload.status === 'delivered') {
          state.history.unshift(state.activeAssignment);
          state.stats.todayDeliveries += 1;
          state.stats.todayEarnings += state.activeAssignment.amount;
          state.stats.weeklyEarnings += state.activeAssignment.amount;
          state.stats.totalEarnings += state.activeAssignment.amount;

          state.activeAssignment = null;
          state.status = state.isOnline ? 'ONLINE' : 'OFFLINE';
        }
      }
    },

    partnerLocationReceived: (state, action: PayloadAction<{ lat: number; lng: number }>) => {
      state.currentLocation = action.payload;
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
      const p = action.payload ?? {};
      if (p.status) state.status = p.status === 'available' ? 'ONLINE' : p.status === 'on_delivery' ? 'ON_DELIVERY' : 'OFFLINE';
      if (typeof p.isOnline === 'boolean') state.isOnline = p.isOnline;
      if (p.currentLocation) state.currentLocation = p.currentLocation;
      if (p.activeAssignment !== undefined) state.activeAssignment = p.activeAssignment;
      if (Array.isArray(p.availableAssignments)) state.availableAssignments = p.availableAssignments;
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
      const p = action.payload ?? {};
      const serverStatus = p.status ?? (p.isOnline ? 'available' : 'offline');
      state.isOnline = serverStatus === 'available' || serverStatus === 'on_delivery';
      state.status =
        serverStatus === 'on_delivery' ? 'ON_DELIVERY'
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
      const { status, delivery } = action.payload;
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
        state.currentLocation = delivery.currentLocation;
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
      // Remove from available list
      state.availableAssignments = state.availableAssignments.filter(
        (a) => a.orderId !== action.meta.arg.orderId
      );
      // Active assignment is set by the socket event (deliveryAssignedReceived).
      // Do not set it here — the backend is authoritative.
    });
    builder.addCase(acceptAssignmentThunk.rejected, (state) => {
      state.isLoading = false;
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