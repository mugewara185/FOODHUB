# FoodHub End-to-End Completion Plan

## CURRENT STATUS
- **Core Order Lifecycle (Local Environment):** 100% E2E runtime verified across Customer, Owner, Partner, and Admin.
- **Hosted Deployment Readiness:** Deployment Ready (Code & Blueprint configured; hosted runtime pending external provisioning).
- Phase 1 — Data/Auth prerequisites: [Deferred for test automation via bypass; real JWT auth active for production].
- Phase 2 — API contract integrity: Build, Runtime & Unit/Contract-verified (defensive envelope extraction across deliveryPartnerSlice thunks; verified in `deliveryBugs.test.tsx`).
- Phase 3 — Customer tracking + realtime: Build, Runtime & Redux-state verified (`fetchOrderByIdThunk` maintains `currentOrder` and `items[]`; verified in `orderSliceState.test.ts`).
- Phase 4 — Partner delivery lifecycle: Build, Runtime & E2E-verified.
- Phase 5 — Admin & Polish: Build, Runtime & E2E-verified.
- Phase 6 — Persistent Notifications: Build, Runtime & Integration-verified.
- Phase 7 — Customer Profile: Build, Runtime & Integration-verified.
- Phase 8 — Live Tracking Demo & Concurrency Hardening: Build, Runtime & E2E-verified.
- Phase 9 — Cross-domain Socket Chat & E2E Safety Hardening: Build, Runtime & E2E-verified.
- Phase 10 — Deployment Readiness (Azure SWA + Render): Code & Build-verified; Pending Cloud Provisioning.
- Phase 11 — Showcase-First Experience: Build, Runtime & Vitest-verified. Interactive multi-actor topology grid, component version swapper, telemetry console, honest status classification, and recruiter quick-scan.
- Phase 12 — Partner Delivery UI, Live Route Map, Progress State & Chat Hardening: Build, Runtime & Integration-verified on `dev/development`. Clean OpenStreetMap tiles, bounded OSRM road routing with instant straight-line fallback, canonical progress stepper, multi-actor tabbed chat with authorization, and fail-closed database safety.

## EVIDENCE
**API Contract Integrity & Order State Verification (Workstream A & B Cycle)**
- Baseline SHA: `62414e538f1aca41602a09395db12297c7466f73`
- Workstream A (Defensive API Envelope Unwrapping): `web/src/features/deliveryPartner/deliveryPartnerSlice.ts` defensively normalizes payloads via `action.payload?.data || action.payload` across `fetchPartnerStateThunk.fulfilled`, `setOnlineStatusThunk.fulfilled`, `updateAssignmentStatusThunk.fulfilled`, and `acceptAssignmentThunk.fulfilled`. Handled both `api.ts` unwrapped payloads and raw envelopes without dropping fields.
- Workstream B (Order Detail Redux State): Verified `fetchOrderByIdThunk.fulfilled` in `web/src/features/orders/orderSlice.ts` correctly updates `state.currentOrder = action.payload` and synchronizes `state.items[]` in-place.
- Unit & Contract Test Suites:
  - `web/src/features/deliveryPartner/__tests__/deliveryBugs.test.tsx`: 7/7 tests PASS (including contract unwrapping & rejection toasts).
  - `web/src/features/orders/__tests__/orderSliceState.test.ts`: 5/5 tests PASS (covering fetch orders, order-by-id currentOrder updates, array appends, in-place item updates, and error isolation).
- Web Production Build: `npm run build` in `web/` PASS (exit code 0, 0 build errors).

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

**Customer Profile Verification (Phase 7)**
- Core profile read
- Update allowed fields: name, phone, avatar
- Address add/remove integration
- Authenticated user isolation
- API persistence and Zod validation boundary
- Redux/AuthUser synchronization
- Integration tests (`API/src/modules/users/__tests__/profile.integration.test.ts`)
- *(Note: Broader account-page placeholders such as payments or account deletion remain outside Phase 7)*

**Live Tracking Demo (Phase 8)**
- `API/src/modules/delivery/delivery.partner.routes.ts`
- Rewritten partner acceptance route to fetch proper restaurant coordinates.
- Implemented deterministic demo fallback destination (since standard order lacks coordinates).
- Simulator correctly parameterized with valid distinct start, pickup, and destination points.
- Verified socket invariants (`delivery:location`, `delivery:status`, `delivery:assigned`) remain unchanged.
- Backend routing and typescript builds successfully validated.

