# FoodHub — API Contract Reference
> Single source of truth for endpoints, socket events, and auth model.
> All routes verified from `API/src/modules/*/*.routes.ts` at commit `0b34297`.

---

## Part A — Frontend-Consumed Endpoints

### Auth (`API/src/modules/auth/auth.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| Login page | POST | `/api/auth/login` | none | `{ email, password }` | `{ token, user }` | JWT returned in body |
| Signup page | POST | `/api/auth/register` | none | `{ name, email, password, roles[] }` | `{ token, user }` | roles array — use `['user']` for customers |
| Forgot password | POST | `/api/auth/forgot-password` | none | `{ email }` | `{ message }` | inspect controller for email flow |
| Reset password | POST | `/api/auth/reset-password` | none | `{ token, newPassword }` | `{ message }` | token from email link |
| Profile refresh | GET | `/api/auth/me` | Bearer (any role) | — | `{ user }` | returns current user object |

### Restaurants (`API/src/modules/restaurants/restaurant.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| RestaurantsList, Home | GET | `/api/restaurants` | none | — | `{ data: Restaurant[] }` | public; used by `restaurantSlice_V.ts:70` |
| RestaurantDetails | GET | `/api/restaurants/:id` | none | — | `{ data: Restaurant }` | public |
| OwnerLayout, AdminLayout | GET | `/api/restaurants/mine` | Bearer (owner, admin) | — | `{ data: Restaurant }` | returns owner's own restaurant |

### Orders — Customer (`API/src/modules/orders/order.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| Checkout | POST | `/api/orders` | Bearer (user) | `{ restaurantId, items[], deliveryAddress }` | `{ data: Order }` | inspect controller for full item shape |
| Orders page | GET | `/api/orders` | Bearer (any) | — | `{ data: Order[] }` | returns authenticated user's own orders |
| OrderTracking | GET | `/api/orders/:id` | Bearer (any) | — | `{ data: Order }` | single order by ID |
| Orders page cancel | PATCH | `/api/orders/:id/cancel` | Bearer (user) | — | `{ data: Order }` | only cancels if status allows; inspect service |

### Orders — Owner (`API/src/modules/orders/order.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| Queue, Active, AdminOrders | GET | `/api/orders/owned` | Bearer (owner, admin) | — | `{ data: Order[] }` | all orders for owner's restaurant; admin sees all |
| Queue (Accept) | PATCH | `/api/orders/:id/accept` | Bearer (owner, admin) | — | `{ data: Order }` | transitions status to `confirmed` |
| Queue (Reject) | PATCH | `/api/orders/:id/reject` | Bearer (owner, admin) | — | `{ data: Order }` | transitions status to `rejected` |
| Active (Start Preparing) | PATCH | `/api/orders/:id/preparing` | Bearer (owner, admin) | — | `{ data: Order }` | transitions to `preparing` |
| Active (Mark Ready) | PATCH | `/api/orders/:id/ready` | Bearer (owner, admin) | — | `{ data: Order }` | transitions to `ready_for_pickup` |

### Delivery — Partner (`API/src/modules/delivery/delivery.partner.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| PartnerDashboard, Profile | GET | `/api/delivery/partner/me` | Bearer (partner) | — | `{ data: PartnerState }` | current state only; no history |
| Partner online/offline toggle | PATCH | `/api/delivery/partner/me/status` | Bearer (partner) | `{ isOnline: boolean }` | `{ data: PartnerState }` | inspect controller |
| AvailableOrders (Accept) | POST | `/api/delivery/:orderId/accept` | Bearer (partner) | — | `{ data: Delivery }` | creates Delivery doc; emits socket events |
| AvailableOrders (Reject) | POST | `/api/delivery/:orderId/reject` | Bearer (partner) | — | `{ message }` | inspect controller |

### Delivery — Status Update (`API/src/modules/delivery/delivery.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| ActiveDelivery (status advance) | PATCH | `/api/delivery/:id/status` | **none (TODO in code)** | `{ status }` | inspect controller | ⚠️ no auth middleware — `delivery.routes.ts` has TODO comment |

### Delivery — Admin (`API/src/modules/delivery/delivery.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| AdminDeliveryDashboard (Fleet) | GET | `/api/delivery/fleet` | Bearer (admin) | — | `{ data: FleetEntry[] }` | returns all active deliveries + partner locations |
| AdminAI copilot | POST | `/api/delivery/copilot` | Bearer (admin) | inspect controller | inspect controller | AI dispatch endpoint |

### Reviews (`API/src/modules/reviews/review.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| OrderReview page | POST | `/api/reviews` | Bearer (user) | `{ orderId, restaurantRating: number, partnerRating: number, comment?: string }` | `{ data: Review }` | **Both ratings must be `number` type — string causes 400** |

