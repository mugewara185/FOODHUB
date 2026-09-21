# FoodHub — Domain Flow Completion
## Multi-Actor Marketplace + Simulator

---

## Current Phase

**DF-A2 — Align frontend types — NEXT**

---

## Track Map

| Phase-flow | Actors | Status |
|------------|--------|--------|
| **Customer flow** | Customer places, tracks, reviews order | Partial — tracking done (S4a), place/review incomplete |
| **Owner flow** | Owner accepts/rejects, marks preparing/ready | Missing entirely |
| **Assignment flow** | Broadcast-and-accept partner assignment | Dev-only simulation today |
| **Delivery flow** | Partner accepts, picks up, delivers | Built S1–S5a |

---

## Open Decisions (Recorded)

Five decisions from the earlier design session. **These are recommendations, not yet implemented.** Mark each as ACCEPTED or CHANGED before the relevant phase begins.

### Decision 1 — Order status vs Delivery status

**Question**: Should the canonical order lifecycle live on the `Order` model or the `Delivery` model?

**Recommendation**: **Order is canonical**. The `Order` model owns the full lifecycle status. The `Delivery` record projects a view into it (assigned partner, GPS route, timestamps). This matches the reality that an order exists before a delivery record is created and persists after delivery completes.

**Implication**: Every state-machine transition emits from the `Order` model. The `Delivery` model holds partner/route data, not lifecycle ownership.

**Status**: ACCEPTED — 2026-09-21
Decision 1 — ACCEPTED — Order is canonical; Delivery projects into it.

---

### Decision 2 — Assignment style

**Question**: When an order is ready for pickup, does the system auto-assign a partner, or do available partners receive a broadcast and accept?

**Recommendation**: **Broadcast-and-accept**. When an order reaches `READY_FOR_PICKUP`, available partners in range receive a Socket.IO broadcast. The first partner to accept wins. This mirrors real-world gig platforms and enables the multi-actor simulator (multiple partner strategies competing in real-time).

**Implication**: Assignment does NOT happen automatically. The `AWAITING_PARTNER` state is a real waiting state. A partner action causes the `PARTNER_ASSIGNED` transition.

**Status**: ACCEPTED — 2026-09-21
Decision 2 — ACCEPTED — Broadcast-and-accept assignment.

---

### Decision 3 — Owner accept style

**Question**: Does the owner manually accept/reject orders, or does the system auto-accept?

**Recommendation**: **Manual accept**. Owner sees incoming orders in `PENDING_OWNER` state and explicitly accepts or rejects. This makes the Owner flow a real actor in the simulator, produces meaningful multi-actor interactions, and avoids invisible state transitions.

**Implication**: `PENDING_OWNER` is a real waiting state. Owner inaction blocks progression. The simulator's owner strategy must include an accept/reject behavior.

**Status**: ACCEPTED — 2026-09-21
Decision 3 — ACCEPTED — Manual owner accept.

---

### Decision 4 — Payment

**Question**: Should payment processing be built in this workstream?

**Recommendation**: **Defer payment to its own vertical**. The current `Order` model has `paymentMethod` and `paymentStatus` fields. Model them as enum stubs (`pending`, `completed`, `failed`). Do not build a payment gateway, webhook, or reconciliation flow in this track. Mark `paymentStatus = completed` on order creation for simulator purposes.

**Implication**: Payment state exists in the data model but no payment logic is implemented. A dedicated payment vertical will own this later.

**Status**: ACCEPTED — 2026-09-21
Decision 4 — ACCEPTED — Payment deferred; paymentStatus stubbed.

---

### Decision 5 — Reviews

**Question**: Who reviews what after order completion?

**Recommendation**: **Customer rates both restaurant and delivery partner**. Two separate review records: one on the restaurant, one on the partner. Both trigger after the order reaches `COMPLETED`. The simulator's customer strategy should submit both.

**Implication**: The `reviews` module needs two review types. Aggregated ratings on Restaurant and DeliveryPartner models should be updated on each review submission.