## REMAINING BLOCKERS
- Seed pipeline plaintext passwords (Auth prerequisite) [DEFERRED BY PROJECT DECISION].
- **Security Hardening S01 (Deferred):** Intentionally deferred to the final hardening phase; pending and preserved outside the active API contract and order state cycles.

## VERIFICATION
- **Build verification:** TypeScript verification PASS (`npm run build` in API and web).
- **Backend Integration Verification:** PASS
  - Deterministic Simulator Handoff Tests (`API/src/modules/delivery/__tests__/simulator-handoff.integration.test.ts`): PASS
  - Simulator Concurrency & Terminal-State Safety Tests (`API/src/modules/delivery/__tests__/simulator-concurrency.integration.test.ts`): PASS
- **Persistent Notification Verification:** PASS
- **Delivery Simulator Rebuild & Concurrency Hardening (Phase 8):**
  - Implemented: PASS
  - TypeScript verification: PASS
  - Frontend build: PASS
  - Socket-event integration: PASS
  - Compare-and-Set Atomic Transition Guard: PASS (`status: { $in: ['picked_up', 'out_for_delivery', 'nearby'] }`)
  - Stale Write Protection: PASS (Early return on lost race halts tick immediately)
  - Cancellation-Race Protection: PASS (Proved in integration test: active in-memory tick cannot overwrite database cancellation or increment partner metrics)
  - Browser/UI Automation E2E: PASS (Fully verified 100% end-to-end via Puppeteer in `web/e2e.ts`. Orchestrated 4 distinct browser contexts across Customer, Owner, Partner, and Admin. Verified real-time socket transitions, moving Leaflet partner marker translation via simulator ticks, terminal delivered synchronization on customer and partner views, admin order visibility, and backend database state consistency).

  **Currently Verified (Phase 8 Final Gate):**
  - ActiveDelivery screen explicitly filters `delivery:status` and `delivery:location` payloads, rejecting events whose `orderId` or `deliveryId` do not match the active assignment.
  - Owner tracker isolation: `useLocalDeliveryTracking` dependencies safely decoupled; it no longer tears down or reconnects listeners repeatedly when the unrelated global tracking object resets.
  - Simulated `arrived_pickup` rigorously tested: Arrival no longer triggers automatic pickup. Only an explicit owner confirmation API call advances the state to `picked_up`.
  - Terminal completion (`delivered`) tested: Partner is released, delivery finishes correctly, and double completion is blocked.
  - Cancellation invariant tested: Stale in-memory active snapshot cannot overwrite cancellation or increment metrics.
  - Consistent Deterministic GPS Demo natively synchronizes map paths.
  - TypeScript builds cleanly for backend and frontend.

- **Cross-Domain Socket Chat & Hardened E2E Verification (Phase 9):**
  - Implemented: PASS
  - TypeScript verification: PASS
  - Frontend build: PASS
  - Socket relay implementation: PASS
  - Dedicated Test DB Safety Guard: PASS (Backend fail-closed guard rejecting destructive actions on non-test DBs; verified via `API/src/modules/dev/__tests__/dev.seed.test.ts`)
  - Scoped Fixtures & Zero Collection Wiping: PASS (Deterministic `deleteIds`/`deleteFilter` cleanup; zero blanket `clearFirst: true`)
  - Two-Way Realtime UI Chat Verification: PASS (Verified in browser: Customer sends message → Owner receives via Socket.IO; Owner sends reply → Customer receives via Socket.IO)
  - Strict Partner Marker Movement: PASS (Isolated Leaflet partner icon `img[src*="3209865"]` and tracked distinct 3D CSS coordinate translations)
  - Admin Isolated Row & Route Integrity: PASS (Eliminated `path="/*"` route hijacking; verified Admin isolated order row reaches `Delivered`)
  - Browser automated E2E: PASS (Automated browser test runner `web/e2e.ts` verified with 100% green checkmarks across 4 actors)

