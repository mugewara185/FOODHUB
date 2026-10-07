import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { api } from '../utils/api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  orderId?: string;
  status?: string;
  targetPath?: string;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

// Map backend notification to frontend AppNotification
const mapNotification = (n: any): AppNotification => ({
  id: n.id || n._id?.toString(),
  title: n.title,
  message: n.message,
  type: n.type,
  isRead: n.isRead,
  createdAt: n.createdAt,
  orderId: n.orderId?.toString(),
});

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchAll',
  async () => {
    const data = await api.get('/notifications');
    return data.notifications.map(mapNotification);
  }
);

export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string) => {
    const data = await api.patch(`/notifications/${id}/read`);
    return mapNotification(data.notification);
  }
);

export const markAllAsReadThunk = createAsyncThunk<
  void,
  void,
  { state: RootState }
>(
  'notifications/markAllAsRead',
  async (_, { getState, rejectWithValue }) => {
    const previousItems = getState().notifications.items;
    try {
      await api.patch('/notifications/read-all');
    } catch (error: any) {
      return rejectWithValue(previousItems);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Used for incoming socket events which now come fully formed from backend
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      // Avoid duplicates just in case
      if (!state.items.find(n => n.id === action.payload.id)) {
        state.items.unshift(action.payload);
        
        // Limit to 50 notifications
        if (state.items.length > 50) {
          state.items = state.items.slice(0, 50);
        }
        
        state.unreadCount = state.items.filter(n => !n.isRead).length;
      }
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
      state.items = action.payload;
      state.unreadCount = state.items.filter((n: AppNotification) => !n.isRead).length;
    });
    
    // Optimistic UI for mark as read
    builder.addCase(markAsReadThunk.pending, (state, action) => {
      const notification = state.items.find(n => n.id === action.meta.arg);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });
    builder.addCase(markAsReadThunk.rejected, (state, action) => {
      const notification = state.items.find(n => n.id === action.meta.arg);
      if (notification && notification.isRead) {
        notification.isRead = false;
        state.unreadCount += 1;
      }
    });

    // Optimistic UI for mark all as read
    builder.addCase(markAllAsReadThunk.pending, (state) => {
      state.items.forEach(n => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    });
    builder.addCase(markAllAsReadThunk.rejected, (state, action) => {
      if (action.payload) {
        state.items = action.payload as AppNotification[];
        state.unreadCount = state.items.filter(n => !n.isRead).length;
      }
    });
  }
});

export const { addNotification, clearAll } = notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;

export default notificationSlice.reducer;
