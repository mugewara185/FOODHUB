# FoodHub End-to-End Completion Plan

# Current E2E Completion

- Overall E2E: 20%
- Phase 1 — Data/Auth prerequisites: [Deferred]
- Phase 2 — API contract integrity: 100% (Verified API envelope fixes)
- Phase 3 — Customer tracking + realtime: 50% (Fixed order tracking thunk; socket kill switch pending)
- Phase 4 — Partner delivery lifecycle: 0%
- Phase 5 — Admin & Polish: 0%
- Final E2E verification: 0%

**Current Blockers:** Socket kill switches breaking realtime updates. Partner UI off-by-one transitions.
**Last Verified Commit:** HEAD (5f2c963)

## A. Executive Diagnosis

**How close is the CURRENT repository to a genuinely working end-to-end FoodHub flow?**
**Status:** ~75% complete but **0% End-to-End Functional**

The FoodHub repository contains a highly developed frontend and backend architecture with near-complete domain models, robust realtime sockets, and comprehensive Redux state slices. However, the application currently suffers from a series of critical "boundary failures" (primarily introduced during recent API standardizations and UI refinements) that completely break the end-to-end lifecycle. 

The core flow (Customer -> Owner -> Partner -> Customer) is currently broken at multiple junctures:
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
- Admin Fleet mapping and complex operational visibility tools.
- Complex review backend logic (ensure basic functionality first).
- Notification services (FCM/Push).
- Stripe/Payment Gateway integrations (continue using mock/bypass for payment).
- UI/UX polish on the Partner and Admin dashboards.

## I. Final Verification Protocol

1. **Seed & Clean:** Run DB reset and seed pipeline.
2. **Customer:** Login as Customer -> Add to cart -> Checkout -> Place Order. Verify `OrderTracking` loads and connects to Socket room.
3. **Owner:** Login as Owner (separate browser) -> See new order via Socket -> Accept Order -> Mark 'Ready for Pickup'.
4. **Partner:** Login as Partner (separate browser) -> See assigned order -> Accept -> 'Arrive' -> 'Pick Up' -> 'Deliver'.
5. **Customer:** Verify tracking UI updates to 'Delivered' in real-time.
6. **Partner:** Verify Partner returns to 'Available' state.
7. **Admin:** Login as Admin -> View order history -> Confirm order shows as Delivered.

## J. Recommended Next Implementation Session

**Target: Phase 1 & 2 (Auth Seeding & API Envelope Fixes)**
**Specific Actions:**
1. Modify `API/src/modules/dev/dev.controller.ts` or `web/src/core/dev/utils/factorySeed.ts` (whichever executes the DB write) to securely hash passwords for seeded users.
2. Standardize token retrieval in `authSlice.ts` to match `apiUtils.ts` (`localStorage` vs `sessionStorage`).
3. Audit and patch `ownerOrderApi.ts` and `deliveryPartnerSlice.ts` to expect unwrapped `data` payloads from `api.ts`, removing all `if (res.success)` checks.
**Verification:** You should be able to log in with a seeded user, disable `DEV_BYPASS_AUTH`, and load the Owner Dashboard without frontend Redux errors.