- **Deployment Readiness — Azure Static Web Apps & Render (Phase 10):**
  - Backend Build Verification: PASS (`npm run build` in `API` generates compiled `dist/server.js`)
  - Frontend Production Build Verification: PASS (`npm run build` in `web` compiles 15,975 modules via Vite)
  - Compiled Production Server Runtime Verification: PASS (`node dist/server.js` boots with `PORT=5050`, binds correctly, connects to DB, and returns HTTP 200 on `/health` and `/api/health`)
  - Integration Test Suite: PASS (`npm run test -- src/modules/delivery/__tests__/simulator-concurrency.integration.test.ts src/modules/delivery/__tests__/simulator-handoff.integration.test.ts src/modules/dev/__tests__/dev.seed.test.ts` passes 11/11 tests)
  - Security & Credential Masking: PASS (Sanitized `console.dir` in `API/src/config/env.ts` masks MongoDB connection string and JWT secret; dev seed endpoints return HTTP 403 in production)
  - CORS Origin Resolution: PASS (Flexible multi-origin resolver in `API/src/config/corsOrigin.ts` handles comma-separated origins and Azure Static Web Apps domains for both HTTP and Socket.IO)
  - Frontend Production Configuration: PASS (Production data source defaults to `api`; `socketUrl` automatically falls back to origin of `baseUrl` when omitted; `staticwebapp.config.json` excludes `/api/*` from SPA fallback and blocks `/dev/*` with 404)
  - Hosted Infrastructure Status: PENDING (Cloud provisioning required on Azure Static Web Apps and Render; public URLs not yet assigned)

- **Showcase-First Experience (Phase 11):**
  - Architecture Topology Grid: PASS (Interactive 5-node actor map Customer, Owner, Partner, Admin, Dev Core rendering live event loops, event channels, and contract schemas).
  - Interactive In-Browser Demos: PASS
    - GPS Tracking Simulator: Interactive stepped Leaflet map projection with courier marker interpolation.
    - Component Version Swapper: In-browser hot-swapping across `Home_V`, `Home_V2`, and `Home_V3` demonstrating `DevVersionRenderer`.
    - Live Telemetry & Logger: Dynamic subscription to `logger.subscribe()` with interactive trigger buttons for API, Socket, and Redux trace events.
  - Engineering Trade-Offs Accordion: PASS (5 deep-dive technical breakdowns: Atomic Transitions, Envelope Normalization, Dynamic Versioning, Socket Listener Cleanup, and Puppeteer Multi-Context E2E).
  - Recruiter Quick-Scan Mode: PASS (2-minute high-density summary toggle with key metric highlights, actor capabilities, and deep dive links).
  - Truthful Status Tags: PASS (Strict categorization into Verified E2E, Deterministic Simulation, Dual Transport, and Architectural Prototype).
  - Unit & Integration Test Suite: PASS (`src/features/showcase/__tests__/showcase.test.tsx` 9/9 tests pass; verified source file existence on disk, status tag validity, credential absence, and rendering).
  - Full Regression Test Suite: PASS (`src/features/showcase/`, `src/features/deliveryPartner/`, `src/features/orders/` 21/21 tests pass).
  - TypeScript Type Check: PASS (`npx tsc --noEmit` 0 errors).
  - Frontend Production Build: PASS (`npm run build` in `web` compiles cleanly in 1m 11s, exit code 0).

