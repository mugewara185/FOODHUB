---
scope: domain
path: web/src/features/orders
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["orderSlice.ts"]
routes: []
---

# Orders Feature (Frontend)

## Purpose
Redux state for managing user orders, checkout process, and real-time tracking.

## Active Status
Statically verified.

## Key Files
- `orderSlice.ts` — Stores active orders and handles local status updates

## Data Flow
WebSocket/API -> Redux Action (`updateOrderStatusLocally`) -> Store -> UI

## State Management
Redux (`orders` slice).

## Logger Events
Listens to socket events in `App.tsx` and updates state.

## Gotchas
Order status is updated optimistically or via socket push. Make sure to sync with server periodically if socket drops.