> ⚠️ **Common 400 cause:** sending `restaurantRating` as a string (`"4"`) instead of a number (`4`). The controller checks `typeof restaurantRating !== 'number'` at `review.controller.ts:22`.
> ⚠️ Order must have `status === 'delivered'` or 400 is returned (`review.controller.ts:31`).
> ⚠️ A delivery record must exist for the order (partner ID lookup) or 400 is returned (`review.controller.ts:47`).

### Users (`API/src/modules/users/user.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| Profile page | PATCH | `/api/users/profile` | Bearer (any) | `{ name?, email?, avatar? }` | inspect controller | partial update |
| Address save | POST | `/api/users/addresses` | Bearer (any) | inspect controller | inspect controller | |
| Favorite restaurant | POST | `/api/users/favorites/:restaurantId` | Bearer (any) | — | inspect controller | toggle |
| Favorite food item | POST | `/api/users/favorites/food/:foodItemId` | Bearer (any) | — | inspect controller | toggle |
| Admin user list | GET | `/api/users/admin` | Bearer (admin) | — | `{ data: User[] }` | all users |
| Admin user detail | GET | `/api/users/admin/:id` | Bearer (admin) | — | `{ data: User }` | |
| Admin user update | PATCH | `/api/users/admin/:id` | Bearer (admin) | inspect controller | inspect controller | |
| Admin user delete | DELETE | `/api/users/admin/:id` | Bearer (admin) | — | `{ message }` | |

### Admin Analytics (`API/src/modules/analytics/analytics.routes.ts`)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| AdminDashboard | GET | `/api/admin/analytics/dashboard` | Bearer (admin) | `?period=day\|week\|month` | inspect controller | Returns aggregated revenue, order counts, restaurant metrics |

### AI (`API/src/modules/ai/ai.routes.ts` — if exists)

| Consumer | Method | Path | Auth | Request shape | Response shape | Notes |
|----------|--------|------|------|--------------|---------------|-------|
| AdminAIPage | POST | `/api/ai/...` | Bearer (admin) | inspect `AdminAIPage.tsx:37` for exact path | inspect controller | AI integration paused; not cost-free |

---

## Part B — Socket Event Reference

All events are emitted **server → client** unless noted. Backend is on `API/src`.

| Event | Emitted from (file:line) | Room(s) | Payload shape | Frontend consumer (file:line) | Gap? |
|-------|--------------------------|---------|--------------|------------------------------|------|
| `order:new` | `order.controller.ts:66` | owner room | `{ orderId, order }` | `useOwnerSocket` → `ownerOrderSlice.orderReceived` | None ✓ |
| `order:status_changed` | `order.service.ts:71,79,85` | ownerId, userId, admin_fleet | `{ orderId, status, order }` | `useDeliveryNotifications.ts:119` → `notificationSlice.addNotification` | **Gap: customer `orderSlice.items[]` not updated directly by this event** |
| `order_status_update` | `order.controller.ts:153`, `order.service.ts:67`, `delivery.simulator.ts:127` | orderId room, userId room | `{ orderId, status }` | `App.tsx:70` → `orderSlice.updateOrderStatusLocally` | Partial — updates `currentOrder` + `items[]` (`orderSlice.ts:274`) |
| `delivery:assigned` | `delivery.events.ts:49–55` | orderId, admin_fleet, partnerUserId, customerUserId | `{ deliveryId, orderId, partnerId, restaurantName?, customerName? }` | `useDeliverySocket` → `deliveryPartnerSlice.assignmentReceived`; `useDeliveryNotifications` → bell | None ✓ |
| `delivery:status` | `delivery.events.ts:37–40` | orderId, admin_fleet, partnerUserId | `{ deliveryId, orderId, status }` | `useDeliverySocket` → `deliveryPartnerSlice.updateAssignmentStatus`; `useDeliveryNotifications.ts:52–80` | **Gap: customer handler fires only on `delivered`; intermediate statuses dropped** |
| `delivery:location` | `delivery.events.ts:61–62`, `delivery.simulator.ts:119–120` | orderId, admin_fleet | `{ deliveryId, orderId, location: { lat, lng } }` | `LiveDeliveryTracker` via `socketService.onDeliveryLocation` | Needs verification in `LiveDeliveryTracker.tsx` |
| `delivery:available` | `delivery.events.ts:81` | partnerUserId | `{ orderId, restaurantName, pickupAddress, deliveryAddress }` | `useDeliveryAvailable` → `deliveryPartnerSlice.assignmentAvailable` (mounted in `PartnerLayout.tsx:61`) | None ✓ |
| `delivery:released` | `delivery.events.ts:72–73` | orderId, admin_fleet | `{ deliveryId, orderId }` | **No consumer** | **Gap — deferred (Section 9 of plan)** |
| `delivery:risk` | `risk.engine.ts:73` | admin_fleet | `{ deliveryId, reason, severity }` | **No consumer** (U5 adds one to `useAdminFleet`) | **Gap — U5 fixes** |
| `delivery:risk_cleared` | `risk.engine.ts:79` | admin_fleet | `{ deliveryId }` | **No consumer** (U5 adds one to `useAdminFleet`) | **Gap — U5 fixes** |
| `notification` | `order.controller.ts:154`, `delivery.simulator.ts:131` | userId (customer) | `{ title, message, orderId, status }` | `App.tsx:60` → `showToast` only | **Gap: `addNotification` NOT dispatched — U2/U-Notification fixes** |
| `join_user_room` | emitted **client → server** | — | `userId` | `socketService.joinUserRoom` → `socket.ts:99` | Required for userId-addressed events to arrive |
| `join_order_room` | emitted **client → server** | — | `orderId` | `socketService.joinOrderRoom` → `socket.ts:103` | Required for order-specific events |
| `join_admin_fleet` | emitted **client → server** | — | — | `socketService.joinAdminFleet` → `socket.ts:138` | Required for admin to receive fleet events |