- **Partner Delivery UI, Live Route Map, Progress State & Chat Hardening (Phase 12 - dev/development):**
  - **Clean OpenStreetMap Standard Tiles:** PASS (`web/src/shared/components/maps/Map.tsx` switched from CartoDB to OpenStreetMap `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, completely removing the API-key watermark placeholder; preserves Flaticon courier marker URL `3209865`).
  - **Bounded Road Routing with Instant Straight-Line Fallback:** PASS (`web/src/core/utils/location.ts` implements `fetchRoadRoute` with strict 2.5s `AbortController` timeout and memoized cache; immediately paints direct straight-line fallback, upgrading to road path when available without blocking map render).
  - **Distinct Partner Navigation Markers & Simulator Tracking:** PASS (`ActiveDelivery.tsx` renders separate restaurant pickup, customer dropoff, and live partner courier markers with dynamic coordinates updated by live simulation ticks).
  - **Canonical Partner Progress Lifecycle:** PASS (Fixed MUI Stepper off-by-one bug `activeStep={activeStep}`; accurately reflects canonical states: 0: `partner_assigned`, 1: `arrived_pickup`, 2: `picked_up`, 3: `out_for_delivery`/`nearby`, 4: `delivered`; preserves terminal delivered view with completion banner and dashboard exit).
  - **Full Partner State Hydration:** PASS (`API/src/modules/delivery/delivery.partner.routes.ts` `/me` endpoint populates `orderId` and `restaurantId`, returning customer name, restaurant address, dropoff address, items, and coordinates).
  - **Cross-Domain Tabbed Socket Chat:** PASS (`OrderChat.tsx` supports multi-actor tabbed recipient switching across Partner ↔ Customer/Restaurant, Owner ↔ Customer/Driver, Customer ↔ Restaurant/Driver; optimistic UI rendering, Socket.IO broadcast, and persistence in `Order.chatMessages`).
  - **Strict Chat Authorization & Security:** PASS (`API/src/socket.ts` `isUserAuthorizedForOrder` and `order.controller.ts` `getOrderChat` enforce that only the order customer, restaurant owner, assigned partner, or admin can read/write chat; unauthorized users rejected with HTTP 403 / socket error).
  - **Fail-Safe Chat Persistence:** PASS (`order:chat:send` validates payload, binds sender strictly to authenticated user, enforces order authorization, and broadcasts via Socket.IO only AFTER successful MongoDB persistence; failed persistence emits error and aborts broadcast).
  - **Hardened Partner Location Socket Authorization (P0):** PASS (`partner:location_updated` strictly verifies authenticated user with partner role, resolves `DeliveryPartner` exclusively from user identity without trusting client `partnerId`, validates geographic coordinate bounds, verifies delivery assignment ownership, rejects spoofing/unauthorized payloads without modifying DB or broadcasting, and emits `delivery:location` only after successful database persistence).
  - **Fail-Closed Non-Test DB Safety:** PASS (Verified `/api/dev/db-info` identifies non-test DB; fail-closed safety guard halts integration and browser E2E tests if active DB lacks `test`/`e2e`; all tests ran strictly against isolated `FOODHUB3_TEST`).
  - **Backend Integration Tests:** PASS (`socket-authorization.integration.test.ts` 8/8 PASS, `simulator-concurrency.integration.test.ts` 3/3 PASS, `simulator-handoff.integration.test.ts` 4/4 PASS; total 15/15 delivery & socket integration tests PASS).
  - **Full Multi-Actor Browser E2E Verification:** PASS (`web/e2e.ts` automated Puppeteer run verified 100% green across 4 browser contexts: Customer places order → Owner marks Preparing & Ready → Partner accepts & active delivery view renders OpenStreetMap with pickup, customer, and partner markers → Partner marker moves live via simulator ticks → Two-way Partner ↔ Customer live chat confirmed → Chat persistence confirmed after reload → Stepper state confirmed preserved across refresh → Owner handoff confirmed → Customer reflects in-transit/delivered → Admin table row isolated to Delivered → Order document reaches delivered).
  - **Build Verification:** PASS (`npm run build` in `API` passes `tsc` with 0 errors; `npm run build` in `web` compiles cleanly in 1m 13s, exit code 0).
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
- Security Hardening S01 (Intentionally deferred to the final hardening phase)
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

**Target: First Hosted Order Lifecycle Verification**
**Prerequisites Completed (Phase 10):**
- Azure Static Web Apps build and routing configuration hardened (SPA fallback, edge 404 for `/dev/*`, build env variables forwarded).
- Render web service blueprint (`render.yaml`) created with production build & start commands, health checks, and environment configurations.
- API security and CORS origin handling hardened to allow multi-origin matching (`CLIENT_URL`) and credential masking.
- Backend production runtime (`node dist/server.js`) verified with dual health checks (`/health` and `/api/health`).

**Exact Remaining User Actions for Public Cloud Deployment:**
1. **Azure Static Web Apps:** Connect GitHub repository, configure GitHub Secret `AZURE_STATIC_WEB_APPS_API_TOKEN`, and configure GitHub Repository Variable `VITE_API_URL` to point to the Render API endpoint (e.g. `https://foodhub-api.onrender.com/api`).
2. **Render:** Create Web Service using `render.yaml` blueprint or manual setup, configure `MONGO_URI` (MongoDB Atlas connection string) and `CLIENT_URL` (the assigned Azure Static Web Apps URL).
3. **Verify Hosted Lifecycle:** Run the end-to-end customer → owner → partner → customer flow against the deployed hosted URL.
