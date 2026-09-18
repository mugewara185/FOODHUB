- Maps to spec section: §16 (admin delivery dashboard)
- Goal: The admin fleet view consumes the canonical S2 socket events via `useDeliverySocket('admin')`. No hardcoded mockFleet remains in API mode. Initial snapshot + realtime updates + connection state.

- In scope:
  1. Inspect `web/src/pages/admin/delivery/index.tsx` (current state — likely has `const mockFleet = [...]`)
  2. Replace mockFleet with:
     - An initial snapshot fetch (endpoint or existing service — inspect what exists; if none, propose the smallest backend addition and ask before implementing)
     - Realtime updates via `useDeliverySocket('admin')` consuming: `delivery:status`, `delivery:location`
  3. Fleet view must show:
     - Active deliveries (partners currently on delivery)
     - Online partners (available but not on delivery)
     - Partner locations on the shared Map
     - Delivery status per partner
     - Selected partner detail panel
     - Last update timestamp per partner
     - Socket connection state (connected / reconnecting / disconnected)
  4. Handle: loading, error, empty, and disconnected states (§26, §27)
  5. Reuse the shared Map component (`web/src/shared/components/maps/Map.tsx`). Do NOT introduce a second map library. Do NOT touch the camera fix from S3.
  6. The partner marker must move when the partner's GPS simulator moves in the partner browser. This is the whole point of S4b.

- Out of scope (do NOT touch):
  - Customer tracking UI (S4a — done)
  - Notifications UI (S4c)
  - Partner UI (S3 — done)
  - Backend socket emitters (S2 — done)
  - Backend delivery model (S1 — done)
  - Image fallback, favorites, search (S5)
  - New MongoDB collections
  - Any new UI redesign or visual polish

- Verification:
  - `cd API && npx tsc --noEmit` → passes
  - `cd web && npx tsc -p tsconfig.app.json --noEmit` → filter output to `delivery|admin/delivery|fleet` — must be clean
  - Runtime proof: a headless test that
    a. mounts the admin fleet hook with a mocked socket,
    b. emits `delivery:status` (partner assigned),
    c. asserts the fleet state contains that partner,
    d. emits `delivery:location`,
    e. asserts the fleet state's partner location updates,
    f. emits `delivery:status` (delivered),
    g. asserts the partner is removed from active fleet.
  - Payloads must use the exact S2 types from `web/src/core/types/socket.events.ts`. No hand-rolled mocks.
  - Manual/visual verification note: the admin browser must show the partner marker moving when the partner browser's GPS simulator runs. State explicitly whether you could test this or not.

- Acceptance:
  1. No hardcoded mockFleet remains in the admin delivery page in API mode.
  2. Fleet view consumes `useDeliverySocket('admin')` and updates in realtime.
  3. Partner markers move on the shared Map.
  4. Loading, error, empty, and disconnected states are handled.
  5. The fleet test covers at least 3 event types (assigned, location, delivered).
  6. No customer, notification, or partner code was touched.

- Socket ownership:
  - Reuse `useDeliverySocket('admin')` from S4a's role-parameter refactor.
  - The subscription must be mounted at the admin delivery page container level, once per page mount. Not per child component.
  - If the admin page renders multiple times (e.g. route change within admin), the socket subscription must persist via the same pattern as S4a.

- Files you expect to touch (confirm during inspection — do NOT assume):
  `web/src/pages/admin/delivery/index.tsx`
  `web/src/features/admin/delivery/*` (if a feature folder exists)
  `web/src/services/socket.ts` (only if the admin role needs additional subscription helpers — do not redefine S2 events)
  + New: the fleet headless test
  + New: possibly a small backend endpoint for the initial fleet snapshot (only if no existing endpoint serves this — ask first)
