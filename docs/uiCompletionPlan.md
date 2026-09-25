# FoodHub — UI Completion Plan
> Generated from commit `0b34297d404b1f68f9c25fcf50423cb0534e2d42` on 2026-09-25

---

## Section 1 — Executive Summary

This plan targets the remaining UI work needed to make FoodHub's four-role MERN app demo-ready for a recruiting audience. It is grounded exclusively in the repository at the commit above. All state assessments are verified against actual component code, slice files, and backend route files — not documentation claims.

**What this plan covers:** Completing pages currently in Mock/Placeholder state so they consume real API data, wiring the existing socket events into the correct Redux actions for each role, fixing a handful of orphaned or broken routes, and refining the shared NotificationBell system without replacing it.

**What this plan explicitly does NOT cover:** Payment flows (no backend module exists), admin CRUD mutations beyond data display, search/filter persistence, i18n, theming/dark-mode, admin `Promotions` / `Reports` pages (they are placeholder shells with no backend data), or the `dev/*` tool routes (dev-only, already guarded by `IS_DEV`).

**Target end-state:** A recruiter opens the deployed URL, opens four tabs — one per role — and can complete the canonical order lifecycle end-to-end: place an order (user), accept/prepare/mark-ready (owner), accept and deliver (partner), and see the fleet live (admin). Every step is backed by real API and socket data. No primary data path goes through `mockOrders`, factory functions, or hard-coded static arrays.

**Key findings from code audit:**

1. `AdminDashboard` (`AdminDashboard.tsx:106`) calls `GET /api/admin/analytics/dashboard` — **real API path** via `analytics.routes.ts`.
2. `AdminOrdersList` (`orders.provider.ts:52`) resolves via `adminOrdersProvider.getAll()` which returns **static mock data** — the biggest gap.
3. `RestaurantsList` (`RestaurantsList.tsx:78`) calls `restaurantApi.getAll()` — **real API path**.
4. `UsersList` (`UsersList.tsx:49`) calls `usersApi.getUsers()` → `GET /users/admin` — **real API path**.
5. `OwnerDashboard` (`DashBoard.tsx:16`) uses `ownerSlice.fetchOwnerData` — comment at line 1 says "Do NOT extend this file," indicating it's a legacy stub.
6. `APP_CONFIG.DATA_SOURCE` defaults to `'mock'` (`app.config.ts:32`) unless `VITE_DATA_SOURCE=api` is set — restaurants and order pages will use factory data unless this env var is set at deploy time. This is the single most critical build-time flag.
7. Partner `DeliveryHistory` and `Earnings` pages read only from `deliveryPartnerSlice` local state; no history endpoint exists in the backend.
8. Owner `Queue` and `Active` pages are **fully real** — they call verified thunks to real endpoints via `ownerOrderApi`.

---

## Section 2 — Portfolio Demo Script

**Setup:** Four browser tabs, each pre-logged-in as a different role. Backend running with `VITE_DATA_SOURCE=api`.

| # | Tab | Action | Expected Visible Result |
|---|-----|--------|------------------------|
| 1 | **User** | Navigate to `/restaurants` | List of real restaurants from DB |
| 2 | **User** | Click a restaurant → add 2 items to cart | Cart badge updates |
| 3 | **User** | Go to `/cart` → `/checkout` → place order | Order confirmation page shows real order ID |
| 4 | **Owner** | Switch to owner tab — `/owner/queue` | New order appears in queue (via socket `order:new`) |
| 5 | **Owner** | Click **Accept** on the order | Order moves to Active; owner notification bell fires |
| 6 | **Owner** | Navigate to `/owner/active` → click **Start Preparing** | Order status → `preparing` |
| 7 | **Owner** | Click **Mark Ready** | Status → `ready_for_pickup`; partner available-orders list updates |
| 8 | **Partner** | Switch to partner tab — `/partner/orders` | Order appears in Available Orders list (via `delivery:available` socket) |
| 9 | **Partner** | Click **Accept** | Navigates to `/partner/active`; delivery map renders |
| 10 | **Partner** | Click **Picked Up** then **Delivered** | Delivery status advances; customer bell fires |
| 11 | **User** | Switch to user tab — `/orders` | Order shows `delivered`; "Leave a Review" button visible |
| 12 | **Admin** | Switch to admin tab — `/admin` | Dashboard charts render real analytics data |
| 13 | **Admin** | Navigate to `/admin/delivery` (Fleet Operations) | Fleet map shows partner(s) with live location pins |
| 14 | **Admin** | Navigate to `/admin/orders` | Orders table shows real DB orders (P0 fix required) |
| 15 | **User** | Click **Leave a Review** on delivered order | Review form submits; star rating saved |

**Acceptance criterion:** All 15 steps succeed without mock data or console errors on any P0 page.

---

## Section 3 — Route Inventory

### Customer / Public routes (under `MainLayout`, role `user`)

