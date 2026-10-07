# FoodHub End-to-End Completion Plan

## CURRENT STATUS
- Overall E2E: 100% (Core Flow Complete)
- Phase 1 — Data/Auth prerequisites: [Deferred]
- Phase 2 — API contract integrity: Build & Runtime-verified
- Phase 3 — Customer tracking + realtime: Build & Runtime-verified
- Phase 4 — Partner delivery lifecycle: Route & Runtime-verified
- Phase 5 — Admin & Polish: API & Runtime-verified
- Phase 6 — Persistent Notifications: Verified

## EVIDENCE
**Backend Integration Verification**
- `API/src/__tests__/multi-actor-e2e.test.ts`
- validates API/DB/server-side Socket.IO integration

**Browser/Product E2E Verification**
- `web/e2e.ts`
- Puppeteer
- separate Customer / Owner / Partner / Admin browser contexts
- actual UI actions
- Socket.IO client-side realtime updates
- Partner MUI dialogs
- Leaflet/GPS-related frontend state
- final Admin delivered-order visibility

*(The browser E2E is the final product-level verification. It was completed prior to Phase 6 and was not rerun merely for this notification feature.)*

**Persistent Notifications Verification (Phase 6)**
- `API/src/modules/notifications/notification.service.ts`
- persistent MongoDB Notification creation
- canonical Socket.IO `notification` event
- customer notifications for key order transitions
- owner new-order notification
- partner delivery-assignment notification
- cancellation notification
- delivery simulator notification path
- Redux notification hydration/read/read-all handling
- removal of frontend-generated duplicate notifications
- focused persistent-notification integration tests (`API/src/modules/notifications/__tests__/persistent-notification.test.ts`)
- isolated test database safety guard

Architecture:
```text
Domain action
    ↓
NotificationService
    ↓
MongoDB Notification
    ↓
Socket.IO "notification"
    ↓
App.tsx
    ↓
Redux notificationSlice
    ↓
NotificationBell / Toast
```

## REMAINING BLOCKERS
- Seed pipeline plaintext passwords (Auth prerequisite) [DEFERRED BY PROJECT DECISION].

## VERIFICATION
- **Build verification:** PASS (`npx tsc --noEmit` & `npm run build` on API & Web)
- **Backend Integration Verification:** PASS
- **Browser/Product E2E Verification:** PASS
- **Persistent Notification Verification:** PASS
- **Last Verified Commit:** `5aa883e643135d135c185cc7251d4f7e50a940f7`

## HISTORICAL DIAGNOSIS

*(Note: The following diagnosis describes the repository state at the beginning of the E2E completion effort and is preserved for historical engineering context. The issues described below have been resolved.)*

**How close was the repository to a working end-to-end FoodHub flow?**
**Historical Status:** ~75% complete but **0% End-to-End Functional**

The FoodHub repository contains a highly developed frontend and backend architecture with near-complete domain models, robust realtime sockets, and comprehensive Redux state slices. However, the application currently suffers from a series of critical "boundary failures" (primarily introduced during recent API standardizations and UI refinements) that completely break the end-to-end lifecycle. 

The core flow (Customer -> Owner -> Partner -> Customer) was broken at multiple junctures:
1. Customers cannot seed their auth properly or track their orders.
2. Owners and Partners cannot load data without crashing due to a regression in API response unwrapping.
3. Partners are fundamentally blocked from delivering an order due to an off-by-one error in the UI state machine and backend release logic.

Therefore, despite the large volume of code, the system cannot demonstrate a single successful delivery lifecycle from a clean development environment.

## B. Current Architecture/Flow Map

The intended flow relies heavily on WebSockets projecting backend status changes to the Redux state of multiple actors. The actual implemented flow (with identified breakages) is as follows:

```text
CUSTOMER
  ├─ browse restaurant/menu (Works)
  ├─ cart/checkout (Works)
  ├─ create order (Works)
  ├─ tracking spinner loops endlessly ❌ (Redux structural mismatch)
OWNER
  ├─ pending order (Fails to load) ❌ (API envelope regression)
  ├─ accept -> preparing -> ready for pickup (Blocked by load failure)
PARTNER
  ├─ available assignment (Fails to load) ❌ (API envelope regression)
  ├─ accept assignment (Works, but bypasses State Machine) ⚠️
  ├─ arrive at restaurant -> confirm pickup (Offset UI transitions) ❌ (Partner UI Off-by-one)
  ├─ out for delivery -> delivered (Fails to release partner) ❌ (delivery.service.ts)
CUSTOMER
  ├─ sees live/final order state (Fails) ❌ (Tracking page bug / Socket Kill Switch)
```

## C. Completion Blockers

