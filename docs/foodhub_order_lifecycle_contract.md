# FoodHub Order Lifecycle, Realtime State & Route Contract

**Version:** 1.0.0  
**Target Branch:** `dev/development`  
**Governing Completion Plan:** `docs/foodhub_end_to_end_completion_plan.md`  
**Protected Status:** IMMUTABLE WITHOUT EXPLICIT USER APPROVAL & REGRESSION TESTS  

---

## 1. Purpose & Scope

This contract defines the authoritative runtime boundaries, state machines, socket event contracts, and regression guarantees for FoodHub's multi-actor order lifecycle.

Following manual user verification and automated regression passes, the order lifecycle behaves correctly across all four actor roles (`Customer`, `Restaurant Owner`, `Delivery Partner`, `Admin`). This document establishes executable contract ownership and a strict firewall preventing inadvertent regressions during future feature work or AI-assisted development.

---

## 2. Protected Lifecycle Invariants

| ID | Invariant | Canonical Rule | Owner Modules | Enforcing Test Suites |
|---|---|---|---|---|
| **INV-1** | **Authoritative Order State** | The MongoDB backend is strictly authoritative for order progression: `pending_owner → confirmed → preparing → ready_for_pickup → awaiting_partner → partner_assigned → picked_up → out_for_delivery → delivered`. Client UI state must never bypass server validation. | `API/src/modules/orders/order.service.ts`<br>`API/src/modules/orders/order.model.ts` | `API/src/modules/orders/__tests__/lifecycle-invariants.integration.test.ts`<br>`API/src/modules/orders/__tests__/road-simulator-chat.integration.test.ts` |
| **INV-2** | **Legal Delivery Transitions** | Deliveries follow the strict transition graph: `partner_assigned → arrived_pickup → picked_up → out_for_delivery → nearby → delivered`. Moving an order to `picked_up` while delivery is in `partner_assigned` must sequentially step through `arrived_pickup` first to satisfy Mongoose schema validation. Direct illegal jumps are rejected with rollback. | `API/src/modules/orders/order.service.ts`<br>`API/src/modules/delivery/delivery.model.ts`<br>`API/src/modules/delivery/delivery.service.ts` | `API/src/modules/orders/__tests__/lifecycle-invariants.integration.test.ts`<br>`API/src/modules/delivery/__tests__/simulator-handoff.integration.test.ts` |
| **INV-3** | **Terminal-State Safety** | Deliveries and orders in terminal states (`delivered`, `cancelled`) are permanently locked. Calling `startDeliverySimulation` or processing delayed ticks on terminal deliveries refuses execution (`running: false, started: false, reason: 'terminal_status'`) without overwriting timestamps or metrics. | `API/src/modules/delivery/delivery.simulator.ts`<br>`API/src/modules/delivery/delivery.service.ts` | `API/src/modules/orders/__tests__/lifecycle-invariants.integration.test.ts`<br>`API/src/modules/delivery/__tests__/simulator-recovery.integration.test.ts` |
| **INV-4** | **Idempotent Delivery Simulation** | Concurrent start requests on the same delivery ID are serialized via `startingSimulators` mutex and `activeSimulators` timer map. Exactly one timer executes; duplicate requests return `{ running: true, started: false }`. Handoff confirmations for already-picked-up deliveries return 200 `{ alreadyHandedOff: true }` without crashing or scheduling duplicate transitions. | `API/src/modules/delivery/delivery.simulator.ts`<br>`API/src/modules/dev/dev.controller.ts` | `API/src/modules/orders/__tests__/lifecycle-invariants.integration.test.ts`<br>`API/src/modules/delivery/__tests__/simulator-recovery.integration.test.ts`<br>`API/src/modules/dev/__tests__/demo-launch.integration.test.ts` |
| **INV-5** | **Realtime Owner Order Rendering** | Owner dashboards register socket listeners (`onOrderNew`, `onOrderStatusChanged`, `onDeliveryStatusChanged`) immediately on mount without waiting for `isConnected`. Incoming orders normalize defensively and unshift into `pendingOrders` without requiring a page refresh. ID slicing must never crash on undefined. | `web/src/features/orders/hooks/useOwnerSocket.ts`<br>`web/src/features/orders/ownerOrderSlice.ts`<br>`web/src/features/orders/api/orderApi.ts`<br>`web/src/pages/_ownerPages/DashBoard.tsx` | `web/src/features/orders/__tests__/useOwnerSocket.test.tsx`<br>`web/src/features/orders/__tests__/orderSliceState.test.ts` |
| **INV-6** | **Cross-Role Chat Authorization & Scoping** | Only authenticated participants (`order.userId`, `restaurant.ownerId`, and assigned `delivery.partnerId` / `partner.userId`) may join rooms or send messages. Client-provided role strings cannot override verified database ownership. Messages broadcast strictly to authorized order and user rooms. Untargeted messages do not leak across role tabs in `OrderChat`. | `API/src/socket.ts`<br>`API/src/modules/orders/order.controller.ts`<br>`web/src/services/socket.ts`<br>`web/src/shared/components/OrderChat/OrderChat.tsx` | `API/src/modules/delivery/__tests__/socket-authorization.integration.test.ts`<br>`API/src/modules/delivery/__tests__/road-simulator-chat.integration.test.ts`<br>`web/src/features/orders/__tests__/liveDeliveryAndChatFixes.test.tsx` |
| **INV-7** | **Partner Synchronization & Polling Elimination** | While WebSockets are connected, background polling intervals are suspended (`if (!socketService.isConnected)`). `deliveryPartnerSlice.ts` only sets `isLoading = true` on initial page mount when no cached delivery or partner state exists, eliminating request storms and UI flutters. | `web/src/pages/_deliveryPartner/ActiveDelivery.tsx`<br>`web/src/features/deliveryPartner/deliveryPartnerSlice.ts` | `web/src/features/deliveryPartner/__tests__/deliveryBugs.test.tsx`<br>`web/src/features/showcase/__tests__/demoRecoverySynchronization.test.tsx` |
| **INV-8** | **Authoritative Reconnect & Recovery** | Server restarts invoke `recoverActiveDeliveries()` on boot to resume non-terminal simulations without state regression. Client reconnects re-fetch authoritative state from the server and advance forward stages monotonically, preventing out-of-order regressions. | `API/src/server.ts`<br>`API/src/modules/delivery/delivery.simulator.ts`<br>`web/src/features/showcase/components/InteractiveDemos.tsx` | `API/src/modules/delivery/__tests__/simulator-recovery.integration.test.ts`<br>`web/src/features/showcase/__tests__/demoRecoverySynchronization.test.tsx` |
| **INV-9** | **Live Map Route & Trail Distinction** | The shared map displays the courier's actual traversed trail as a **solid blue polyline** (`#1976D2`, weight 5, opacity 0.9). The remaining road route is rendered as a **dashed indigo/slate polyline** (`#5C6BC0`, `dashArray: '6, 6'`, weight 4). Straight-line fallbacks (when road routing is offline) are rendered as an **orange dashed line** (`#ff9800`, `dashArray: '8, 8'`, weight 3) and must never be falsely labeled as road routes. Malformed or NaN coordinates are safely discarded. | `web/src/shared/components/maps/Map.tsx`<br>`web/src/pages/_deliveryPartner/ActiveDelivery.tsx`<br>`web/src/features/showcase/components/InteractiveDemos.tsx`<br>`web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx` | `web/src/shared/components/maps/__tests__/Map.test.tsx` |

