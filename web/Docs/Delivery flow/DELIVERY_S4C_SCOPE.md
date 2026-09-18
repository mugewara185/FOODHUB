- Maps to spec sections: §18 (use existing notification system), §19 (notification navigation), §20 (persistence)
- Goal: Delivery-related events surface as real, actionable notifications through the existing notificationSlice + socketService. The notification bell in the AppBar shows real unread counts. Clicking a delivery notification navigates to the relevant order/delivery page.

- In scope:
  1. Inspect existing `web/src/core/notifications/notificationSlice.ts`, existing notification UI components, and `socketService.onNotification()`
  2. Wire delivery socket events (`delivery:assigned`, `delivery:status`) to dispatch notifications into the existing notificationSlice. Do NOT create a new notification slice.
  3. Notifications must include an orderId field (already in AppNotification) so clicking navigates to the right page:
     - Partner notification -> `/partner/active`
     - Customer notification -> `/orders/tracking/:orderId`
     - Admin notification -> `/admin/delivery` (with selected partner if possible)
  4. Replace any hardcoded unread badge (e.g. `<Badge badgeContent={3}>`) with the real count from notificationSlice.
  5. Respect spec §18: do NOT spam notifications for every GPS update. Only notify on meaningful events:
     - `delivery:assigned` (partner + customer)
     - `delivery:status` transitions (customer)
     - `delivery` delivered (customer + admin)
     - `delivery` delayed or partner offline during delivery (admin)
  6. Respect spec §20: keep notification persistence via the existing whitelist. Do NOT persist the deliveryPartner slice.

- Out of scope (do NOT touch):
  - Customer tracking UI logic (S4a — done)
  - Admin fleet UI logic (S4b — done)
  - Partner UI logic (S3 — done)
  - Backend socket emitters (S2 — done)
  - Backend delivery model (S1 — done)
  - Image fallback, favorites, search (S5)
  - New MongoDB collections
  - New notification framework

- Verification:
  - `cd API && npx tsc --noEmit` -> passes
  - `cd web && npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -iE "notification|delivery"` -> must be clean for touched files
  - Runtime proof: a headless test that:
    a. mounts the notification wiring with a mocked socket
    b. emits a `delivery:assigned` S2 event
    c. asserts a notification is added to the store with the correct orderId
    d. emits a `delivery:status` "delivered" event
    e. asserts a second notification with the delivered message
    f. asserts unreadCount increments by 2
    g. asserts clicking the notification target would navigate (or at minimum asserts the notification payload contains the target route)
  - Payloads must use the exact S2 types from `web/src/core/types/socket.events.ts`. No hand-rolled mocks.

- Acceptance:
  1. Delivery events create real notifications in the existing slice.
  2. Notification bell shows real unread counts (no hardcoded 3).
  3. Notifications are actionable: clicking navigates to the right route.
  4. GPS updates do NOT spam notifications (only state changes do).
  5. Persistence via whitelist remains intact; deliveryPartner slice is NOT persisted.
  6. No customer, admin, or partner UI logic was touched.
  7. The notification test covers at least 3 event types and unread count updates.

- Socket ownership & Notifications Wiring:
  - Notifications will be handled by a NEW dedicated hook: `useDeliveryNotifications(role)`. This isolates the transport layer (`useDeliverySocket`) from Redux (`notificationSlice`).
  - Role-filtering mechanism: **Option (a) - Each role registers only for its events.** The `useDeliveryNotifications(role)` hook will conditionally format the notification message and attach the correct `targetPath` based strictly on the `role` parameter passed to it. This keeps role-specific routing safely separated.

- Files you expect to touch:
  `web/src/core/notifications/notificationSlice.ts` (Minor: Add `targetPath?: string` to `AppNotification` type to satisfy verifiable routing).
  `web/src/core/notifications/components/NotificationBell.tsx` (Wire onClick to `targetPath`).
  `web/src/shared/layout/PartnerLayout.tsx` and `AdminLayout.tsx` (Replace hardcoded Badges with `<NotificationBell />`).
  `web/src/core/notifications/hooks/useDeliveryNotifications.ts` (New: the Redux-dispatching hook).
  `web/src/core/notifications/__tests__/deliveryNotifications.test.tsx` (New: notification wiring test).
