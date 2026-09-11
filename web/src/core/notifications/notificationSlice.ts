import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  orderId?: string;
  status?: string;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>>) => {
      const newNotification: AppNotification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      // Add to beginning of array
      state.items.unshift(newNotification);

      // Limit to 50 notifications
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }

      state.unreadCount = state.items.filter(n => !n.isRead).length;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, clearAll } = notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;

export default notificationSlice.reducer;