| Route | Role | Sidebar Link | Component | Current State | Data Source Today | Runtime Data Path | Target | Priority | Orphaned |
|-------|------|-------------|-----------|--------------|-------------------|-------------------|--------|----------|---------|
| `/` | public | Yes (Home) | `Home/index.tsx` → `Home_V.tsx` | Partial | `restaurantSlice` (mock or API per `DATA_SOURCE`) | `fetchRestaurants` thunk → `restaurantSlice_V.ts:70` → `GET /api/restaurants` or mockRestaurants | Ship | P0 | No |
| `/restaurants` | public | Yes (Drawer) | `restaurantListings/index.tsx` → `Restaurants_V.tsx` | Partial | Same as Home | Same thunk path | Ship | P0 | No |
| `/restaurants/:id` | public | No | `RestaurantDetails` | Partial | `fetchRestaurantById` → `restaurantSlice_V.ts:92` → `GET /api/restaurants/:id` or mock | Same thunk | Ship | P0 | No |
| `/login` | public | Yes (Drawer) | `Login` | Real | `authSlice` → `POST /api/auth/login` | `authSlice` → `authApi` → backend | Ship | P0 | No |
| `/signup` | public | Yes (Drawer) | `Signup` | Real | `authSlice` → `POST /api/auth/register` | Same | Ship | P0 | No |
| `/forgot-password` | public | No | `ForgotPassword` | Real | `POST /api/auth/forgot-password` | Direct fetch | Ship | P1 | No |
| `/reset-password` | public | No | `ResetPassword` | Real | `POST /api/auth/reset-password` | Direct fetch | Ship | P1 | No |
| `/cart` | `user` | Yes (AppBar icon) | `Cart` | Partial | `cartSlice` (persisted localStorage) | Redux persist only — no backend sync | Ship | P0 | No |
| `/checkout` | `user` | No (from cart) | `Checkout` | Partial | `cartSlice` + `createOrderThunk` → `POST /api/orders` | `orderSlice.ts:80` → `orderApi` → backend | Ship | P0 | No |
| `/orders/confirmation` | `user` | No (post-checkout) | `OrderConfirmation` | Partial | `orderSlice.currentOrder` | Local Redux — populated by checkout thunk | Ship | P0 | No |
| `/orders` | `user` | Yes (Drawer) | `Orders.tsx` | Partial | `fetchOrdersThunk` → `GET /api/orders` (api mode) or mock | `orderSlice.ts` → `orderApi` → backend | Ship | P0 | No |
| `/orders/tracking/:id` | `user` | No (from /orders) | `OrderTracking/index.tsx` | Partial | `fetchOrderByIdThunk` + `LiveDeliveryTracker` + socket `delivery:location` | `orderSlice` + socketService | Ship | P0 | No |
| `/favorites` | `user` | Yes (Drawer) | `Favourites` | Mock | `restaurantSlice.favorites` (array of IDs, no list fetch) | No API call for favorites list — toggle endpoint exists only | Ship | P1 | No |
| `/notification` | public | No | `Notifications` | Placeholder | None verified | Not inspected | ComingSoon | P1 | **Yes** |
| `/search` | public | Yes (mobile bottom nav) | `SearchPage` | Placeholder | None verified | Not inspected | ComingSoon | P2 | No |
| `/settings` | public | Yes (Drawer) | `Settings` | Placeholder | None verified | Not inspected | ComingSoon | P2 | No |
| `/profile` | `user` | Yes (AppBar avatar) | `Profile/index.tsx` → versions | Partial | `auth.user` from `authSlice` + `PATCH /api/users/profile` | `authSlice` → `useAuth` | Ship | P1 | No |
| `/history` | public | Yes (Drawer) | `<Navigate to="/orders">` | Real (redirect) | N/A | Router redirect | Ship | P0 | No |
| `/help` | public | Yes (Drawer) | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |

### Owner routes (under `OwnerLayout`, role `owner`)

| Route | Role | Sidebar Link | Component | Current State | Data Source Today | Runtime Data Path | Target | Priority | Orphaned |
|-------|------|-------------|-----------|--------------|-------------------|-------------------|--------|----------|---------|
| `/owner` | `owner` | Yes (Dashboard) | `_ownerPages/DashBoard.tsx` | Mock | `ownerSlice.fetchOwnerData` — comment calls it "pre-existing mock" | `ownerSlice` → unverified endpoint | Ship | P0 | No |
| `/owner/queue` | `owner` | Yes (Orders) | `_owner/Queue.tsx` | **Real** | `fetchOwnerQueueThunk` → `GET /api/orders/owned` filtered to `pending_owner` | `ownerOrderApi` → `ownerOrderSlice` → backend | Ship | P0 | No |
| `/owner/active` | `owner` | No | `_owner/Active.tsx` | **Real** | `fetchOwnerActiveThunk` → `GET /api/orders/owned` filtered to `confirmed/preparing` | Same | Ship | P0 | **Yes** |
| `/owner/settings` | `owner` | Yes | `_ownerPages/Settings` | Placeholder | None | Not inspected | ComingSoon | P2 | No |
| `/owner/menu` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/analytics` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/promotions` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/reviews` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/staff` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/finance` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/profile` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/support` | `owner` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/owner/orders` (redirect) | `owner` | Yes (sidebar label) | `<Navigate to="/owner/queue">` | Real (redirect) | N/A | Router redirect | Ship | P0 | No |

### Partner routes (under `PartnerLayout`, role `partner`)