**Status**: ACCEPTED — 2026-09-21
Decision 5 — ACCEPTED — Customer rates both restaurant and partner.

---

## Canonical State Machine

Every order passes through exactly one owner at each phase. No phase is shared.

```
CREATED
  │  (Customer submits order)
  ▼
PENDING_OWNER           ← Owner is responsible
  │  (Owner accepts)
  ├──► REJECTED         ← terminal: Owner rejected
  │
  ▼
CONFIRMED               ← Owner is responsible
  │  (Owner starts preparing)
  ▼
PREPARING               ← Owner is responsible
  │  (Owner marks ready)
  ▼
READY_FOR_PICKUP        ← Assignment is responsible
  │  (Broadcast to available partners)
  ▼
AWAITING_PARTNER        ← Assignment is responsible
  │  (Partner accepts broadcast)
  ▼
PARTNER_ASSIGNED        ← Delivery is responsible
  │  (Partner picks up from restaurant)
  ▼
PICKED_UP               ← Delivery is responsible
  │  (Partner en route)
  ▼
OUT_FOR_DELIVERY        ← Delivery is responsible
  │  (Partner arrives at customer)
  ▼
DELIVERED               ← Delivery is responsible
  │  (System confirms delivery)
  ▼
COMPLETED               ← System / Customer is responsible
  │  (Customer submits review)
  ▼
REVIEWED                ← terminal: review submitted
```

**Phase ownership summary**:

| Phase | States | Owner actor |
|-------|--------|-------------|
| Customer | CREATED | Customer |
| Owner | PENDING_OWNER → CONFIRMED → PREPARING → READY_FOR_PICKUP | Owner |
| Assignment | AWAITING_PARTNER → PARTNER_ASSIGNED | Assignment engine |
| Delivery | PICKED_UP → OUT_FOR_DELIVERY → DELIVERED | Delivery partner |
| Completion | COMPLETED → REVIEWED | Customer + System |

---

## Phase Plan

### Phase-flow A — State machine alignment

- [x] **DF-A1**: Canonicalize `Order` status enum on backend
  — Completed 2026-09-21. Enums updated across Order, Delivery, and all consumers. DB migrated (5 orders, 1 delivery). All tests pass.
    - `API/src/modules/orders/order.model.ts` — update `status` enum to canonical machine
    - `API/src/modules/orders/order.service.ts` — add/update transition guards
    - `API/src/modules/delivery/delivery.state.ts` — align delivery states to canonical machine; `Delivery` projects from `Order`
    - `API/src/modules/delivery/delivery.model.ts` — add `orderId` reference if missing
  - **Dependencies**: Decision 1 accepted
  - **Verification**: Existing backend state machine tests (`vitest`) pass with new enum; no state name regressions
  - **Definition of done**: `order.model.ts` enum matches canonical machine exactly; `delivery.state.ts` maps delivery-specific sub-states into canonical names without duplicating lifecycle ownership

- [ ] **DF-A2**: Align frontend types
  - **Files in scope**
    - `web/src/core/types/food.ts` — `Order` type status field aligned to canonical enum
    - `web/src/core/types/delivery.ts` — `DeliveryStatus` projected from canonical; no divergence from backend
    - `web/src/core/types/socket.events.ts` — socket event payloads use canonical status names
    - `API/src/modules/delivery/delivery.events.ts` — backend socket payloads aligned
  - **Dependencies**: DF-A1 complete
  - **Verification**: Frontend TypeScript `tsc --noEmit` produces no new errors related to status types; socket event roundtrip test passes
  - **Definition of done**: Both `food.ts` and `delivery.ts` status fields are a subset of the canonical machine with no invented states; `socket.events.ts` and `delivery.events.ts` are aligned

---

### Phase-flow B — Owner flow (missing entirely)