---

## Part C — Auth Model

### Token format
```
Authorization: Bearer <jwt>
```
JWT payload shape (signed by backend, verified by `auth.middleware.ts`):
```json
{ "id": "<userId ObjectId string>", "roles": ["<role>"] }
```

### Role strings (exact literals — do not normalize or title-case)

| Role | String value | Scope |
|------|-------------|-------|
| Customer | `'user'` | Place orders, cancel, review, favorites |
| Restaurant owner | `'owner'` | Manage queue/active, view own restaurant |
| Delivery partner | `'partner'` | Accept/reject deliveries, update status |
| Platform admin | `'admin'` | All owner access + fleet + users + analytics |

**Source:** `allowedRoles` check in `auth.middleware.ts:authorize(...)`.
Multiple roles per user are possible (array). Admin inheriting owner access works because `authorize(['owner','admin'])` accepts either.

### Middleware chain

| Middleware | File | Behavior |
|-----------|------|---------|
| `protect` | `auth.middleware.ts` | Verifies JWT; attaches `req.user = { id, roles }`; 401 if missing/invalid |
| `authorize(...roles)` | `auth.middleware.ts` | Checks `req.user.roles` intersects allowed list; 403 if no match |

Route registration pattern (example):
```typescript
router.get('/owned', protect, authorize('owner', 'admin'), getOwnedOrders);
```

---

## Part D — Common Failure Signatures

| Status | Backend message pattern | Most likely frontend cause |
|--------|------------------------|--------------------------|
| **400** | `"Missing required fields"` | Wrong payload field names (e.g. `rating` instead of `restaurantRating`); or a required field is `undefined` at the call site |
| **400** | `"Order must be delivered before it can be reviewed"` | Calling `POST /api/reviews` before delivery lifecycle completed; order status is not `delivered` |
| **400** | `"Order has already been reviewed"` | Duplicate review submission; guard with local state (`status === 'reviewed'`) |
| **400** | `"No delivery partner found for this order"` | Delivery record doesn't exist; partner never accepted; or simulator-only flow with no real Delivery doc |
| **401** | `"Not authorized, no token"` | `Authorization` header missing; JWT not attached to request |
| **401** | `"Not authorized, token failed"` | JWT expired, tampered, or signed with wrong secret |
| **403** | `"Not authorized for this resource"` | Token valid but role not in `authorize()` list for that route; e.g. `user` hitting `/api/orders/owned` |
| **404** | `"Order not found or does not belong to user"` | Wrong `orderId`, or order belongs to a different user (cross-user access attempt) |
| **404** | `"Restaurant not found"` | Invalid `:id` param; or restaurant deleted after cache populated |
| **409** | (inspect controller) | Duplicate key in MongoDB (e.g. email already registered) |
| **500** | Stack trace in dev; `"Internal server error"` in prod | Unhandled exception; check `NODE_ENV`; in dev the stack is returned in `error.stack` field — paste it verbatim when reporting |

### Debugging pattern for a 400 from the review endpoint

```
1. Confirm order status === 'delivered':
   GET /api/orders/:id → check body.data.status

2. Confirm delivery record exists:
   Check MongoDB: db.deliveries.findOne({ orderId: ObjectId("<id>") })

3. Confirm payload types:
   typeof restaurantRating === 'number'  (not string)
   typeof partnerRating   === 'number'  (not string)
   orderId is a non-empty string

4. Confirm auth:
   Token present + role === 'user' (customer places review)
```

### Debugging pattern for socket events not arriving

```
1. Check user room join:
   socket.ts:99 joinUserRoom(userId) must be called after connect
   Look for 'join_user_room' emit in DevTools → Network → WS frames

2. Check order room join (for order-specific events):
   socket.ts:103 joinOrderRoom(orderId) must be called
   Look for 'join_order_room' emit

3. Check VITE_SOCKET_URL:
   socket.ts:33 — empty string means same-origin; must match backend host in cross-origin deployments

4. Check backend room emit:
   Add io.to(room).emit log temporarily; confirm the room name matches what the client joined
```