### P0 - Blocks End-to-End Completion
- **The API Envelope Regression (REAL BUG):** The `api.ts` client was updated to unwrap `{ success, message, data }` responses, but Redux thunks (`ownerOrderApi`, `deliveryPartnerSlice`, `useAdminFleet`) still expect the wrapper and check `response.success` on raw data, causing silent drops or UI crashes.
- **Seed Pipeline Auth Failure (REAL BUG):** `factorySeed.ts` sends plaintext passwords which `insertMany` skips hashing. Seeded users cannot log in. `DEV_BYPASS_AUTH` currently hides this.
- **Partner UI Off-by-one (REAL BUG):** `ActiveDelivery.tsx` renders the *next* action button keyed to `index+1`, causing illegal state transitions (e.g., trying to transition from `picked_up` to `picked_up`).
- **Partner Release Bug (REAL BUG):** `delivery.service.ts` does not release the partner from `assigned` status after marking an order `delivered`.
- **Order Tracking Spinner (REAL BUG):** `OrderTracking` expects `currentOrder` to be populated, but `fetchOrderByIdThunk` only updates the `items[]` array in the slice.
- **Socket Kill Switch (REAL BUG):** `socket.off('event')` is called without specific callbacks in multiple hooks, wiping out global socket listeners and halting realtime updates.

### P1 - Required for credible production-like completion
- **Partner Accept Bypass (INCOMPLETE IMPLEMENTATION):** `POST /delivery/partner/:orderId/accept` bypasses the canonical order state machine and performs a raw `findOneAndUpdate`.
- **Admin Orders List 404 (INCOMPLETE IMPLEMENTATION):** Admin orders list calls `GET /orders/owned` which returns 404 for admins.

### P2 - Important but can wait
- **Missing Seed Data (TECHNICAL DEBT):** Missing partner fixed templates and restaurant locations in the seed pipeline.

## D. End-to-End Acceptance Matrix

| Step | Actor | Action | Backend | DB | Socket/Event | Frontend State | UI | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | System | Seed Database | `dev.controller` | Seeded | N/A | N/A | N/A | ❌ Broken auth |
| 2 | Customer | Login | Auth Controller | Token Valid | N/A | `authSlice` | Home | ❌ Fails w/o bypass |
| 3 | Customer | Place Order | Order API | Order Created | `order_created` | `orderSlice` | Success | ✅ Works |
| 4 | Owner | View Pending | Order API | Fetch | N/A | `ownerOrderApi` | Dashboard | ❌ API Envelope |
| 5 | Owner | Accept Order | `order.service` | Status: `accepted` | `order_status_updated` | `ownerOrderApi` | Dashboard | ❌ Blocked |
| 6 | System | Assign Partner | `delivery.service`| Delivery Created | `delivery_assigned`| N/A | N/A | ✅ Works |
| 7 | Partner | View Assigned | Delivery API | Fetch | N/A | `deliveryPartnerSlice`| Dashboard | ❌ API Envelope |
| 8 | Partner | Progress Delivery| Delivery API | Status Mutated | `delivery_status_updated`| `deliveryPartnerSlice`| Active Delivery | ❌ Off-by-one UI |
| 9 | Partner | Complete | `delivery.service`| Status: `delivered`| `order_delivered` | `deliveryPartnerSlice`| Dashboard | ❌ Partner not released |
| 10| Customer | Track Order | Order API | Fetch | `order_status_updated` | `orderSlice` | Tracking | ❌ Redux shape mismatch |

## E. Failure Analysis

**1. The API Boundary Collapse:**
A systematic change was made to the core `api.ts` client to simplify responses by stripping the `{success, data, message}` envelope. However, this change was not propagated to the consumers (Redux Slices/RTK Query). The slices still attempt to read `response.success`, which is now `undefined`. This creates a devastating, silent failure where backend mutations succeed but frontend state drops the data, breaking the UI.

**2. The Phantom Data Illusion:**
The seed script creates users with plaintext passwords. When `DEV_BYPASS_AUTH` is used, a phantom user with all roles is injected into the frontend, completely masking the fact that the actual authentication pipeline and role-based access control (RBAC) are fundamentally broken for seeded test data.

**3. State Machine Desyncs:**
The Partner UI (`ActiveDelivery.tsx`) and the Partner Backend do not agree on state transitions. The UI pushes the *next* state instead of acknowledging the current state, and the backend fails to reset the partner's availability once the terminal state (`delivered`) is reached.

## F. New Dependency-Aware Completion Plan

### PHASE 1 - Data Prerequisites & Auth Integrity
**Goal:** Ensure a developer can seed the DB and log in as any actor without dev bypasses.
**Dependencies:** None.
**Files/modules:** `factorySeed.ts`, `authSlice.ts`, `apiUtils.ts`.
**Required changes:** 
1. Update `factorySeed.ts` to hash passwords before `insertMany`.
2. Align `authSlice` (sessionStorage) with `apiUtils` (localStorage) token storage.
**Verification:** Seed the DB and login successfully as Customer, Owner, and Partner without `DEV_BYPASS_AUTH`.
**Exit criteria:** Real authentication yields valid JWTs.

