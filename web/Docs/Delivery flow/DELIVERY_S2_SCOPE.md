# Session S2 - Socket.IO Contract

## Maps to Spec Sections
§8, §10, §11, §22

## Goal
Socket.IO events align with the canonical Delivery contract.
Backend emits on every state transition. Frontend partner listeners consume the new event shape. The S1 type cascade is fixed.

## In Scope
1. Fix the 4 files in the "S1 Blocker — Frontend Type Cascade" table (mechanical: id → orderId, add `import type`). ~8 lines total.
2. Define a typed Socket.IO event contract (payload shapes) for:
   - `delivery:assigned`
   - `delivery:status`
   - `delivery:location`
   - `partner:location_updated`
   Include explicit `deliveryId`, `orderId`, `partnerId` in every payload.
3. Wire backend emitters into delivery state transitions (service-layer, so they fire whenever status changes).
4. Update frontend partner listeners to consume the new contract.
5. Backend must reject emitting events with an ambiguous payload shape.

## Out of Scope (do NOT touch)
- Any new UI component
- GPS simulator logic
- Customer tracking UI
- Admin fleet UI
- Notification UI
- Pre-existing frontend errors unrelated to S1
- New MongoDB collections

## Verification (must include a real runtime round-trip)
- `cd API && npx tsc --noEmit` → passes
- `cd web && npx tsc --noEmit` → S1-caused errors gone; only pre-existing remain
- A runtime test that opens one client, emits a state transition, and asserts the client receives the correct typed event with all three IDs present and correct.

## Acceptance Criteria
1. S1 type cascade fully resolved (4 files, no new errors).
2. Every `delivery:*` / `partner:*` event carries explicit `deliveryId`, `orderId`, `partnerId`.
3. Backend emits on state transition; the emitter is called from the service layer, not scattered.
4. One runtime test proves a real round-trip.
5. No UI, GPS, or admin code was touched.

## Files You Expect to Touch
(To be confirmed during inspection)
- `API/src/modules/delivery/delivery.service.ts`
- `API/src/socket/*` or equivalent emitter location
- `web/src/services/socket.ts`
- `web/src/features/deliveryPartner/deliveryPartnerSlice.ts`
- `web/src/pages/_deliveryPartner/DeliveryHistory.tsx`
- `web/src/pages/_deliveryPartner/PartnerDashboard.tsx`
- New: The S2 runtime test file (e.g. `API/src/modules/delivery/test_socket_events.ts`)
