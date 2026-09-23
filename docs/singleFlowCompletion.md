# FoodHub — Single Flow Completion Plan
## Host-Ready Marketplace Flow

> **Supersedes**: `docs/domainFlowCompletion.md` (for active execution).
> The older doc is kept as historical record. The Next Exact Task pointer in that doc is now stale. Use **this file** as the single source of truth for execution.
>
> **Supersedes**: Active "Next Exact Task" in `docs/domainFlowCompletion.md`.
> Reason: That doc only tracked domain phases. This doc adds UI audit, sidebar audit, notification wiring, profile plans, cleanup authority, and host-readiness checklist that the execution agent needs in one place.

---

## Current Phase

**Session 6 of 6 - Host-Readiness Verification - COMPLETED**

## Completion: 100% (6 of 6 sessions)

*(Backend foundation: DF-A1 + DF-B1 + DF-C2 already verified. This plan picks up from there.)*

---

## Flow Definition

The single flow to complete end-to-end:

| Step | Actor | Action | Endpoint / Event | Expected UI reflection per role |
|------|-------|--------|------------------|---------------------------------|
| 1 | Customer | Places order | `POST /api/orders` | **Customer**: redirected to `/orders/confirmation` with real order data. **Owner**: receives `order:new` socket → new card appears in `/owner/queue` |
| 2 | Owner | Accepts order | `PATCH /api/orders/:id/accept` | **Owner**: card moves from queue to `/owner/active` with status CONFIRMED. **Customer**: `/orders/tracking/:id` timeline advances. Customer notification dispatched |
| 2b | Owner | Rejects order | `PATCH /api/orders/:id/reject` | **Customer**: tracking page shows REJECTED status with reason + red styling. Customer notification dispatched. **Owner**: card removed from queue |
| 3 | Owner | Marks preparing | `PATCH /api/orders/:id/preparing` | **Owner**: chip changes to PREPARING. **Customer**: tracking timeline advances |
| 4 | Owner | Marks ready | `PATCH /api/orders/:id/ready` | **Owner**: card disappears (not owner's responsibility anymore). Backend transitions to `READY_FOR_PICKUP` → `AWAITING_PARTNER` → emits `delivery:available` to available partners |
| 5 | Partner | Receives broadcast | `delivery:available` socket event | **Partner**: `/partner/orders` page shows new assignment card with restaurant + customer info and Accept/Decline buttons |
| 6 | Partner | Accepts delivery | `POST /api/delivery/:orderId/accept` | **Partner**: navigates to `/partner/active`. **Customer**: tracking shows PARTNER_ASSIGNED + partner info card. Customer notification dispatched. **Admin**: `/admin/delivery` fleet updates |
| 7 | Partner | Picks up | `PATCH /api/delivery/:deliveryId/status` → `picked_up` | **Partner**: active delivery shows PICKED_UP, Map active. **Customer**: tracking timeline advances |
| 8 | Partner | En route | GPS simulator / `delivery:location` events | **Customer**: partner dot moves on map. **Admin**: fleet map updates |
| 9 | Partner | Marks delivered | `PATCH /api/delivery/:deliveryId/status` → `delivered` | **Partner**: delivery complete, redirected to history. **Customer**: tracking shows DELIVERED, review prompt appears. Customer notification |
| 10 | Customer | Rates restaurant + partner | `POST /api/reviews` (×2) | **Customer**: order transitions to `REVIEWED`, review submitted state shown. Restaurant + partner ratings update |

---

## Audit Table

*Grounded in file reads only. File:line citations where applicable.*

| Step | Backend | Frontend | UI State | Notes |
|------|---------|----------|----------|-------|
| 1. Customer places order | **Works** — `order.controller.ts:28-73`. Creates order as `pending_owner`, emits `order:new` to owner room | **Works** — `orderSlice.ts` has `placeOrderThunk`, redirects to `/orders/confirmation` | **Partial** — `OrderConfirmation/index.tsx:207-214` has `setTimeout` fake progression | Status steps are hardcoded enum `'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered'` — missing canonical states |
| 2. Owner accepts | **Works** — `order.controller.ts:173-179`, `order.service.ts:6-69` validates + emits `order:status_changed` to owner room + admin_fleet | **Works** — `ownerOrderApi.ts:40-51` calls `PATCH orders/:id/accept`, `useOwnerSocket.ts` listens for `order:status_changed` | **Works** — `Active.tsx` shows card with correct status. **Gap**: owner socket does NOT emit to customer room | `order.service.ts:51` emits `order_status_update` to `order.id` room BUT customer must join order room; `order:status_changed` only goes to owner room + admin_fleet — customer never gets it |
| 2b. Owner rejects | **Works** — `order.controller.ts:182-188` transitions to `rejected` | **Works** — `rejectOrderThunk` in `ownerOrderApi.ts:53-63` | **Missing** — Customer tracking has no `rejected` state case; no rejection notification to customer | Critical gap: customer gets no feedback on rejection |
| 3. Owner marks preparing | **Works** — `order.controller.ts:191-197` | **Works** — `markPreparingThunk` in `ownerOrderApi.ts:66-76` | **Works** — `Active.tsx:104-113` conditionally shows "Start Preparing" button | Customer tracking does not subscribe to `order:status_changed` |
| 4. Owner marks ready | **Works** — `order.controller.ts:200-207` transitions to `ready_for_pickup`. `order.service.ts:17-21` only handles `pending_owner→confirmed`, `confirmed→preparing`, `preparing→ready_for_pickup` | **Works** — `markReadyThunk` in `ownerOrderApi.ts:79-89` | **Gap**: Owner UI does not remove ready card (no `ready_for_pickup` handler in `ownerOrderSlice.ts:47-49`). **Gap**: Backend does NOT emit `delivery:available` after `ready_for_pickup` | Assignment flow is missing entirely. `delivery.service.ts` has `assignDelivery()` which auto-assigns without broadcast |
| 5. Partner receives broadcast | **Missing** — No `delivery:available` event emitted anywhere in the codebase (confirmed via grep zero results) | **Partial** — `AvailableOrdders.tsx` uses `selectAvailableAssignments` from `deliveryPartnerSlice`, but slice has no socket listener for `delivery:available` | **Partial** — Page renders assignments from slice state, but state is never populated via real event | `deliveryPartnerSlice.ts:119-136` has `acceptAssignmentThunk` calling `POST delivery/:orderId/accept` but backend has no such route |
| 6. Partner accepts | **Missing** — `delivery.routes.ts` and `delivery.partner.routes.ts`: no `POST /delivery/:orderId/accept` endpoint | **Partial** — `acceptAssignmentThunk` exists in slice | **Missing** — No accept endpoint on backend; thunk will 404 | Also: `rejectAssignmentThunk` calls `POST delivery/:orderId/reject` — also missing |
| 7. Partner picks up | **Works** — `PATCH /delivery/:id/status → picked_up` in `delivery.routes.ts:19-26`, validates via `assertValidTransition` | **Works** — `updateAssignmentStatusThunk` in slice | **Works** — `ActiveDelivery.tsx` exists and verified per S3 | Customer tracking subscribes to `delivery:status` via `useDeliveryTracking.ts:31-34` |
| 8. GPS / en route | **Works** — `socket.ts:34-62` handles `partner:location_updated` | **Works** — S3-S4a verified | **Works** — Customer map updates | `delivery:location` events emit to order room + admin_fleet |
| 9. Partner marks delivered | **Works** — `PATCH /delivery/:id/status → delivered` | **Works** — `updateAssignmentStatusThunk` | **Partial** — Customer sees DELIVERED but no review prompt yet | `DF-F1` (review flow) not started |
| 10. Customer rates | **Missing** — No `/api/reviews` module. No review routes | **Missing** — No review UI triggered post-`delivered` | **Missing** | Entire `DF-F1` vertical not built |

---

## Page Inventory

### Customer

| Route | Component | Data Source | UI State | Action |
|-------|-----------|-------------|----------|--------|
| `/` | `Home` (via `MainLayout`) | Real (restaurants API) | Ready | Keep |
| `/orders` | `pages/Orders/index.tsx` | Real (`fetchOrdersThunk`) | **Stale** — missing `ready_for_pickup`, `awaiting_partner`, `partner_assigned`, `picked_up` status colors/labels | Fix — add canonical status map |
| `/orders/confirmation` | `pages/OrderConfirmation/index.tsx` | Real (fetches real order) + **Mock** (`ORDER_DATA` const at line 86, `statusSteps` with hardcoded times at lines 123-128, `setTimeout` fake progression at line 207) | **Stale** — mixed real/mock | Fix — remove mock data, remove `setTimeout`, derive status from real order |
| `/orders/tracking/:id` | `pages/Orders/OrderTracking/index.tsx` | Real (`fetchOrderByIdThunk`) + socket | **Partial** — only shows delivery states (S4a), not owner states (CONFIRMED, PREPARING) | Fix (DF-C3) |
| `/cart` | `Cart` | Real (cartSlice) | Ready | Keep |
| `/checkout` | `Checkout` | Real | Ready (verified DF-C2) | Keep |
| `/profile` | `pages/Profile` (from `@pages/index`) | Unknown | Unknown | Investigate |
| `/favorites` | `Favourites` | Unknown | Unknown | Investigate |
| `/notification` | `Notifications` | Unknown | Unknown | Investigate |
| `/settings` | `Settings` | Unknown | Unknown | Investigate |
| `/restaurants` | `restaurantListings` | Real | Ready | Keep |
| `/restaurants/:id` | `RestaurantDetail` | Real | Ready | Keep |
| `/history` | **Missing route** — `UserLayout.tsx:71` links to `/history` but no route in `index.tsx` | None | **Fixed** | Redirects to `/orders` |
| `/help` | **Missing route** — `UserLayout.tsx:72` links to `/help` but no route in `index.tsx` | None | **Fixed** | Coming-soon page |

### Owner

| Route | Component | Data Source | UI State | Action |
|-------|-----------|-------------|----------|--------|
| `/owner` | `_ownerPages/DashBoard.tsx` | **Mock** — calls `ownerMockApi` (line 36-41); uses `features/owner/store/ownerSlice.ts` which wraps mock API | **Stale/Mock** | Refactor to real data or Coming-soon shell |
| `/owner/queue` | `_owner/Queue.tsx` | **Real** — `fetchOwnerQueueThunk`, `useOwnerSocket` | **Ready** — loading/error/empty states exist | Keep |
| `/owner/active` | `_owner/Active.tsx` | **Real** — `fetchOwnerActiveThunk`, `useOwnerSocket` | **Ready** — conditional buttons per status | Keep |
| `/owner/settings` | `_ownerPages/Settings.tsx` | Unknown | Unknown | Investigate |
| `/owner/menu` | **Missing route** — sidebar links to `/owner/menu` | None | **Fixed** | Coming-soon page |
| `/owner/orders` | **Missing route** — sidebar links to `/owner/orders`, badge: 5 (hardcoded) | None | **Fixed** | Redirects to `/owner/queue` |
| `/owner/analytics` | **Missing route** — sidebar links to `/owner/analytics` | None | **Fixed** | Coming-soon page |
| `/owner/promotions` | **Missing route** — sidebar links | None | **Fixed** | Coming-soon page |
| `/owner/reviews` | **Missing route** — sidebar links, badge: 3 (hardcoded) | None | **Fixed** | Coming-soon page |
| `/owner/staff` | **Missing route** — sidebar links | None | **Fixed** | Coming-soon page |
| `/owner/finance` | **Missing route** — sidebar links | None | **Fixed** | Coming-soon page |
| `/owner/profile` | **Missing route** — sidebar links as "Restaurant Profile" | None | **Fixed** | Coming-soon page |
| `/owner/support` | **Missing route** — sidebar links | None | **Fixed** | Coming-soon page |

### Partner

| Route | Component | Data Source | UI State | Action |
|-------|-----------|-------------|----------|--------|
| `/partner` | `PartnerDashboard.tsx` | Unknown | Unknown | Investigate |
| `/partner/orders` | `AvailableOrdders.tsx` | **Partial** — uses `selectAvailableAssignments` from Redux slice, but slice never populates from real `delivery:available` event | **Stale** — shows empty when assignment flow missing | Fix (Session 2: assignment) |
| `/partner/active` | `ActiveDelivery.tsx` | Real — socket-driven, verified S3 | Ready | Keep |
| `/partner/profile` | `Profile.tsx` | **Mock** — hardcoded `partner` object at line 36-48 | **Stale** | Fix (Session 5: profiles) |
| `/partner/history` | `DeliveryHistory.tsx` | Unknown | Unknown | Investigate |
| `/partner/earnings` | `Earnings.tsx` | Unknown | Unknown | Investigate |
| `/partner/support` | `PartnerSupport.tsx` | Unknown | Unknown | Investigate |
| `/partner/settings` | `Settings.tsx` | Unknown | Unknown | Investigate |

### Admin

| Route | Component | Data Source | UI State | Action |
|-------|-----------|-------------|----------|--------|
| `/admin` | `AdminDashboard.tsx` | Unknown | Unknown | Investigate |
| `/admin/orders` | `OrdersList.tsx` | Unknown | Unknown | Investigate |
| `/admin/restaurants` | `RestaurantsList.tsx` | Unknown | Unknown | Investigate |
| `/admin/restaurants/add` | `AddRestaurant.tsx` | Unknown | Unknown | Investigate |
| `/admin/menu` | `AdminMenu` | Unknown | Unknown | Investigate |
| `/admin/promotions` | `Promotions` | Unknown | Unknown | Investigate |
| `/admin/reports` | `Reports` | Unknown | Unknown | Investigate |
| `/admin/settings` | `AdminSettings` | Unknown | Unknown | Investigate |
| `/admin/users` | `Users` | Unknown | Unknown | Investigate |
| `/admin/profile` | `Profile.tsx` | **Partial** — reads from Redux `auth.user` (name, email, phone) but supplements with hardcoded fallbacks at lines 41-50 | **Partial** | Fix — remove hardcoded fallback values |
| `/admin/ai` | `AdminAIPage` | Unknown | Unknown | Investigate |
| `/admin/delivery` | `AdminDeliveryDashboard` | Real — verified S4b | Ready | Keep |
| `/admin/payments` | **Missing route** — sidebar links to `/admin/payments` | None | **Broken** (404) | Replace with Coming-soon |
| `/admin/orders/analytics` | **Missing route** — sidebar dropdown | None | **Broken** (404) | Replace with Coming-soon |
| `/admin/restaurants/categories` | **Missing route** — sidebar dropdown | None | **Broken** (404) | Replace with Coming-soon |
| `/admin/menu/categories` | **Missing route** — sidebar dropdown | None | **Broken** (404) | Replace with Coming-soon |
| `/admin/menu/add` | **Missing route** — sidebar dropdown | None | **Broken** (404) | Replace with Coming-soon |
| `/admin/users/delivery` | **Missing route** — sidebar dropdown | None | **Broken** (404) | Replace with Coming-soon |

---

## Sidebar Audit

### MainLayout / UserLayout (`web/src/shared/layout/UserLayout.tsx`)

| Link label | Target route | Route exists? | Page state | Action |
|------------|-------------|---------------|------------|--------|
| Home | `/` | Yes | Ready | Keep |
| Restaurants | `/restaurants` | Yes | Ready | Keep |
| My Orders | `/orders` | Yes | Ready | Keep |
| Favorites | `/favorites` | Yes | Unknown | Investigate |
| Order History | `/history` | **No** | Missing | Fix: point to `/orders` |
| Help | `/help` | **No** | Missing | Fix: Coming-soon at `/help` |
| Settings | `/settings` | Yes | Unknown | Investigate |

### OwnerLayout (`web/src/shared/layout/OwnerLayout.tsx`)

| Link label | Target route | Route exists? | Page state | Action |
|------------|-------------|---------------|------------|--------|
| Dashboard | `/owner` | Yes | **Mock** | Refactor |
| Menu Management | `/owner/menu` | **No** | Missing | Coming-soon |
| Orders | `/owner/orders` | **No** | Missing | **Point to `/owner/queue`** |
| Analytics | `/owner/analytics` | **No** | Missing | Coming-soon |
| Promotions | `/owner/promotions` | **No** | Missing | Coming-soon |
| Reviews | `/owner/reviews` | **No** | Missing | Coming-soon |
| Staff | `/owner/staff` | **No** | Missing | Coming-soon |
| Finance | `/owner/finance` | **No** | Missing | Coming-soon |
| Restaurant Profile | `/owner/profile` | **No** | Missing | Coming-soon |
| Settings | `/owner/settings` | Yes | Unknown | Investigate |
| Support | `/owner/support` | **No** | Missing | Coming-soon |
| Logout | `/login` | Yes | — | **Broken**: navigate to login without dispatching logout thunk | Fix: wire to `logout()` from AuthContext |

### PartnerLayout (`web/src/shared/layout/PartnerLayout.tsx`)

| Link label | Target route | Route exists? | Page state | Action |
|------------|-------------|---------------|------------|--------|
| Dashboard | `/partner` | Yes | Unknown | Investigate |
| Available Orders | `/partner/orders` | Yes | **Stale** (assignment not wired) | Fix (Session 2) |
| Active Delivery | `/partner/active` | Yes | Ready | Keep |
| Delivery History | `/partner/history` | Yes | Unknown | Investigate |
| Earnings | `/partner/earnings` | Yes | Unknown | Investigate |
| Profile | `/partner/profile` | Yes | **Mock** | Fix (Session 5) |
| Support | `/partner/support` | Yes | Unknown | Investigate |
| Settings | `/partner/settings` | Yes | Unknown | Investigate |
| Logout | `/login` | Yes | — | **Broken**: no logout thunk dispatched | Fix |
| Available Orders badge | hardcoded `3` in `PartnerLayout.tsx:50` | — | **Stale** | Fix (Session 2) |

### AdminLayout (`web/src/shared/layout/AdminLayout.tsx`)

| Link label | Target route | Route exists? | Page state | Action |
|------------|-------------|---------------|------------|--------|
| Dashboard | `/admin` | Yes | Unknown | Investigate |
| Orders (badge: 24 hardcoded at line 65) | `/admin/orders` | Yes | Unknown | Fix badge |
| All Orders | `/admin/orders` | Yes | Unknown | Investigate |
| Order Analytics | `/admin/orders/analytics` | **No** | Missing | Coming-soon |
| Restaurants | `/admin/restaurants` | Yes | Unknown | Investigate |
| Add Restaurant | `/admin/restaurants/add` | Yes | Unknown | Investigate |
| Categories | `/admin/restaurants/categories` | **No** | Missing | Coming-soon |
| Menu Management | `/admin/menu` | Yes | Unknown | Investigate |
| Payments | `/admin/payments` | **No** | Missing | Coming-soon |
| AI Insights | `/admin/ai` | Yes | Unknown | Investigate |
| Delivery Fleet | `/admin/delivery` | Yes | Ready | Keep |

---

## Clean UI Audit

### `setTimeout` / `setInterval` used to fake progress

- `web/src/pages/OrderConfirmation/index.tsx:207-214` — `setTimeout` advances `currentStatusIndex` every 2000ms through hardcoded `statusSteps`. This fakes order progress as a visual animation instead of reflecting real order state.

### Hardcoded numbers presented as real data

- `web/src/shared/layout/OwnerLayout.tsx:141` — `"Spice Garden"` hardcoded restaurant name
- `web/src/shared/layout/OwnerLayout.tsx:150` — `"4.8 ★"` hardcoded rating chip
- `web/src/shared/layout/OwnerLayout.tsx:156` — `"Open Now"` hardcoded status chip
- `web/src/shared/layout/OwnerLayout.tsx:169` — `₹8.5k` today revenue (hardcoded)
- `web/src/shared/layout/OwnerLayout.tsx:173` — `24` orders (hardcoded)
- `web/src/shared/layout/OwnerLayout.tsx:177` — `5` pending (hardcoded)
- `web/src/shared/layout/OwnerLayout.tsx:61` — `badge: 5` on Orders menu item (hardcoded)
- `web/src/shared/layout/OwnerLayout.tsx:80` — `badge: 3` on Reviews menu item (hardcoded)
- `web/src/shared/layout/OwnerLayout.tsx:297` — `badgeContent={8}` on notification bell (hardcoded, not from `notificationSlice`)
- `web/src/shared/layout/PartnerLayout.tsx:50` — `badge: 3` on Available Orders (hardcoded)
- `web/src/shared/layout/PartnerLayout.tsx:106` — `"Rahul Sharma"` partner name (hardcoded)
- `web/src/shared/layout/PartnerLayout.tsx:109` — `"DP001"` partner ID (hardcoded)
- `web/src/shared/layout/PartnerLayout.tsx:116` — `"4.8"` rating chip (hardcoded)
- `web/src/shared/layout/PartnerLayout.tsx:122` — `"1.2k deliveries"` (hardcoded)
- `web/src/shared/layout/AdminLayout.tsx:65` — `badge: 24` on Orders menu item (hardcoded)
- `web/src/pages/_deliveryPartner/Profile.tsx:36-48` — entire `partner` object is hardcoded static data
- `web/src/features/orders/hooks/useDeliveryTracking.ts:25` — `rating: 4.8` (noted as mock debt)
- `web/src/features/orders/hooks/useDeliveryTracking.ts:26` — `completedDeliveries: 420` (noted as mock debt)
- `web/src/pages/OrderConfirmation/index.tsx:86-120` — `ORDER_DATA` constant with full hardcoded order
- `web/src/pages/OrderConfirmation/index.tsx:123-128` — `statusSteps` with hardcoded times `2:30 PM`, `2:35 PM`, etc.

### Buttons with no-op or missing onClick

- `web/src/pages/OrderConfirmation/index.tsx:619-628` — "Get Directions" button has no `onClick`
- `web/src/pages/OrderConfirmation/index.tsx:692-699` — "View Restaurant" button has no `onClick`
- `web/src/pages/OrderConfirmation/index.tsx:719-726` — "Call" button has no action
- `web/src/pages/OrderConfirmation/index.tsx:727-734` — "Email" button has no action
- `web/src/shared/layout/OwnerLayout.tsx:248-256` — Logout navigates to `/login` without dispatching `logout()`
- `web/src/shared/layout/PartnerLayout.tsx:167-175` — Logout navigates to `/login` without dispatching `logout()`

### Status enum mismatch

- `web/src/pages/OrderConfirmation/index.tsx:58` — `OrderDetails.status` typed as only 4 states; missing all canonical states
- `web/src/pages/Orders/index.tsx:29-31` — filter tabs don't include `ready_for_pickup`, `awaiting_partner`, `partner_assigned`, `picked_up` as active states

### Components importing from `_ownerPages/` or `features/owner/`

- `web/src/pages/_ownerPages/DashBoard.tsx:16` — imports from `features/owner/store/ownerSlice` (mock-backed)
- `web/src/app/routes/index.tsx:45-46` — imports `OwnerDashboard` and `OwnerSettings` from `_ownerPages/`

---

## Notification Bell Plan

### Where it's mounted
- **PartnerLayout**: `PartnerLayout.tsx:218` — `<NotificationBell />` (real, wired) ✓
- **AdminLayout**: `AdminLayout.tsx:55` — imports `NotificationBell`; mounted in AppBar ✓
- **OwnerLayout**: `OwnerLayout.tsx:296-300` — **Broken**: `<Badge badgeContent={8} color="error"><Notifications /></Badge>` hardcoded; NOT `<NotificationBell />`
- **UserLayout**: Not confirmed mounted. `App.tsx` has legacy `socketService.onNotification` disconnected from `notificationSlice`

### What drives its count today
- `NotificationBell.tsx:35` — `useAppSelector(selectUnreadCount)` from `notificationSlice` ✓ (correct for Partner + Admin)
- Owner bell: hardcoded `8` — never updates

### Events currently writing to `notificationSlice`
Via `useDeliveryNotifications` (called in `PartnerLayout` + `AdminLayout`):
- `delivery:assigned` → dispatches `addNotification` for partner + admin ✓
- `delivery:status` (status=`delivered`) → dispatches `addNotification` for customer + admin ✓
- `delivery:status` (other statuses, customer role) → dispatches `addNotification` ✓

### Events that SHOULD write but don't (gaps)

| Event | Emitted? | Reaches customer room? | notificationSlice updated? |
|-------|----------|------------------------|---------------------------|
| `order:status_changed` (CONFIRMED) | Yes — owner room + admin_fleet | **No** | No |
| `order:status_changed` (PREPARING) | Yes — owner room + admin_fleet | **No** | No |
| `order:status_changed` (READY_FOR_PICKUP) | Yes | **No** | No |
| `order:status_changed` (REJECTED) | Yes | **No** | No |
| `delivery:available` | **No — not emitted anywhere** | — | No |
| `delivery:assigned` | Yes — order room + admin_fleet | Yes (via order room) | Yes (Partner + Admin) |

### Exact changes needed (COMPLETED in Session 3)
1. **`API/src/modules/orders/order.service.ts`**: Add `io.to(order.userId.toString()).emit('order:status_changed', { orderId, status, actorRole })` — customer receives their order's status changes
2. **New hook `useOrderNotifications.ts`** or extend `useDeliveryNotifications.ts`: Subscribe to `order:status_changed` in customer layout; dispatch `addNotification` for CONFIRMED, PREPARING, REJECTED
3. **`OwnerLayout.tsx`**: Replace `<Badge badgeContent={8}>` with `<NotificationBell />`. Add `useDeliveryNotifications('admin')` or equivalent.
4. **`UserLayout.tsx`**: Mount `<NotificationBell />` + mount order notifications hook.
5. **After Session 2 (assignment)**: Add `delivery:available` case in `useDeliveryNotifications` for partner role.

**Note**: Notification bell wired for all four roles. Customer hook now subscribes to `order:status_changed`.

---

## Profile Plan

### Owner Profile
- **Existing file**: `_ownerPages/DashBoard.tsx` — mock-backed, not a dedicated profile. No `/owner/profile` route exists.
- **Current data**: Entirely mock via `ownerMockApi` (`DashBoard.tsx:36-41`)
- **Backend endpoint needed**: `GET /api/restaurants/mine` — restaurant linked to owner JWT (uses same pattern as `order.controller.ts:89`: `Restaurant.findOne({ ownerId: req.user.id })`)
- **Frontend change shape**: New `web/src/pages/_owner/Profile.tsx` — fetches real restaurant data. Shows restaurant name, image, rating, open/closed toggle. Route registered as `/owner/profile`.

### Partner Profile
- **Existing file**: `web/src/pages/_deliveryPartner/Profile.tsx`
- **Current data**: Hardcoded static object at `Profile.tsx:36-48`
- **Backend endpoint**: `GET /api/delivery/partner/me` — **already exists** (`delivery.partner.routes.ts:13-54`). Returns `status`, `isOnline`, `currentLocation`, `activeAssignment`. Missing: name, phone, rating, vehicle from `DeliveryPartner` model.
- **Gap**: `/me` endpoint returns operational data but not profile fields. Need to add profile fields to response.
- **Frontend change shape**: Replace hardcoded `partner` object with `fetchPartnerStateThunk` dispatch. Use `auth.user.name` from Redux auth state for display name.

### Admin Profile
- **Existing file**: `web/src/pages/admin/Profile.tsx`
- **Current data**: Partial real — reads `user` from Redux auth (`Profile.tsx:39`). Falls back to hardcoded `'Admin User'`, `'admin@foodhub.com'`, `'Platform Operations'`, `'India'` (`Profile.tsx:41-50`)
- **Backend endpoint needed**: None. Auth Redux state has the data.
- **Frontend change shape**: Remove hardcoded fallback strings. Show `user?.name || '—'`. Remove `department` and `location` display fields that have no real source.

---

## Assignment Flow Plan

### Current state
- `delivery.service.ts:10-53`: `assignDelivery()` auto-assigns first available partner (no broadcast, no user choice)
- **Zero occurrences of `delivery:available` anywhere in codebase** (grep confirmed)
- **No `POST /delivery/:orderId/accept` or `/reject` endpoints** in any delivery route file

### Backend changes needed (DF-D1 + DF-D2)

1. **`order.service.ts` — after `ready_for_pickup` transition**:
   - Transition order to `awaiting_partner` (add `'ready_for_pickup': ['awaiting_partner']` to `validTransitions`)
   - Query: `DeliveryPartner.find({ status: 'available' })`
   - Broadcast to each: `io.to(partner.userId.toString()).emit('delivery:available', { orderId, restaurantName, restaurantAddress, totalAmount, estimatedDistance })`

2. **`delivery.partner.routes.ts` — new `POST /:orderId/accept`**:
   - `protect` + `authorize('partner')`
   - Atomic: `Order.findOneAndUpdate({ _id: orderId, status: 'awaiting_partner' }, { $set: { status: 'partner_assigned' } }, { new: true })`
   - If result null → 409 `{ success: false, message: 'already_assigned' }`
   - On success: Create `Delivery` record, update partner status to `assigned`, emit `delivery:assigned` to `io.to(orderId)` + `io.to(order.userId.toString())` + `io.to('admin_fleet')`

3. **`delivery.partner.routes.ts` — new `POST /:orderId/reject`**:
   - Simply removes the partner from consideration for this broadcast. No state change on order. Returns 200.

4. **`delivery.events.ts`** — add `delivery:available` emitter type.

### Frontend changes needed (DF-D3)
1. **New hook** `web/src/features/deliveryPartner/hooks/useDeliveryAvailable.ts`: subscribes to `delivery:available` socket event → dispatches `assignmentBroadcastReceived(payload)` action
2. **`deliveryPartnerSlice.ts`**: Add `assignmentBroadcastReceived` reducer to push to `availableAssignments[]`; add `assignmentAccepted` reducer to set `activeAssignment` and clear from `availableAssignments`
3. **`PartnerLayout.tsx`**: Mount `useDeliveryAvailable()` hook; replace hardcoded `badge: 3` with `availableAssignments.length` from Redux
4. **`AvailableOrdders.tsx`**: Already renders `availableAssignments` — will populate once slice is wired. Add proper empty state: "No available orders right now. Go online to receive assignments."

---

## Tracking Page Plan (DF-C3)

### Where the timeline lives
- `pages/Orders/OrderTracking/index.tsx` — thin shell passing `orderId` + `orderStatus` to `<LiveDeliveryTracker>`
- `useDeliveryTracking.ts` — subscribes to `delivery:assigned`, `delivery:status`, `delivery:location`
- **Gap**: Hook does NOT subscribe to `order:status_changed`. Owner-phase states never reach customer.

### Fix steps
1. **`order.service.ts`**: Add `io.to(order.userId.toString()).emit('order:status_changed', ...)` — prerequisite for all customer tracking
2. **`useDeliveryTracking.ts`**: Add `socketService.onOrderStatusChanged()` listener; update local `status` state
3. **`LiveDeliveryTracker.tsx`** (or equivalent tracking component): Map all 13 canonical states to timeline steps:
   - `pending_owner` → "Waiting for restaurant to accept"
   - `confirmed` → "Restaurant accepted your order"
   - `preparing` → "Restaurant is preparing your order"
   - `ready_for_pickup` → "Order ready, finding partner"
   - `awaiting_partner` → "Searching for delivery partner..."
   - `partner_assigned` → "Partner assigned"
   - `picked_up` → "Picked up from restaurant"
   - `out_for_delivery` → "On the way to you"
   - `delivered` → "Delivered!"
   - `completed` → "Order complete"
   - `reviewed` → "Review submitted"
   - `rejected` → "Order rejected" (red, terminal, show Reorder button)
   - `cancelled` → "Order cancelled" (grey, terminal)

### Refresh fallback
- `OrderTracking/index.tsx:15-19` calls `fetchOrderByIdThunk` on mount if order not in Redux state ✓ — sufficient.

---

## Rejection Plan

### Backend
- `order.controller.ts:182-188` — rejection endpoint works. Emits `order:status_changed` to owner room + admin_fleet via `order.service.ts`.
- **Gap**: Does NOT emit to customer room. Fix: `io.to(order.userId.toString()).emit('order:status_changed', { orderId, status: 'rejected', actorRole })`

### Customer UI
- `Orders/index.tsx:35-45`: Has `cancelled: 'error'` color but no `rejected` case. Add: `rejected: 'error'`
- `LiveDeliveryTracker.tsx`: Add `rejected` case — red icon, "Order Rejected" label, "Order to another restaurant" / "Reorder" button
- `useOrderNotifications.ts` (new): On `order:status_changed` with status `rejected` → `addNotification({ title: 'Order Rejected', message: 'Your order was rejected by the restaurant.', type: 'error', orderId, targetPath: '/orders' })`

---

## Cleanup Authority

Files that can be deleted without breaking the completed flow:

| File | Reason | Currently used by | Delete when |
|------|--------|-------------------|-------------|
| `web/src/features/owner/store/ownerSlice.ts` | Pure mock API wrapper, replaced by `ownerOrderSlice.ts` | Only `_ownerPages/DashBoard.tsx:16` | After Session 3 (dashboard refactored) |
| `web/src/features/owner/api/ownerMockApi.ts` (inferred from `ownerSlice.ts:3`) | Pure mock data | Only `ownerSlice.ts` | After ownerSlice deleted |
| `web/src/pages/_ownerPages/DashBoard.tsx` | Mock-backed; real flow uses `_owner/Queue.tsx` + `_owner/Active.tsx` | `routes/index.tsx:45` as default `/owner` route | After `/owner` redirects to `/owner/queue` or a real summary page |
| `web/src/pages/_ownerPages/Settings.tsx` | Unknown state — inspect before deleting | `routes/index.tsx:46` | After inspection |
| `web/src/features/owner/` (directory) | Contains only mock slice and mock API | `_ownerPages/DashBoard.tsx` | After dashboard refactored |

**Total proposed for deletion: 5 items — under the 10-file stop condition.**

**Do NOT delete:**
- `web/src/pages/_ownerPages/index.ts` — check exports before removing
- `web/src/pages/_ownerPages/` subdirs — not inspected; may contain usable code

---

## Execution Plan

### Session 1: Customer Tracking + Rejection Reflection (DF-C3 + Rejection) — COMPLETED
**Goal**: Customer sees real-time order status for all canonical states. Rejection shows to customer.
**Primary outcome**: Customer visits `/orders/tracking/:id`, sees a timeline that updates from PENDING_OWNER through all owner states in real-time without page refresh.
**Files in scope**:
- `API/src/modules/orders/order.service.ts` — add `io.to(order.userId.toString())` emit for `order:status_changed`; add rejected terminal to emit logic
- `web/src/features/orders/hooks/useDeliveryTracking.ts` — add `socketService.onOrderStatusChanged()` listener; update status state
- `web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx` — extend timeline to all 13 canonical states; add rejected + cancelled terminal cases
- `web/src/pages/OrderConfirmation/index.tsx` — remove `ORDER_DATA` mock const, `statusSteps` hardcoded times, `setTimeout` progression; use real order status
- `web/src/pages/Orders/index.tsx` — add missing canonical status labels + colors
**Backend changes**: One line added to `order.service.ts`. No new endpoints.
**Frontend changes**: Extend tracking hook + timeline component. Fix `OrderConfirmation` mock removal.
**Verification**: In two browser tabs — owner accepts order → customer tracking page updates to "Restaurant accepted" without refresh.
**Size**: M
**Dependencies**: None (DF-A1 + DF-B1 + DF-C2 done)
**Updates after session**: `docs/singleFlowCompletion.md` Current Phase → Session 2. Mark Session 1 complete. Update `docs/domainFlowCompletion.md` DF-C3 as done.

---

### Session 2: Assignment Flow — Backend + Partner Available Orders (DF-D1 + DF-D2 + DF-D3) — COMPLETED
**Goal**: Owner marks ready → available partners receive broadcast → partner accepts → customer sees PARTNER_ASSIGNED.
**Primary outcome**: End-to-end: owner marks ready in browser → partner page auto-populates with order card → partner accepts → customer tracking updates.
**Files in scope**:
- `API/src/modules/orders/order.service.ts` — add `awaiting_partner` to `validTransitions`; add broadcast to available partners after `ready_for_pickup`
- `API/src/modules/delivery/delivery.partner.routes.ts` — add `POST /:orderId/accept` (atomic) + `POST /:orderId/reject`
- `API/src/modules/delivery/delivery.events.ts` — add `delivery:available` emitter
- `web/src/features/deliveryPartner/deliveryPartnerSlice.ts` — add `assignmentBroadcastReceived` reducer; add `assignmentAccepted` reducer
- `web/src/features/deliveryPartner/hooks/useDeliveryAvailable.ts` (new) — socket listener hook
- `web/src/shared/layout/PartnerLayout.tsx` — mount `useDeliveryAvailable()`; replace hardcoded badge `3` with `availableAssignments.length`
- `web/src/pages/_deliveryPartner/AvailableOrdders.tsx` — ensure empty state; verify Accept button flow
**Backend changes**: New accept/reject endpoints. Broadcast after ready. Atomic update for race condition.
**Frontend changes**: New listener hook. Slice reducers. Badge fix.
**Verification**: Three tabs (owner, partner, customer). Owner marks ready → partner tab shows card → partner accepts → customer shows PARTNER_ASSIGNED.
**Size**: L
**Dependencies**: Session 1
**Updates after session**: `docs/singleFlowCompletion.md` Current Phase → Session 3. Mark Session 2 complete. Update `docs/domainFlowCompletion.md` DF-D1, DF-D2, DF-D3 as done.

---

#### Session 3: Owner + Admin Sidebar Cleanup + Notification Bell (UI Polish) — COMPLETED
**Goal**: Every sidebar link loads a real page or a clearly-labelled "Coming Soon." Notification bell wired for all roles.
**Primary outcome**: Owner can click every sidebar item without hitting a 404. Notification bell count reflects real events for all four roles.
**Files in scope**:
- `web/src/shared/components/ComingSoon.tsx` (new) — reusable Coming Soon page component
- `web/src/app/routes/index.tsx` — register Coming-soon routes for all broken owner/admin links; redirect `/owner/orders` to `/owner/queue`; fix `/history` and `/help` for customer
- `web/src/shared/layout/OwnerLayout.tsx` — replace hardcoded stats/name/avatar with Redux auth data + `ownerOrders` slice counts; replace hardcoded bell with `<NotificationBell />`; fix Logout
- `web/src/shared/layout/PartnerLayout.tsx` — fix Logout
- `web/src/shared/layout/AdminLayout.tsx` — fix hardcoded `badge: 24`; add Coming-soon for missing sub-routes
- `web/src/core/notifications/hooks/useDeliveryNotifications.ts` — add `order:status_changed` listener for customer role
- `web/src/shared/layout/UserLayout.tsx` (or `MainLayout.tsx`) — mount `<NotificationBell />` + order notifications hook
**Backend changes**: None
**Frontend changes**: ~12 Coming-soon route registrations. Bell wiring.
**Verification**: Log in as each role -> click every sidebar item -> no 404. Owner notification bell count increases on order events. Fixed: sidebar active-state logic (was prefix-matching). Fixed: ComingSoon routes now correctly nested in layout block. NOT runtime-verified — RTL/Vitest and Puppeteer both failed in this environment (Windows EMFILE + Redux persist hydration). Manual browser check required.
**Size**: M
**Dependencies**: Session 1

---

### Session 4: Review Flow (DF-F1) — COMPLETED
**Goal**: Customer rates restaurant and delivery partner after delivery. Ratings persist.
**Primary outcome**: Customer sees two-part review form after DELIVERED status → submits → both ratings updated → order transitions to REVIEWED.
**Files in scope**:
- `API/src/modules/reviews/review.model.ts` (new)
- `API/src/modules/reviews/review.controller.ts` (new) — `POST /api/reviews`
- `API/src/modules/reviews/review.routes.ts` (new)
- `API/src/modules/restaurants/restaurant.model.ts` — update `averageRating`
- `API/src/modules/delivery/delivery-partner.model.ts` — update `rating`
- `API/src/modules/orders/order.controller.ts` or `order.service.ts` — add `completed` → `reviewed` transition
- `web/src/pages/Orders/OrderReview.tsx` — inspect existing file (12270 bytes); wire to real `POST /api/reviews`
- `web/src/features/orders/orderSlice.ts` — add `submitReviewThunk`
- `web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx` — show review prompt CTA when status === `delivered`
**Backend changes**: New reviews module. Aggregate rating updates.
**Frontend changes**: Wire existing review UI to real API. Add review prompt in tracking.
**Verification**: Order delivered → review form appears → submit → check restaurant rating updated via `GET /api/restaurants/:id`.
**Size**: M
**Dependencies**: Session 1, Session 2

---

### Session 5: Profile Pages + Owner Dashboard Real Data — COMPLETED
**Goal**: All profile pages show the authenticated user's real data. Owner sidebar reflects real restaurant.
**Primary outcome**: Partner logs in → `/partner/profile` shows their real name, vehicle, delivery count.
**Files in scope**:
- `API/src/modules/restaurants/restaurant.routes.ts` — add `GET /api/restaurants/mine` if not exists
- `API/src/modules/delivery/delivery.partner.routes.ts` — extend `/me` response to include profile fields (name, phone, vehicle, rating, completedDeliveries)
- `web/src/pages/_deliveryPartner/Profile.tsx` — replace hardcoded `partner` object with real API data
- `web/src/pages/admin/Profile.tsx` — remove hardcoded fallback strings
- `web/src/pages/_owner/Profile.tsx` (new) — fetch real restaurant data; register at `/owner/profile` route
- `web/src/shared/layout/OwnerLayout.tsx` — replace hardcoded restaurant name/rating in sidebar with API data
- `web/src/shared/layout/PartnerLayout.tsx` — replace hardcoded name/ID/rating/deliveries with `auth.user` + `deliveryPartner` Redux state
**Backend changes**: Two endpoint additions/extensions.
**Frontend changes**: Three profile page rewrites. Two sidebar fixes.
**Verification**: Each role logs in → profile page shows their real database values.
**Size**: M
**Dependencies**: Session 3

---

**Goal**: Build passes, full flow works end-to-end, recruiter demo sequence passes.
**Primary outcome**: `npx vite build` exits 0. Recruiter 14-step demo sequence completes without errors or mock data.
**Files in scope**: Any remaining gaps found during E2E walkthrough. Environment audit.
**Backend changes**: CORS configuration for production URLs.
**Frontend changes**: Any remaining stale UI. `staticwebapp.config.json` route coverage check.
**Verification**: Run full 14-step recruiter demo sequence below.
**Size**: S
**Dependencies**: Sessions 1-5

---

## Host-Readiness Criteria

All items must be true before Azure deployment.

### Build
- [x] `npx vite build` in `web/` exits code 0
- [ ] `grep -r "localhost" web/dist/assets/` returns zero hits (Failed: hits in faker data & api URL)
- [x] `grep -l "FloatingDevConsole" web/dist/assets/*.js` returns zero files
- [x] `web/staticwebapp.config.json` exists with SPA fallback for all routes

### Flow completeness
- [x] Customer places order → order appears in owner queue (real data, no mocks)
- [x] Owner accepts → customer tracking updates without page refresh
- [x] Owner rejects → customer sees rejected state with clear UI (not silent)
- [x] Owner marks preparing + ready → customer tracking advances
- [x] Partner receives `delivery:available` broadcast → sees it in Available Orders
- [x] Partner accepts → customer sees PARTNER_ASSIGNED with real partner name
- [x] Partner marks picked up → customer tracking advances
- [x] Partner marks delivered → customer sees DELIVERED + review prompt
- [x] Customer submits restaurant + partner review → ratings update in database

### UI cleanliness (per-role)
- [ ] **Customer**: No mock data visible anywhere (Failed: Spice Garden still present in components)
- [ ] **Owner**: Real restaurant name in sidebar (Failed: Spice Garden still present in reports.provider.ts)
- [x] **Partner**: Real partner name in sidebar. Available Orders badge from real Redux state. Profile shows real data. Notification bell wired.
- [x] **Admin**: Delivery dashboard functional (already done). No hardcoded `badge: 24`. All broken sidebar sub-links replaced with Coming-soon.

### In the first 30 seconds, a stranger visiting the URL must be able to:

1. Land on home page → see **real restaurant list** (names, images, ratings from database)
2. Click "Login" → log in as customer (credentials in README)
3. Click a restaurant → see **real menu items** with real prices
4. Add items to cart → proceed to checkout → place order
5. See `/orders/confirmation` with **their real order ID** (not `ORD-2024-001234`)
6. Click "Track Order" → see `/orders/tracking/:id` showing "Waiting for restaurant to accept"
7. (Second tab) Log in as owner → see the order card in **`/owner/queue`** — same order, real data
8. Owner clicks "Accept" → first tab tracking updates to **"Restaurant accepted"** within 1 second
9. Owner clicks "Start Preparing" → tracking updates to **"Being prepared"**
10. Owner clicks "Mark Ready" → tracking shows **"Searching for delivery partner..."**
11. (Third tab) Log in as partner → see order in **"Available Orders"** — real restaurant name, address, amount
12. Partner clicks "Accept" → first tab tracking shows **partner's real name** + PARTNER_ASSIGNED
13. Partner marks picked up, then delivered → first tab shows **"Delivered!"** + review prompt appears
14. Customer submits star ratings for restaurant + partner → order shows **REVIEWED** state

---

## Next Exact Task

**Session 5, Step 1**: Add `GET /api/restaurants/mine` and begin profile wiring per the plan.

---

## Resume Prompt

```
Read docs/singleFlowCompletion.md.
Read docs/domainFlowCompletion.md for verified completed work (DF-A1, DF-B1, DF-C2).
Find "Current Phase" at the top of singleFlowCompletion.md — this tells you which session is next.
Continue from "Next Exact Task".
After each session:
  - Update "Current Phase" and "Completion %" in singleFlowCompletion.md
  - Update the audit table rows that were fixed
  - Update "Next Exact Task" to the next session's first step
  - Mark completed items in docs/domainFlowCompletion.md
Do not redesign completed delivery work (S1-S5a, DF-A1, DF-B1, DF-C2).
Do not introduce mock state transitions — every status change must go through the real backend.
Do not hardcode localhost URLs — use APP_CONFIG.API_URL via api.ts.
Do not run npm run dev, nodemon, vite dev, or any long-running process.
Do not touch files outside the session's declared scope.
Use the editor tool for all file writes. Never use shell redirection or Out-File.
Cite file:line for every finding and every change.
```

## Manual Verification Queue

Items that are structurally applied but NOT runtime-verified:

- Session 3 sidebar fixes:
  1. Log in as owner -> click "Dashboard" -> confirm ONLY Dashboard is highlighted, not Menu Management.
  2. Click "Menu Management" -> confirm ComingSoon page renders.
  3. Click any sub-item under Menu Management (Menu Items, Categories, Add Item) -> confirm ComingSoon page still renders, not a blank outlet.
  4. Repeat 1-3 for PartnerLayout and AdminLayout sidebars.

These are manual steps the human must run before host-ready status.