| Route | Role | Sidebar Link | Component | Current State | Data Source Today | Runtime Data Path | Target | Priority | Orphaned |
|-------|------|-------------|-----------|--------------|-------------------|-------------------|--------|----------|---------|
| `/partner` | `partner` | Yes (Dashboard) | `PartnerDashboard.tsx` | Partial | `deliveryPartnerSlice` populated by `fetchPartnerStateThunk` → `GET /api/delivery/partner/me` | `deliveryPartnerSlice:65` → backend | Ship | P0 | No |
| `/partner/orders` | `partner` | Yes (Available Orders) | `AvailableOrdders.tsx` | Partial | `selectAvailableAssignments` — populated via `delivery:available` socket | Socket → `deliveryPartnerSlice` | Ship | P0 | No |
| `/partner/active` | `partner` | Yes (Active Delivery) | `ActiveDelivery.tsx` | Partial | `selectActiveAssignment` + Map + socket `delivery:location` | `deliveryPartnerSlice` + socketService | Ship | P0 | No |
| `/partner/history` | `partner` | Yes (Delivery History) | `DeliveryHistory.tsx` | Mock | `selectDeliveryHistory` — always `[]`; no backend history endpoint | Local slice — empty | Ship (session-only) | P1 | No |
| `/partner/earnings` | `partner` | Yes | `Earnings.tsx` | Mock | `selectPartnerStats` — slice defaults zero; no backend endpoint | Local slice defaults | Ship (session-only) | P1 | No |
| `/partner/profile` | `partner` | Yes | `_deliveryPartner/Profile.tsx` | Partial | `deliveryPartnerSlice` fields from `fetchPartnerStateThunk` | Same as `/partner` | Ship | P1 | No |
| `/partner/support` | `partner` | Yes | `PartnerSupport.tsx` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/partner/settings` | `partner` | Yes | `_deliveryPartner/Settings.tsx` | Placeholder | None | Static | ComingSoon | P2 | No |

### Admin routes (under `AdminLayout`, role `admin`)

| Route | Role | Sidebar Link | Component | Current State | Data Source Today | Runtime Data Path | Target | Priority | Orphaned |
|-------|------|-------------|-----------|--------------|-------------------|-------------------|--------|----------|---------|
| `/admin` | `admin` | Yes (Dashboard) | `AdminDashboard.tsx` | **Real** | `GET /api/admin/analytics/dashboard` (`AdminDashboard.tsx:106`) | Direct fetch → `analytics.routes.ts` → `analyticsController.getDashboard` | Ship | P0 | No |
| `/admin/orders` | `admin` | Yes | `OrdersList.tsx` | **Mock** | `adminOrdersProvider.getAll()` → 2-row static array (`orders.provider.ts:52`) | Provider → hardcoded mock | Ship | P0 | No |
| `/admin/restaurants` | `admin` | Yes | `RestaurantsList.tsx` | **Real** | `restaurantApi.getAll()` → `GET /api/restaurants` (`RestaurantsList.tsx:78`) | Direct call → backend | Ship | P0 | No |
| `/admin/restaurants/add` | `admin` | Yes (submenu) | `AddRestaurant` | Partial | Needs inspection | Not fully verified | Ship | P1 | No |
| `/admin/menu` | `admin` | Yes | `AdminMenu` | Placeholder | Needs inspection | Not fully verified | ComingSoon | P2 | No |
| `/admin/users` | `admin` | Yes | `UsersList.tsx` | **Real** | `usersApi.getUsers()` → `GET /api/users/admin` (`UsersList.tsx:49`) | Direct call → backend | Ship | P0 | No |
| `/admin/promotions` | `admin` | Yes | `Promotions` (Coupons) | Placeholder | None verified | Static | ComingSoon | P2 | No |
| `/admin/reports` | `admin` | Yes | `Analytics.tsx` | Placeholder | None verified | Static | ComingSoon | P2 | No |
| `/admin/ai` | `admin` | Yes (AI Insights) | `AdminAIPage.tsx` | **Real** | `sendAIMessage` → `POST /api/ai/...` (`AdminAIPage.tsx:37`) | `adminAiApi` → backend `ai.routes.ts` | Ship | P0 | No |
| `/admin/ai/investigations/:id` | `admin` | No | `InvestigationPage` | Partial | `adminAiSlice` | `adminAiSlice` | Ship | P1 | **Yes** |
| `/admin/delivery` | `admin` | No | `AdminDeliveryDashboard` | **Real** | `useAdminFleet` → `GET /api/delivery/fleet` | Hook → fleet endpoint → `delivery.routes.ts` | Ship | P0 | **Yes** |
| `/admin/profile` | `admin` | No (header avatar menu) | `AdminProfile` | Partial | `auth.user` | `useAuth` | Ship | P1 | No |
| `/admin/settings` | `admin` | Yes | `AdminSettings` | Placeholder | None | Static | ComingSoon | P2 | No |
| `/admin/payments` | `admin` | Yes | `ComingSoon` | Placeholder | None | Static | ComingSoon | P2 | No |

---

## Section 4 — Redux Store Plan

### Current Slice Inventory (`Store_V.ts:34-46`)

| Slice key | Reducer file | Purpose | Socket-driven? | Issues |
|-----------|-------------|---------|---------------|--------|
| `auth` | `authSlice` | JWT, user identity | No | Clean |
| `cart` | `cartSlice` | Cart items (persisted) | No | Clean; no backend sync |
| `restaurants` | `restaurantSlice_V` | Restaurant list + selected + filters | No | Defaults to mock unless `VITE_DATA_SOURCE=api` |
| `ui` | `uiSlice` | Toast, global search hidden flag | No | Clean |
| `orders` | `orderSlice` | Customer order history + current order | Partial (`order_status_update` in `App.tsx:65`) | Socket updates `currentOrder` only; `items[]` list NOT updated live |
| `notifications` | `notificationSlice` | Persistent bell items (50 max) | Yes (via `useDeliveryNotifications`) | Works; deduplication gap on reconnect |
| `owner` | `ownerSlice` | Legacy owner dashboard data | No | "Pre-existing mock — do NOT extend" (`DashBoard.tsx:1`) |
| `deliveryPartner` | `deliveryPartnerSlice` | Partner state, active assignment, history, stats | Yes (via `useDeliverySocket`) | `history[]` and `stats` never populated from backend |
| `adminAi` | `adminAiSlice` | AI chat conversation | No | Clean |
| `ownerOrders` | `ownerOrderSlice` | Owner's pending + active orders | Yes (`useOwnerSocket`) | Real and working |
| `ownerRestaurant` | `ownerRestaurantSlice` | Owner's restaurant data | No | Populated by `fetchOwnerRestaurantThunk` → `GET /api/restaurants/mine` |

### Target State Changes (no new slices — Rule 4)

| Slice | Gap | Fix |
|-------|-----|-----|
| `orders` | `updateOrderStatusLocally` updates `currentOrder` only; `items[]` stale after socket push | Update reducer to find-and-update matching item in `items[]` |
| `deliveryPartner` | `history[]` never fetched from backend | Push completed deliveries into `history[]` client-side on `delivered` event |
| `restaurants` | Defaults to `mock` | Set `VITE_DATA_SOURCE=api` in deployment — code already supports it |

---

## Section 5 — Socket Event → Slice Binding Map

Backend socket emitters verified via `grep emit(` across `API/src`:

| Socket Event | Emitted by (backend file:line) | Consumers (frontend) | Gap? |
|-------------|-------------------------------|----------------------|------|
| `order:new` | `order.controller.ts:66` | `useOwnerSocket` → `ownerOrderSlice.orderReceived` | None ✓ |
| `order:status_changed` | `order.service.ts:71,79,85` | `useDeliveryNotifications.ts:119` → `notificationSlice.addNotification` | **Gap:** customer `items[]` in `orderSlice` not updated |
| `order_status_update` | `order.controller.ts:153`, `order.service.ts:67`, `delivery.simulator.ts:127` | `App.tsx:65` → `orderSlice.updateOrderStatusLocally` | Partial — updates `currentOrder` not `items[]` |
| `delivery:assigned` | `delivery.events.ts:49,50,52,55` | `useDeliverySocket` → `deliveryPartnerSlice.assignmentReceived` + `useDeliveryNotifications` | None ✓ |
| `delivery:status` | `delivery.events.ts:37,38,40` | `useDeliverySocket` → `deliveryPartnerSlice.updateAssignmentStatus` | **Gap:** customer handler fires only on `delivered`; `picking_up`/`on_delivery` silently dropped |
| `delivery:location` | `delivery.events.ts:61,62`, `delivery.simulator.ts:119,120` | `LiveDeliveryTracker` via `socketService` | Needs verification |
| `delivery:available` | `delivery.events.ts:81` | `useDeliveryAvailable` → `deliveryPartnerSlice.assignmentAvailable` | None ✓ (mounted in `PartnerLayout.tsx:61`) |
| `delivery:released` | `delivery.events.ts:72,73` | **No consumer found** | **Gap** |
| `delivery:risk` | `risk.engine.ts:73` | **No consumer found** | Gap — admin_fleet should surface this |
| `delivery:risk_cleared` | `risk.engine.ts:79` | **No consumer found** | Gap |
| `notification` | `order.controller.ts:154`, `delivery.simulator.ts:131` | `App.tsx:60` → `showToast` only | **Gap:** `addNotification` NOT dispatched here — bell misses these events |

---

## Section 6 — Backend Endpoint Gaps

| Page needing Ship status | New endpoint needed? | Method | Path | Note |
|--------------------------|----------------------|--------|------|------|
| `/admin/orders` | **No** | `GET` | `/api/orders/owned` | Endpoint exists, authorizes `admin`. Fix: replace `adminOrdersProvider` with a real fetch |
| `/partner/history` | No (acceptable) | — | — | Session-only history is portfolio-sufficient |
| `/partner/earnings` | No (acceptable) | — | — | Derived from session history |

No new backend endpoints are required for any P0 session.

---

## Section 7 — Notification Bell Refinement

**Investigation findings** (file:line verified):

1. **Events generating notifications:**
   - `delivery:assigned` → all four roles via `useDeliveryNotifications.ts:14-44`
   - `delivery:status` (delivered) → customer + admin via `useDeliveryNotifications.ts:52-80`
   - `delivery:status` (other statuses, customer) → `useDeliveryNotifications.ts:70-80`
   - `order:status_changed` (confirmed/preparing/rejected/delivered) → customer via `useDeliveryNotifications.ts:86-101`
   - `order:status_changed` (pending_owner) → owner via `useDeliveryNotifications.ts:103-113`
   - `notification` → **toast only** (`App.tsx:60`) — does NOT reach persistent bell

2. **Role filtering:** Each layout passes correct role literal: `MainLayout:536` ('customer'), `OwnerLayout:111` ('owner'), `PartnerLayout:60` ('partner'), `AdminLayout:107` ('admin'). Role separation is correct.

3. **Cross-role leakage:** None in normal single-role-per-tab use. `notificationSlice` is role-agnostic but each layout mounts only its own role variant of `useDeliveryNotifications`.

4. **Unread count lifecycle:**
   - Receiving → `addNotification` sets `isRead=false`, recalculates count (`notificationSlice.ts:45`) ✓
   - Opening bell → does NOT auto-mark read (badge persists) ✓
   - Clicking item → `markAsRead(id)` dispatched (`NotificationBell.tsx:121`) ✓
   - Mark-all-read → `markAllAsRead()`, count = 0 (`notificationSlice.ts:54-58`) ✓
   - Clear-all → `clearAll()` (`notificationSlice.ts:60-63`) ✓
   - Refresh → `notifications` in persist `whitelist` (`Store_V.ts:57`); badge correct ✓

5. **Duplicate on reconnect:** No deduplication by `orderId+status`. Fresh socket events on reconnect create new entries. **Gap.**

6. **targetPath routing:** All paths verified against `routes/index.tsx`:
   - Customer: `/orders/tracking/${orderId}` → `routes:124` ✓
   - Partner: `/partner/orders` → `routes:175` ✓
   - Admin: `/admin/delivery` → `routes:157` ✓
   - Owner: `/owner/queue` → `routes:192` ✓, `/owner/active` → `routes:193` ✓

7. **Domain context in messages:** Customer and admin messages include partner name and order ID. Owner message includes short order ID. Partner message is generic — **minor gap** (could include restaurant name).

8. **History bound:** 50 items (`notificationSlice.ts:41-43`) ✓

9. **Role-specific behaviour:** Preserved ✓

10. **Mobile:** `NotificationBell.tsx` Popover fixed at `width: 360` — overflows on 375px viewport. **Minor gap.**

11. **Empty/loading/error states:** Empty → "No notifications yet" (`NotificationBell.tsx:108`) ✓. No loading/error needed.

12. **Persistent vs transient:** `App.tsx:60` dispatches only `showToast`. `useDeliveryNotifications` dispatches only `addNotification`. Generic `notification` backend event generates toast only — NOT a persistent bell entry. **Diverges from CONTEXT.md claim.**

13. **CONTEXT.md divergence:** See Section 10b.

14. **Backend persistence needed?** No. Redux-persist covers the portfolio requirement.

**Scoped session U-Notification — refinements:**
- `App.tsx`: also dispatch `addNotification` for generic `notification` event (closes CONTEXT.md gap)
- `notificationSlice.addNotification`: skip if `orderId + status` pair already exists within last 60s (deduplication)
- `NotificationBell.tsx` Popover: add `maxWidth: '90vw'` for mobile
- `useDeliveryNotifications.ts:25`: include restaurant context in partner message when `payload` carries it

**Acceptance criteria met after U-Notification:**
- All four roles see only their relevant notifications ✓
- Unread badge reflects real state ✓
- Click marks read + navigates to valid route ✓
- Mark-all-read and clear-all work without reload ✓
- Refresh preserves history ✓
- Reconnect deduplication fixed ✓
- No invalid `targetPath` references ✓
- Bell is shared component, not role-specific ✓
- Mobile viewport fix applied ✓

---

## Section 8 — Session Breakdown

### U0 — Environment and Data Source Gate
**Goal:** Ensure `VITE_DATA_SOURCE=api` is active so all pages hit the real backend.
**Primary outcome:** Restaurant listing and order history show real DB data.
**Files in scope:**
- `web/.env` / `web/.env.production`
- `web/src/core/config/app.config.ts`
- `web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts`
- `web/src/features/orders/orderSlice.ts`
- `web/src/services/api/restaurantApi.ts`
**Backend changes:** None
**Frontend changes:**
- Set `VITE_DATA_SOURCE=api` in deployment env
- Verify `restaurantApi.getAll()` and `orderApi.getUserOrders()` are reached when flag is set
**New Redux slices:** None
**Socket bindings:** None
**Notification changes:** None
**Verification:**
- Network tab shows `GET /api/restaurants` 200; listing shows DB records
- `GET /api/orders` 200; `/orders` shows real customer orders
**Size:** S
**Dependencies:** None

---

### U1 — Admin Orders List: Replace Mock with Real API
**Goal:** Replace `adminOrdersProvider` with a real call to `GET /api/orders/owned`.
**Primary outcome:** `/admin/orders` table shows real orders from database.
**Files in scope:**
- `web/src/pages/admin/orders/OrdersList.tsx`
- `web/src/features/admin/data/orders.provider.ts`
- `web/src/services/api/orderApi.ts` (extend) or new `adminOrdersApi.ts`
**Backend changes:** None — `GET /api/orders/owned` already accepts `admin` role (`order.routes.ts:10`)
**Frontend changes:**
- Create `adminOrdersApi.getAll()` calling `GET /api/orders/owned` with auth header
- Replace `adminOrdersProvider.getAll()` call in `OrdersList.tsx:100`
- Loading/error states already present in component — wire them correctly
**New Redux slices:** None (local `useState` sufficient)
**Socket bindings:** None
**Notification changes:** None
**Verification:**
- Visit `/admin/orders`; table shows real orders (not the 2 hardcoded mock rows)
- `GET /api/orders/owned` visible in Network tab with 200
**Size:** S
**Dependencies:** U0

---

### U2 — Customer Order Status: Live Socket Updates
**Goal:** Fix `orderSlice` so `order_status_update` socket events update `items[]` list, not just `currentOrder`.
**Primary outcome:** Customer's `/orders` page reflects real-time status changes without page refresh.
**Files in scope:**
- `web/src/features/orders/orderSlice.ts`
- `web/src/App.tsx`
- `web/src/pages/Orders/Orders.tsx`
**Backend changes:** None
**Frontend changes:**
- ⚠️ **MANDATORY FIRST STEP — socket-event disambiguation:** Section 5 of this plan lists both `order:status_changed` and `order_status_update` as candidate events. Before editing, run the following grep and record which event name is actually passed to `updateOrderStatusLocally`:
  ```
  grep -n "updateOrderStatusLocally\|onOrderStatusUpdate\|order_status_update\|order:status_changed" web/src/App.tsx web/src/services/socket.ts
  ```
  Paste raw output into the session report. Fix ONLY the handler that actually fires in the running app. Do not change any handler that is not bound to `updateOrderStatusLocally`.
- Investigation note: as of commit `0b34297`, `App.tsx:70` calls `socketService.onOrderStatusUpdate(handleOrderStatusUpdate)` which binds `order_status_update` (`socket.ts:201`). The `order:status_changed` event is a separate handler used only by `useDeliveryNotifications`. Verify this is still true before editing.
- Investigation note 2: `updateOrderStatusLocally` reducer at `orderSlice.ts:270-283` already updates both `state.items[]` (line 274-277) and `state.currentOrder` (line 280-282). Verify the fix is needed at all — if `items[]` is already updated, the issue is that `fetchOrdersThunk` overwrites state on next mount, not that the reducer is wrong.
- After disambiguation: if reducer already updates `items[]`, the real fix is ensuring `/orders` page does not re-fetch and overwrite on every tab focus. Check `Orders.tsx:66-68` for `useEffect` deps.
**New Redux slices:** None
**Socket bindings:** `order_status_update` already bound in `App.tsx:70`; verify before touching
**Notification changes:** Also dispatch `addNotification` alongside `showToast` in `App.tsx:60` for generic `notification` event
**Verification:**
- Place order; owner accepts it; customer `/orders` page auto-updates without refresh
- Customer notification bell shows persistent entry
**Size:** S
**Dependencies:** U0, U1

---

### U3 — Owner Dashboard: Real Data
**Goal:** Replace legacy mock `ownerSlice.fetchOwnerData` on Dashboard with data from existing `ownerOrders` + `ownerRestaurant` slices.
**Primary outcome:** `/owner` shows real pending count, restaurant name/status, and recent orders list.
**Files in scope:**
- `web/src/pages/_ownerPages/DashBoard.tsx`
- `web/src/features/owner/store/ownerSlice.ts`
- `web/src/features/owner/ownerRestaurantSlice.ts`
- `web/src/features/orders/ownerOrderSlice.ts`
**Backend changes:** None — `GET /api/orders/owned` and `GET /api/restaurants/mine` both exist
**Frontend changes:**
- Refactor `DashBoard.tsx` to read from `ownerOrders` and `ownerRestaurant` slices (already loaded by `OwnerLayout`)
- Remove the `fetchOwnerData` dispatch; replace displayed data with real slice selectors
- Show: restaurant name/rating/open (from `ownerRestaurant`), pending count (from `ownerOrders.pendingOrders.length`), last 5 recent orders
**New Redux slices:** None
**Socket bindings:** `useOwnerSocket()` already wires real-time updates in Queue/Active; Dashboard reads same slice
**Notification changes:** None
**Verification:**
- `/owner` dashboard shows restaurant name matching `GET /api/restaurants/mine`
- Pending count matches queue page count
**Size:** M
**Dependencies:** U0

---

### U4 — Partner History and Earnings: Session-Based Real Data
**Goal:** Show deliveries completed this session in History; derive Earnings from same data.
**Primary outcome:** `/partner/history` shows session deliveries; `/partner/earnings` shows non-zero totals after completing a delivery.
**Files in scope:**
- `web/src/pages/_deliveryPartner/DeliveryHistory.tsx`
- `web/src/pages/_deliveryPartner/Earnings.tsx`
- `web/src/features/deliveryPartner/deliveryPartnerSlice.ts`
**Backend changes:** None
**Frontend changes:**
- On `delivery:status` → `delivered` event, push a history entry into `deliveryPartnerSlice.history[]` with delivery details
- `DeliveryHistory` reads from `history[]`; clear empty-state text to "No deliveries this session"
- `Earnings` sums `history[].earnings` (estimated fee per delivery)
**New Redux slices:** None
**Socket bindings:** Extend `delivery:status` handler in `deliveryPartnerSlice` to push to `history[]` on `delivered`
**Notification changes:** None
**Verification:**
- Complete one delivery; `/partner/history` shows one row with correct order ID
- `/partner/earnings` shows non-zero session total
**Size:** M
**Dependencies:** U0, U2

---

### U5 — Admin Fleet: Add Sidebar Link + Risk Alerts
**Goal:** Add "Fleet Operations" to admin sidebar; surface `delivery:risk` alerts in the UI.
**Primary outcome:** Admin can navigate to `/admin/delivery` from sidebar; risk alerts appear as banners.
**Files in scope:**
- `web/src/shared/layout/AdminLayout.tsx`
- `web/src/pages/admin/delivery/index.tsx`
- `web/src/features/admin/hooks/useAdminFleet.ts`
**Backend changes:** None — `/api/delivery/fleet` and socket events fully implemented
**Frontend changes:**
- Add `{ text: 'Fleet Operations', icon: <LocalShipping />, path: '/admin/delivery' }` to `menuItems` in `AdminLayout.tsx:59`
- In `useAdminFleet`, subscribe to `delivery:risk` event; expose `risks[]`
- In `AdminDeliveryDashboard`, render `Alert` banners for active risks
- Remove dead `notificationAnchor` Menu block (`AdminLayout.tsx:409-447`)
**New Redux slices:** None — local state in hook
**Socket bindings:** `delivery:risk` + `delivery:risk_cleared` → local state in `useAdminFleet`
**Notification changes:** None
**Verification:**
- Fleet Operations link visible in admin sidebar; click navigates to `/admin/delivery`
- Map renders; partner markers visible when partner is online
**Size:** S
**Dependencies:** None

---

### U6 — Customer Review Flow
**Goal:** Wire the "Leave a Review" button on delivered orders to `POST /api/reviews`.
**Primary outcome:** Customer submits star rating + comment; review persists in DB.
**Files in scope:**
- `web/src/pages/Orders/Orders.tsx`
- `web/src/pages/Orders/OrderReview.tsx`
- `web/src/services/api/reviewApi.ts` (create)
**Backend changes:** None — `POST /api/reviews` exists (`review.routes.ts:7`)
**Frontend changes:**
- Wire `RateReview` icon button in `Orders.tsx` to open `OrderReview.tsx` dialog
- `OrderReview` submits `{ orderId, restaurantRating, partnerRating, comment }` to `POST /api/reviews` — field names verified against `review.controller.ts:19`; backend requires both ratings as `number`, throws 400 on mismatch (⚠️ **was producing 400 in session 7 when wrong field names were sent**)
- Note: `submitReviewThunk` and `orderApi.submitReview` already use the correct payload shape (`orderSlice.ts:237`, `orderApi.ts:209`); the issue was the plan's documentation, not the runtime code. The `OrderReview.tsx` page is already wired correctly. The outstanding gap is route registration: `/orders/:id/review` must be confirmed in `routes/index.tsx`.
- On success: show toast, disable review button for that order (local state)
**New Redux slices:** None — local dialog state + one-shot fetch
**Socket bindings:** None
**Notification changes:** None
**Verification:**
- Submit review on delivered order; check DB for new review document; button disabled after submit
**Size:** S
**Dependencies:** U0

---

### U-Notification — Notification Bell Refinement
**Goal:** Fix dual-dispatch gap, add reconnect deduplication, improve mobile rendering, enrich partner message.
**Primary outcome:** Bell behaves as CONTEXT.md describes; no duplicates; works at 375px.
**Files in scope:**
- `web/src/App.tsx`
- `web/src/core/notifications/notificationSlice.ts`
- `web/src/core/notifications/hooks/useDeliveryNotifications.ts`
- `web/src/core/notifications/components/NotificationBell.tsx`
**Backend changes:** None
**Frontend changes:**
- `App.tsx:60`: also dispatch `addNotification` for generic `notification` event
- `notificationSlice.addNotification`: skip if matching `orderId + status` entry exists within last 60s
- `NotificationBell.tsx` Popover `PaperProps`: add `maxWidth: '90vw'`, `width: { xs: '90vw', sm: 360 }`
- `useDeliveryNotifications.ts:25`: include order context in partner message when `payload` carries it
**New Redux slices:** None
**Socket bindings:** No new bindings
**Notification changes:** As described above
**Verification:**
- Rapid delivery events don't duplicate in bell
- On 375px DevTools, Popover stays within viewport
- Generic `notification` socket event creates persistent bell entry + toast
**Size:** S
**Dependencies:** None (can run parallel with U1)

---

## Section 9 — Explicitly Deferred

| Item | Reason |
|------|--------|
| Payment flows | No backend payment module exists |
| Admin CRUD mutations (edit/delete restaurant, ban user) | Out of scope for display-focused portfolio |
| `Promotions` / `Reports` admin pages | No backend data; placeholder shells only |
| `Settings` pages (all roles) | No backend endpoints verified |
| Owner `menu`, `analytics`, `staff`, `finance`, `reviews`, `profile`, `support` | All `ComingSoon`; no backend data |
| Partner `support`, `settings` | No backend data |
| `/search` page | No backend search endpoint |
| `/notification` page (customer) | Orphaned; NotificationBell covers the use case |
| i18n / theming / dark mode | Not needed for portfolio goal |
| `delivery:released` event consumer | Edge case; no visible gap in core demo flow |
| Dev routes `/dev/*` | Already guarded by `IS_DEV`; not user-facing |

### P1 items dropped from scope

These routes exist and render something, but do not appear in the demo script (Section 2). Deferred to a future polish pass.

| Route | Role | Reason for deferral |
|-------|------|-------------------|
| `/profile` | `user` | Renders via `DevVersionRenderer`; auth data present; not required for core demo flow |
| `/favorites` | `user` | `restaurantSlice.favorites` is in-memory; no list-fetch endpoint; not in demo script |
| `/partner/profile` | `partner` | Partial state from `fetchPartnerStateThunk`; renders correctly; no gap blocks demo |
| `/admin/restaurants/add` | `admin` | Submit wiring unverified; not in demo script |
| `/admin/profile` | `admin` | Renders auth data; not in demo script |
| `/admin/ai/investigations/:id` | `admin` | AI integration paused; not cost-free to run at portfolio scale |


---

## Section 10 — Open Questions and Doc/Code Divergences

### 10a. Open Questions

| Question | Where to look |
|----------|--------------|
| What does `ownerSlice.fetchOwnerData` actually call? | `web/src/features/owner/store/ownerSlice.ts` (not fully inspected) |
| Does `VITE_DATA_SOURCE=api` get set in the deployment pipeline? | `web/.env`, `web/.env.production`, CI config |
| Does `restaurantApi.getAll()` return menuItems or is a separate call needed per restaurant? | `web/src/services/api/restaurantApi.ts` |
| Does `LiveDeliveryTracker` subscribe to `delivery:location` directly via `socketService`? | `web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx` |
| Is `AddRestaurant` wired to `POST /api/restaurants` or is it also mock? | `web/src/pages/admin/restaurants/AddRestaurants.tsx` |
| Is `AdminMenu` a real component or placeholder? | `web/src/pages/admin/menu/index.tsx` |

### 10b. Documentation / Implementation Divergences

| Doc claim | Doc file:line | Actual implementation | Code file:line |
|-----------|--------------|----------------------|----------------|
| "App.tsx dispatches both `showToast` and `addNotification`" | `CONTEXT.md:12` | `App.tsx` dispatches only `showToast` for `notification` event; `addNotification` is NOT called | `App.tsx:60` |
| Order lifecycle "complete" through deliver → review | `docs/singleFlowCompletion.md` (assumed) | Review endpoint exists but "Leave a Review" button wiring in `Orders.tsx` needs verification; `OrderReview.tsx` exists separately | `web/src/pages/Orders/Orders.tsx`, `OrderReview.tsx` |
| Comment "DF-B2 replaces [DashBoard] with the real owner flow" | `_ownerPages/DashBoard.tsx:1-2` | No replacement found; Dashboard is still the index route at `/owner`; Queue/Active are separate pages | `routes/index.tsx:190` |
| AdminOrdersList implied as real in prior planning docs | `docs/domainFlowCompletion.md` (assumed) | `adminOrdersProvider.getAll()` returns a 2-row static mock | `orders.provider.ts:52` |
| AdminLayout renders notifications | `AdminLayout.tsx:409-446` | A hardcoded 5-item static `<Menu>` exists alongside `NotificationBell`; the `notificationAnchor` state is **never set** — dead code | `AdminLayout.tsx:114, 327, 409` |

---

## Section 11 — Portfolio Polish Checklist

- [ ] Build passes (`npx vite build` exits 0)
- [ ] No `localhost` literal in production source (audit with `grep -r 'localhost' web/src`)
- [ ] No faker/factory in production bundle (`DATA_SOURCE=api`; factory imports are DEV-guarded at `restaurantSlice_V.ts:42`)
- [ ] Loading states on every async P0 page (Queue ✓, Active ✓, AdminDashboard ✓, RestaurantsList ✓)
- [ ] Error states with recovery action (Queue ✓ Retry, Active ✓ Retry, AdminDashboard ✓; AdminOrders needs real error after U1)
- [ ] Empty states with actionable text (Queue ✓ "No pending orders"; DeliveryHistory needs "No deliveries this session" after U4)
- [ ] Responsive layout at 375px / 768px / 1440px (mobile bottom nav ✓; partner/owner/admin use `isMobile` breakpoint ✓; NotificationBell Popover fix → U-Notification)
- [ ] Page `<title>` updated per route (not currently set per-route — global `<title>FoodHub</title>` only)
- [ ] Favicon present (verify `web/public/favicon.ico`)
- [ ] OG meta tags for link previews (`web/index.html` — verify `og:title`, `og:description`)
- [ ] No console errors on any P0 page (verify after each session completes)
- [ ] Dead `notificationAnchor` Menu block removed from `AdminLayout.tsx:409-447`
- [ ] `APP_CONFIG.DATA_SOURCE` value surfaced in admin UI or README so recruiter can confirm `api` mode is active
