# Core Notifications Architecture

## Purpose
Provides a persistent, reusable in-app notification center backed by MongoDB. Notifications survive page refreshes and navigation, acting as an authoritative history of events. Extends the transient Toast notification system.

## Components
- `notificationSlice.ts`: Redux slice managing the list of notifications and unread count. Now enhanced with async thunks to fetch history (`fetchNotificationsThunk`) and mark read status (`markAsReadThunk`, `markAllAsReadThunk`) from the backend API.
- `NotificationBell.tsx`: A reusable UI component rendering the bell icon, unread badge, and the dropdown popover containing the notification history. Dispatches thunks to mutate server state.

## Integration
1. **Backend-Driven**: The backend `NotificationService` handles creating notification documents in MongoDB during authoritative domain transitions (e.g. order status changes) and emits the canonical `notification` Socket.IO event.
2. **Socket.IO**: The global `App.tsx` listens to the `notification` event from the backend socket. It no longer synthesizes notifications from raw domain events (like `order:status_changed`).
3. **Dual-Dispatch**: Upon receiving a notification, the app dispatches both `showToast` (transient UI alert) and `addNotification` (to immediately append to local Redux state for optimistic UI updates).
4. **Hydration**: `App.tsx` dispatches `fetchNotificationsThunk` to hydrate the notification history on load when the user is authenticated.
5. **Reusability**: `NotificationBell` is placed in `MainLayout.tsx` but can be embedded in any Layout (Admin, Owner, Partner) because it is domain-agnostic and relies purely on Redux state.