- [ ] **DF-B1**: Backend: Owner order management endpoints
  - **Files in scope**
    - `API/src/modules/orders/order.controller.ts` — add `PATCH /orders/:id/accept`, `PATCH /orders/:id/reject`, `PATCH /orders/:id/preparing`, `PATCH /orders/:id/ready`
    - `API/src/modules/orders/order.service.ts` — implement transition guards for owner actions
    - `API/src/modules/orders/order.routes.ts` — register new routes with `owner` RBAC middleware
    - `API/src/modules/delivery/delivery.events.ts` — emit socket events on each owner transition
  - **Dependencies**: DF-A1 complete; Decision 3 accepted
  - **Verification**: Manual API test: POST order → GET order (PENDING_OWNER) → PATCH accept (CONFIRMED) → PATCH preparing (PREPARING) → PATCH ready (READY_FOR_PICKUP); each step returns correct status
  - **Definition of done**: Four owner-action endpoints exist, guarded by `owner` role, emit correct socket events, enforce valid transitions (cannot jump from CREATED to PREPARING)

- [ ] **DF-B2**: Frontend: Owner dashboard — incoming orders
  - **Files in scope**
    - `web/src/features/orders/ownerOrderSlice.ts` — new Redux slice for owner's order queue; subscribes to `order:new` and `order:statusChanged` socket events
    - `web/src/pages/_owner/` — new or existing owner page directory
    - `web/src/pages/_owner/OrderQueue.tsx` — list of PENDING_OWNER orders with Accept/Reject actions
    - `web/src/pages/_owner/ActiveOrders.tsx` — CONFIRMED/PREPARING orders with Mark Ready action
    - `web/src/app/routes/index.tsx` — add `/owner/*` routes if not present
  - **Dependencies**: DF-B1 complete
  - **Verification**: Owner logs in → sees pending orders → accepts → order moves to CONFIRMED in both owner dashboard and customer tracking view in real-time
  - **Definition of done**: Owner can accept, reject, mark preparing, and mark ready via UI; each action triggers real backend transition and propagates via socket to all connected roles

---

### Phase-flow C — Customer flow completion

- [ ] **DF-C1**: Backend: Customer order placement
  - **Files in scope**
    - `API/src/modules/orders/order.controller.ts` — `POST /orders` creates order at `CREATED` status; emits `order:new` to owner socket room
    - `API/src/modules/orders/order.service.ts` — validate cart, compute total, set `paymentStatus: pending` (Decision 4: stub)
    - `API/src/modules/orders/order.routes.ts` — ensure `POST /orders` is customer-role guarded
  - **Dependencies**: DF-A1 complete; Decision 4 accepted
  - **Verification**: Customer places order → backend creates Order with `status: CREATED` → immediately transitions to `PENDING_OWNER` and emits to owner room
  - **Definition of done**: `POST /orders` returns new order with `PENDING_OWNER` status; owner receives `order:new` socket event; no hardcoded URLs in frontend placement code

- [ ] **DF-C2**: Frontend: Customer order placement flow
  - **Files in scope**
    - `web/src/features/orders/orderSlice.ts` — `placeOrder` thunk using `APP_CONFIG.API_URL` via `api.ts` (not hardcoded URL)
    - `web/src/pages/Orders/` — existing order pages; add placement confirmation UI
    - `web/src/features/cart/cartSlice.ts` — clear cart on successful placement
  - **Dependencies**: DF-C1 complete
  - **Verification**: Customer adds items → checks out → order appears in order history with `PENDING_OWNER` status; cart clears
  - **Definition of done**: End-to-end placement flow works against real backend; no mock/fake transitions

- [ ] **DF-C3**: Frontend: Customer order tracking (enhancement)
  - **Files in scope**
    - `web/src/pages/Orders/OrderTracking.tsx` (or equivalent) — display all canonical states, not just delivery states; show owner acceptance, preparation, partner assignment steps
    - `web/src/features/orders/useOrderTracking.ts` — subscribe to all `order:statusChanged` events for the order
  - **Dependencies**: DF-B2 complete, DF-C2 complete
  - **Verification**: Customer tracking view updates in real-time as owner accepts, marks preparing, partner picks up
  - **Definition of done**: Tracking timeline shows all canonical states with timestamps; no hardcoded status strings; socket-driven updates only (no polling)

