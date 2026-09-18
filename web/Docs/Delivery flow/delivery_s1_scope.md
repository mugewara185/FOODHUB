# Session S1 — Delivery Domain Contract

## Maps to Spec Sections
§1 (inspect), §3 (domain model), §4 (backend authoritative),
§6 (identity fix), §7 (state machine), §23 (authorization), §24 (coord normalization)

## Goal
After this session, we have a canonical Delivery domain model in the backend
and shared types in the frontend — no more partner/order/delivery `id` confusion.

## In Scope
- Inspect existing delivery-related code (backend + frontend)
- Define canonical Delivery model (backend + TS types)
- Define canonical delivery state machine (backend + TS types)
- Fix partner/order/delivery identity ambiguity
- Centralize coordinate normalization ({lat,lng} ↔ GeoJSON)
- Backend validates legal state transitions

## Out of Scope (do NOT touch)
- Socket.IO event changes (that's S2)
- Any UI component (that's S3/S4)
- Notifications
- Admin pages
- GPS simulator
- Image fallback, favorites, search (S5)
- Seeding
- MCP (out of scope for entire feature)

## Files You Will Likely Touch
(You must confirm these during inspection — do not assume)
- API: delivery-related models, controllers, routes, services
- web/src/features/deliveryPartner/types/*
- web/src/core/types/*
- web/src/services/socket.ts (types only — NOT event logic)

## Verification
- `cd API && npx tsc --noEmit` — passes
- `cd web && npx tsc --noEmit` — passes
- Existing tests still pass (if any)
- Write a small unit test proving an illegal transition
  (e.g. ON_DELIVERY → OFFLINE) is rejected by the backend
- Document findings + decisions in DELIVERY_STATUS.md

## Acceptance Criteria
1. One canonical Delivery type used by backend and frontend
2. `partnerId`, `orderId`, `deliveryId` are unambiguous everywhere
3. Coordinate conversion is centralized in one place
4. Backend rejects illegal state transitions with a clear error
5. No UI was touched