---

## 3. Event Contract Stability Matrix

All socket events must maintain strict payload backward-compatibility. Event names, identifiers, and coordinate shapes must not be changed without updating this contract and all consumers.

| Event Name | Direction | Room Scope | Mandatory Payload Fields | Coordinate Convention |
|---|---|---|---|---|
| `order:new` | Server → Client | Owner user room (`user_<ownerId>`) | `{ id: string, restaurantId: string, status: 'pending_owner', totalAmount: number, items: array }` | `{ lat, lng }` inside restaurant/deliveryInfo |
| `order:status_changed` | Server → Client | Owner room, Customer room, Admin fleet | `{ orderId: string, status: string, actorRole: string, timestamps?: object }` | N/A |
| `order_status_update` | Server → Client | Order room (`order_<orderId>`) | `{ orderId: string, status: string, actorRole: string, timestamps?: object }` | N/A |
| `delivery:location` | Server → Client | Order room, Partner user room | `{ deliveryId: string, orderId: string, location: { lat: number, lng: number }, etaSeconds: number, distanceRemainingMeters: number, status: string }` | `{ lat: number, lng: number }` |
| `delivery:status` | Server → Client | Order room, Admin fleet, Owner user room | `{ deliveryId: string, orderId: string, location: { lat: number, lng: number }, etaSeconds: number, distanceRemainingMeters: number, status: string, prevStatus?: string }` | `{ lat: number, lng: number }` |
| `delivery:assigned` | Server → Client | Order room, Customer room | `{ deliveryId: string, orderId: string, partnerId: string, partnerName: string, partnerPhone: string, status: string }` | N/A |
| `order:chat:send` | Client → Server | Client Socket | `{ orderId: string, message: string, recipientRole: string, auth?: { token, userId, role, devBypass } }` | N/A |
| `order:chat:receive` | Server → Client | Order room & Participant user rooms | `{ orderId: string, message: object, senderRole: string, recipientRole: string }` | N/A |

---

## 4. Protected-Change Policy

Any engineer or AI agent proposing a modification to the behaviors governed by this contract must adhere to the following protocol:

1. **Reproduction / Contract Test First:** Write a failing test that demonstrates the desired change or bug prior to modifying application code.
2. **Never Weaken Existing Invariants:** Existing invariants (`INV-1` through `INV-9`) must continue to pass. If an invariant must be altered:
   - Provide concrete evidence (e.g. business requirement or API redesign specification).
   - Update the invariant in this document and in `docs/foodhub_end_to_end_completion_plan.md`.
   - Obtain **explicit user confirmation** in the prompt before implementing the breaking change.
3. **Fail-Closed Test Database Guarantee:** Tests must never run destructively against production or default development databases. All integration test suites must assert dedicated test database strings (`test` or `e2e` in URI).
4. **CI Enforcement:** All pull requests and commits to `dev/development` must pass both the backend lifecycle suite (`npm run test:lifecycle` in `API`) and the frontend lifecycle suite (`npm run test:lifecycle` in `web`) in GitHub Actions.

---

## 5. Verification Command Reference

```bash
# Backend Lifecycle Invariants (44 tests)
cd API
npm run build
$env:MONGO_URI="mongodb://127.0.0.1:27017/FOODHUB3_TEST"
npm run test:lifecycle

# Frontend Lifecycle, Map & Synchronization (40 tests)
cd web
npm run build
npm run test:lifecycle
```