- [ ] **DF-F1**: Customer review submission
  - **Files in scope**
    - `API/src/modules/reviews/` — add review endpoints for restaurant rating and partner rating (Decision 5)
    - `web/src/features/orders/` — add post-delivery review UI triggered when order reaches `COMPLETED`
    - `API/src/modules/restaurants/restaurant.model.ts` — update `averageRating` on review submission
    - `API/src/modules/delivery/delivery-partner.model.ts` — update partner `rating` field on review submission
  - **Dependencies**: DF-C3 complete; Decision 5 accepted
  - **Verification**: Customer submits restaurant + partner review → both records created → restaurant and partner ratings update → order transitions to `REVIEWED`
  - **Definition of done**: Two review records created; aggregated ratings updated; order status advances to `REVIEWED`; review UI only appears post-`COMPLETED`

---

### Phase-flow D — Assignment flow

- [ ] **DF-D1**: Backend: Broadcast to available partners
  - **Files in scope**
    - `API/src/modules/delivery/delivery.service.ts` — on `READY_FOR_PICKUP` event, query available partners in range; emit `delivery:available` broadcast to partner socket room
    - `API/src/modules/delivery/delivery.events.ts` — add `delivery:available` event type
    - `API/src/socket.ts` — ensure partner role has own socket room (`partner:${partnerId}` or `role:partner`)
  - **Dependencies**: DF-A1 complete; Decision 2 accepted
  - **Verification**: Owner marks order ready → backend queries available partners → socket broadcast received by connected partner clients within simulated range
  - **Definition of done**: `delivery:available` event fired with order details; only available (online) partners receive it; order status is `AWAITING_PARTNER`

- [ ] **DF-D2**: Backend: Partner accept endpoint
  - **Files in scope**
    - `API/src/modules/delivery/delivery.controller.ts` — `POST /delivery/:orderId/accept` — first-accept-wins; creates `Delivery` record; transitions order to `PARTNER_ASSIGNED`
    - `API/src/modules/delivery/delivery.service.ts` — implement idempotent first-accept logic (race condition guard)
    - `API/src/modules/delivery/delivery.events.ts` — emit `delivery:assigned` with partner info to customer and admin rooms
  - **Dependencies**: DF-D1 complete
  - **Verification**: Two partners call accept simultaneously → exactly one wins → other receives `already_assigned` response; order transitions to `PARTNER_ASSIGNED`
  - **Definition of done**: Race condition handled (optimistic lock or atomic update); `Delivery` record created with correct partner; `delivery:assigned` socket event fires

- [ ] **DF-D3**: Frontend: Partner receives and accepts assignment broadcast
  - **Files in scope**
    - `web/src/features/deliveryPartner/deliveryPartnerSlice.ts` — add `delivery:available` socket listener; add `acceptDelivery` thunk via `api.ts` (not hardcoded URL)
    - `web/src/pages/_deliveryPartner/` — add incoming assignment notification/modal UI
  - **Dependencies**: DF-D2 complete
  - **Verification**: Partner online → order becomes available → partner sees assignment offer → accepts → navigates to active delivery view
  - **Definition of done**: Partner flow works end-to-end with real backend; no hardcoded localhost URLs; existing active delivery GPS flow continues to work

---

### Phase-flow E — Multi-Actor Simulator

