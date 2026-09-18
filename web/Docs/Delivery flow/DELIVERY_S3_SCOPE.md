# Session S3 - Partner UI + ActiveDelivery + GPS Simulator

## Maps to Spec Sections
§2 (Online/Offline single source of truth), §8 (partner flow), §9 (GPS simulator isolation), §15 (map camera), §21 (partner dashboard/history/earnings), §22 (server-validated actions)

## Goal
The partner UI is wired to the canonical delivery domain. The Online/Offline toggle has ONE source of truth. The GPS simulator is an isolated, reusable dev capability. Every action goes command → service → socket → state. No direct Redux mutations.

## In Scope
1. Remove the duplicate Online/Offline toggle in PartnerLayout (spec §2). The `deliveryPartnerSlice` is the single source of truth. ON_DELIVERY blocks going offline (invalid transition).
2. Wire `ActiveDelivery.tsx` to dispatch domain commands instead of locally mutating Redux. Every action button → service → socket → state.
3. Extract the GPS simulator out of `ActiveDelivery.tsx` into an isolated hook/service (spec §9). Deterministic movement. Configurable interval. Cleanup on unmount. No duplicate intervals. No movement when the delivery isn't in the correct state.
4. Fix the map camera behavior (spec §15): initial fit-to-bounds, no forced recenter on every GPS update, manual pan/zoom preserved, explicit recenter control.
5. Partner dashboard/history/earnings (spec §21): ensure values come from the delivery domain (mock or API per env). After delivery completes, history + earnings update via the domain flow, not local increments.
6. Every action button validates server-side; frontend shows the error cleanly if the backend rejects.

## Out of Scope (do NOT touch)
- Customer tracking UI (S4)
- Admin fleet UI (S4)
- Notifications UI (S4)
- Backend socket emitters (done in S2)
- Backend delivery model / state machine (done in S1)
- Image fallback, favorites, search (S5)
- Pre-existing frontend errors unrelated to delivery
- New MongoDB collections
- Any new UI redesign or visual polish

## Verification
- `cd API && npx tsc --noEmit` → passes
- `cd web && npx tsc -p tsconfig.app.json --noEmit` → S1/S2 errors gone; only pre-existing remain
- Runtime proof of the GPS simulator: unit test that starts the simulator, asserts N location updates are emitted at the configured interval, then stops, asserting no further updates. Runs headless with no browser.
- Runtime proof that ON_DELIVERY → OFFLINE is rejected: dispatch the command, assert the backend/service rejects it, assert the UI state does not change.

## Acceptance Criteria
1. Only ONE Online/Offline control exists in the partner UI.
2. `ActiveDelivery` does not directly mutate domain state in Redux.
3. GPS simulator is a standalone module (not inline in `ActiveDelivery`).
4. Illegal transitions (going offline during delivery) are rejected with a user-visible error, not a silent state corruption.
5. Map does not jump on every GPS update; user can pan; recenter works.
6. History and earnings update only via the domain flow.
7. No customer/admin/notification code was touched.

## Files You Expect to Touch
(To be confirmed during inspection — do NOT assume)
- `web/src/shared/layout/PartnerLayout.tsx`
- `web/src/pages/_deliveryPartner/ActiveDelivery.tsx`
- `web/src/pages/_deliveryPartner/PartnerDashboard.tsx`
- `web/src/pages/_deliveryPartner/DeliveryHistory.tsx`
- `web/src/features/deliveryPartner/deliveryPartnerSlice.ts`
- `web/src/services/socket.ts`
- `web/src/shared/components/maps/Map.tsx`
- New: The GPS simulator module (e.g., `web/src/core/dev/gpsSimulator.ts`)
- New: The S3 runtime tests
