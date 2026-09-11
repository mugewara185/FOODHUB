# Core Notifications Architecture

## Purpose
Provides a persistent, reusable in-app notification center that survives page refreshes and navigation. Extends the transient Toast notification system.

## Components
- `notificationSlice.ts`: Redux slice managing the list of notifications and unread count. Preserved in `localStorage` via `redux-persist` in `Store_V.ts`.
- `NotificationBell.tsx`: A reusable UI component rendering the bell icon, unread badge, and the dropdown popover containing the notification history.

## Integration
1. **Socket.IO**: The global `App.tsx` listens to the `notification` event from the backend socket.
2. **Dual-Dispatch**: Upon receiving a notification, the app dispatches both `showToast` (transient UI alert) and `addNotification` (persistent history).
3. **Reusability**: `NotificationBell` is placed in `MainLayout.tsx` but can be embedded in any Layout (Admin, Owner, Partner) because it is domain-agnostic and relies purely on Redux state.