- [ ] **DF-E1**: Simulator infrastructure
  - **Files in scope**
    - `web/src/core/dev/simulator/SimulatorEngine.ts` — new; orchestrates actor strategies; dev-flag gated
    - `web/src/core/dev/simulator/types.ts` — `ActorStrategy`, `SimulatorConfig`, `SimulatorEvent`
    - `web/src/core/dev/simulator/SimulatorContext.tsx` — React context for simulator state
    - `web/src/core/dev/simulator/SimulatorControls.tsx` — dev UI: start/pause/reset, per-actor toggles, speed control
  - **Dependencies**: DF-A2 complete; dev flag (`IS_DEV`) gating established from CP-C2
  - **Verification**: SimulatorEngine instantiates without errors; controls render under `/dev/simulator`; no simulator code in production bundle
  - **Definition of done**: Simulator infrastructure exists; is dev-flag gated; `SimulatorEngine` has a pluggable strategy interface; no FoodHub domain logic inside the engine itself

- [ ] **DF-E2**: Customer strategy
  - **Files in scope**
    - `web/src/core/dev/simulator/strategies/CustomerStrategy.ts` — implements `ActorStrategy`; behaviors: place order, wait for delivery, submit review
    - Calls real `POST /orders`, `POST /reviews` via `api.ts`
  - **Dependencies**: DF-E1 complete; DF-C2 complete; DF-F1 complete
  - **Verification**: Simulator with customer strategy enabled auto-places an order using a seeded user; order appears in system; review submitted after `COMPLETED`
  - **Definition of done**: Customer strategy drives real API calls; no mock state transitions; configurable delay between actions

- [ ] **DF-E3**: Owner strategy
  - **Files in scope**
    - `web/src/core/dev/simulator/strategies/OwnerStrategy.ts` — implements `ActorStrategy`; behaviors: auto-accept after configurable delay, mark preparing, mark ready
    - Calls real `PATCH /orders/:id/accept`, `/preparing`, `/ready` via `api.ts`
  - **Dependencies**: DF-E1 complete; DF-B1 complete
  - **Verification**: Simulator with owner strategy enabled auto-accepts incoming orders; order progresses to `READY_FOR_PICKUP` without human interaction
  - **Definition of done**: Owner strategy drives real API calls; configurable accept delay (to simulate slow owners); emits correct socket events verifiable in `/dev/logs`

- [ ] **DF-E4**: Partner strategy
  - **Files in scope**
    - `web/src/core/dev/simulator/strategies/PartnerStrategy.ts` — implements `ActorStrategy`; behaviors: come online, accept first broadcast, simulate GPS route (reuses `gpsSimulator`), mark picked up, deliver
    - Calls real delivery endpoints via `api.ts`
    - Reuses `gpsSimulator.ts` from `packages/dev-tools/` (post CP-A2)
  - **Dependencies**: DF-E1 complete; DF-D2 complete; CP-A2 complete (gpsSimulator extracted)
  - **Verification**: Simulator with partner strategy enabled auto-accepts assignment; GPS moves on map; order transitions through PICKED_UP → OUT_FOR_DELIVERY → DELIVERED automatically
  - **Definition of done**: Partner strategy drives real backend transitions; GPS simulation runs on extracted `gpsSimulator`; customer tracking view updates in real-time from partner simulator activity

- [ ] **DF-E5**: Admin strategy + full demo mode
  - **Files in scope**
    - `web/src/core/dev/simulator/strategies/AdminStrategy.ts` — passive observer; no actions but monitors fleet state via socket
    - `web/src/core/dev/simulator/SimulatorControls.tsx` — "Run Full Demo" button: enables all four strategies simultaneously, opens four browser tabs or panels, each logged in as different role
  - **Dependencies**: DF-E2, DF-E3, DF-E4 complete
  - **Verification**: Full demo runs with customer + owner + partner strategies active; single order progresses from placement to review without human intervention; all four role views update in real-time
  - **Definition of done**: Demo is repeatable; no hardcoded data; works against real backend; can be demonstrated live as a portfolio showcase

---

## Verified Working

*(Will fill as phases complete. Reference delivery_status.md entries for S1–S5a already verified.)*

- S1–S5a: See `web/Docs/Delivery flow/delivery_status.md` — delivery partner flow, GPS simulation, customer tracking, admin fleet, notifications verified working end-to-end
- **DF-A1**: Order + Delivery status enums canonicalized. Pre-save hook fixed to skip validation on new documents. All backend test scripts pass. tsc clean.