### PHASE 2 - API Envelope Harmonization
**Goal:** Restore communication between frontend Redux thunks and the backend API.
**Dependencies:** Phase 1.
**Files/modules:** `ownerOrderApi.ts`, `deliveryPartnerSlice.ts`, `useAdminFleet.ts`.
**Required changes:** Update all thunks and RTK Query endpoints to stop checking `response.success` and correctly process the unwrapped `data` object returned by `api.ts`.
**Verification:** Owner and Partner dashboards successfully load data from the API without crashing.
**Exit criteria:** All `GET` requests populate Redux state correctly.

### PHASE 3 - Customer Tracking & Socket Integrity
**Goal:** Allow customers to actually view and track the order they just placed.
**Dependencies:** Phase 2.
**Files/modules:** `orderSlice.ts`, `OrderTracking/index.tsx`, multiple Socket hooks.
**Required changes:**
1. Fix `fetchOrderByIdThunk` to update `state.currentOrder` rather than just pushing to the items array.
2. Remove parameterless `socket.off('event')` calls across hooks to prevent wiping global listeners.
**Verification:** Customer tracking page loads the order and updates in real-time without the endless spinner.
**Exit criteria:** Real-time projection reaches Customer UI.

### PHASE 4 - Partner Delivery Lifecycle
**Goal:** Fix the delivery state machine so an order can actually be delivered.
**Dependencies:** Phase 2.
**Files/modules:** `ActiveDelivery.tsx`, `delivery.service.ts`, `delivery.partner.routes.ts`.
**Required changes:**
1. Fix the off-by-one button mapping in `ActiveDelivery.tsx` so states transition legally.
2. Update `delivery.service.ts` to clear `assignedOrder` and set status back to `available` upon delivery completion.
3. Fix the `accept` endpoint to use the canonical state machine instead of raw `findOneAndUpdate`.
**Verification:** Partner accepts order, arrives, picks up, and marks delivered. Partner is then free to accept a new order.
**Exit criteria:** Full Partner lifecycle executes cleanly.

### PHASE 5 - Admin & Polish
**Goal:** Restore basic Admin visibility.
**Dependencies:** Phase 4.
**Files/modules:** Admin Orders Hook/Component.
**Required changes:** Fix Admin Orders list to call a valid endpoint instead of the 404 `GET /orders/owned`.
**Verification:** Admin can view the list of all orders.
**Exit criteria:** Admin dashboard loads successfully.

## G. Critical Path

1. **Fix Auth Seeding** (Allows login).
2. **Fix API Envelopes in Slices** (Allows Owner/Partner to see the order).
3. **Fix Order Tracking Redux** (Allows Customer to see the order).
4. **Fix Socket Kill Switches** (Allows real-time flow).
5. **Fix Partner UI & Backend Release** (Allows order to be completed).

*This represents the absolute shortest path to a working overall flow.*

## H. Deferred Work

Do **NOT** touch the following yet:
- Phase 1 Auth Seeding (Project explicitly deferred this to focus on E2E functionality)
- Admin Fleet mapping and complex operational visibility tools.
- Complex review backend logic (ensure basic functionality first).
- External push notification services (FCM/Push). *(Note: Persistent in-app notifications are COMPLETE).*
- Stripe/Payment Gateway integrations (continue using mock/bypass for payment).
- UI/UX polish on the Partner and Admin dashboards.

## I. Final Verification Protocol

**Backend Verification:** (`API/src/__tests__/multi-actor-e2e.test.ts`)
Validates the Node.js/Express service boundaries, MongoDB constraints, canonical transition routes, and server-side Socket.IO emission logic via direct API requests. (STATUS: COMPLETED & VERIFIED)

**Browser Verification:** (`web/e2e.ts`)
Validates the React UI, RTK Query / Redux state machines, Socket.IO client transports, Leaflet Map integration, MUI dialogs, and GPS Simulator logic across four separate concurrent browser contexts via Puppeteer. (STATUS: COMPLETED & VERIFIED)

1. **Seed & Clean:** Run DB reset and seed pipeline.
2. **Customer:** Place Order via dev bypass. Verify `OrderTracking` loads and connects to Socket room.
3. **Owner:** See new order via Socket -> Accept Order -> Mark 'Ready for Pickup'.
4. **Partner:** See assigned order -> Accept -> 'Arrive' -> 'Pick Up' (with Dialog) -> 'Start Delivery' -> 'Deliver' (with Dialog).
5. **Customer:** Verify tracking UI updates to 'Delivered' in real-time.
6. **Partner:** Verify Partner returns to 'Available' state.
7. **Admin:** Verify Admin orders view accurately reflects 'Delivered' state.

## NEXT PHASE

**Target: Remaining Backlog**
**Specific Actions:**
- The Core Product Flow (Phases 2-5) is officially Complete and E2E Browser Verified.
- Persistent in-app notification architecture (Phase 6) is complete.
- Customer Profile Architecture (Phase 7) is complete and verified (avatar upload, profile fields, addresses, backend authorization).
- Phase 1 (Auth Seeding) remains explicitly deferred by project decision.
- Future work should now be selected from the remaining product/engineering backlog (e.g., payment integrations, UI polish, FCM push notifications).
