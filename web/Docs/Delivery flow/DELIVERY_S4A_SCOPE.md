- Maps to spec sections: §12 (reuse existing tracking), §13 (PIP experience),
  §14 (shared map component), §18 (notifications framework — read only this
  session, do not build yet), §19 (notification navigation — read only)

- Goal: The customer's live delivery tracking UI is wired to the canonical
  S2 socket contract. The existing tracking feature (useDeliveryTracking,
  LiveDeliveryTracker) consumes real-time updates from the backend. PIP mode
  works. No new tracking feature is created.

- In scope:
  1. Inspect existing web/src/features/orders/hooks/useDeliveryTracking.ts
     and web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx.
  2. Wire useDeliveryTracking to consume the S2 socket events:
     - delivery:assigned
     - delivery:status
     - delivery:location
     (These are the canonical events. Do not invent new ones.)
  3. The customer sees:
     - Partner assigned (name, phone)
     - Status timeline progressing through canonical states
     - Live partner marker moving on the map
     - ETA updates as location updates arrive
  4. Preserve and verify the existing PIP (Picture-in-Picture) mode:
     - Full view → Minimize → Floating draggable live map
     - Drag within viewport bounds
     - Restore to full view
     - Persist position across navigations
  5. Reuse the shared map component (web/src/shared/components/maps/Map.tsx).
     Do NOT introduce a second map library. Do NOT duplicate the camera fix
     from S3 — the shared map already handles it.
  6. Handle: loading, error, empty, and disconnected states (§26, §27).

- Out of scope (do NOT touch):
  - Admin fleet UI (S4b)
  - Notifications UI (S4c)
  - Partner UI (S3 — done)
  - Backend socket emitters (S2 — done)
  - Backend delivery model (S1 — done)
  - Image fallback, favorites, search (S5)
  - New MongoDB collections
  - Refactoring the shared Map component beyond what's needed
  - Any new UI redesign or visual polish

- Verification:
  - cd API && npx tsc --noEmit → passes
  - cd web && npx tsc -p tsconfig.app.json --noEmit → only pre-existing errors remain
  - Runtime proof: a headless test that
    a. mounts useDeliveryTracking with a mocked socket,
    b. emits a delivery:assigned event,
    c. asserts the hook state updates with partner info,
    d. emits a delivery:location event,
    e. asserts the hook state updates with new lat/lng,
    f. emits a delivery:status event,
    g. asserts the status timeline advances.
  - Manual/visual: cannot be runtime-verified headless. Note this explicitly.

- Acceptance:
  1. The customer tracking UI consumes S2 socket events directly. No mock data.
  2. PIP mode works: minimize, drag, restore, persist.
  3. Shared Map component is reused, not forked.
  4. Loading, error, empty, and disconnected states are handled.
  5. useDeliveryTracking is tested headlessly for at least 3 event types.
  6. No admin, notification, or partner code was touched.

## Socket Ownership
a. **Where it lives:** The socket connection is established globally in `App.tsx` (for authenticated users). The specific subscriptions for tracking (`delivery:status`, `delivery:location`, `delivery:assigned`) will be managed by a refactored `useDeliverySocket` hook mounted at the `LiveDeliveryTracker` container level.
b. **Multiple consumers:** To ensure multiple child components don't duplicate subscriptions or state, `useDeliveryTracking` will be refactored to read from a shared Redux slice (e.g., `ordersSlice.activeTracking`), and the container component will invoke `useDeliverySocket` to manage subscriptions.
c. **Reuse:** We will NOT create a second socket hook. We will refactor the existing `useDeliverySocket` from S3 to accept a role parameter: `useDeliverySocket('customer')` (and `'partner'`, `'admin'`). This keeps one place for event names and reconnection logic.

## ETA / distance — single source
a. The backend (`delivery:location` S2 event) currently does **not** compute or send ETA/distance.
b. The existing `useDeliveryTracking` hook *does* have local `etaSeconds` and `distance` state fields, expecting them from a mock event payload.
c. `web/src/core/utils/location.ts` already exists and has distance/time calculations.
**Decision:** We will extend `web/src/core/utils/location.ts` by adding a function named honestly: `estimateStraightLineETA`. We will add the comment: "DEMO: straight-line estimate, not road-network ETA." The frontend hook will compute this once on receiving `delivery:location` and store it in Redux.

## Verification:
  - cd API && npx tsc --noEmit → passes
  - cd web && npx tsc -p tsconfig.app.json --noEmit → only pre-existing errors remain
  - Runtime proof: a headless hook test for `useDeliveryTracking` (or the slice) that mocks the socket. **It MUST emit payloads matching the exact S2 types from `web/src/core/types/socket.events.ts`. No hand-rolled payloads.**

- Files you expect to touch (confirm during inspection — do NOT assume):
  web/src/features/orders/hooks/useDeliveryTracking.ts
  web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx
  web/src/features/orders/components/tracking/* (any related sub-components)
  web/src/services/socket.ts (only if a subscription helper is missing — do not redefine events)
  web/src/features/orders/__tests__/useDeliveryTracking.test.ts