---

## Known Gaps / Blockers

- **Frontend TS compilation**: `npx tsc --noEmit` in `web/` produces 3000+ pre-existing errors (noted in `delivery_status.md`). Focus only on delivery/order-specific code. Do not fix pre-existing errors in unrelated areas.
- **Order placement endpoint**: Unknown if `POST /orders` currently exists and enforces `CREATED → PENDING_OWNER` transition. Must inspect `API/src/modules/orders/` before DF-C1.
- **Owner pages**: No `/owner/*` pages confirmed to exist. Must inspect `web/src/pages/` before DF-B2.
- **Partner availability query**: DF-D1 requires a geospatial or status-based partner query. `delivery-partner.model.ts` has `currentLocation: GeoJSON Point` and `status` fields — but the query logic is unverified.
- **Hardcoded localhost URLs in delivery slice**: Must be fixed (CP-C1) before any simulator strategy calls delivery endpoints in a deployed environment.

---

## Debt / Deferred

Carried from `web/Docs/Delivery flow/delivery_status.md`:

- **Test infrastructure**: 4 files in `__tests__/` folders are standalone scripts run via `npx tsx`, not Vitest suites:
    - `API/src/modules/ai/__tests__/mcp.integration.test.ts`
    - `API/src/modules/ai/__tests__/smoke.test.ts`
    - `API/src/modules/delivery/__tests__/offline-rejection.test.ts`
    - `API/src/modules/dev/__tests__/assign-partner.test.ts`
  They cause false failures in `npm test` (Vitest reports "No test suite found"). Fix by renaming to `.script.ts` and moving out of `__tests__/`, OR by converting them to real Vitest suites. Not blocking.
- Display-only mocks in `useDeliveryTracking.ts`: `rating: 4.8` and `completedDeliveries: 420` are hardcoded. Fix when backend partner stats are added to socket payload.
- Legacy `socketService.onNotification` in `App.tsx` drops toast messages for old workflows. Disconnected from `notificationSlice`. Clean up in a dedicated refactor session.
- Backend does not yet emit `delayed` or `offline` states — handler stub in `useDeliveryNotifications` remains TODO.
- `useRestaurantLogic` and `useFavorites` are parallel paths — unify in dedicated refactor session, not opportunistically.
- S5b (Favorites) and S5c (Logger UI + FloatingTrigger) from delivery track are not started.

---

## Next Exact Task

**DF-A2**: Align frontend types with new backend enums.

1. Locate frontend types for `Order` and `Delivery`.
2. Update them to match the new canonical state machine.
3. Fix any resulting TypeScript errors in `web/`.

---

## Resume Prompt

```
Read docs/domainFlowCompletion.md.
Read web/Docs/Delivery flow/delivery_status.md for prior verified work.
Verify the last completed checkpoint (find [x] items in the Phase Plan).
Confirm the Open Decisions status before starting any dependent phase.
Continue from "Next Exact Task".
Do not redesign completed delivery work (S1-S5a).
Do not introduce mock state transitions — every status change must go through the real backend.
Do not hardcode localhost URLs — use APP_CONFIG.API_URL via api.ts.
Do not run npm run dev, nodemon, vite dev, or any long-running process.
Use the editor tool for all file writes. Never use shell redirection or Out-File.
```

---

## Related Docs

- `docs/architecturePlan.md` — parallel Track 1 (extraction, hosting, showcase)
- `docs/chatgpt-analysis.md` — repository analysis (type duplication, contract mismatches documented in Section 2.3)
- `web/Docs/Delivery flow/delivery_status.md` — living status for completed delivery work (S1–S5a)
- `web/Docs/Delivery flow/delivery_vertical_spec.md` — original delivery spec (domain model, socket contract, actor flows)
- `.agents/workflows/instructions.md` — project constitution (domain functionality is priority 4; Core Dev is priority 1)
