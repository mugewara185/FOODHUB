---
scope: domain
path: API/src/modules/orders
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["order.routes.ts"]
routes: ["/api/orders/*"]
---

# Orders Module (Backend)

## Purpose
Manages the lifecycle of food orders, from creation to delivery. Includes real-time tracking updates via WebSockets.

## Active Status
Statically verified. Routes are registered in `app.ts` and WebSockets in `order.controller.ts`.

## Key Files
- `order.controller.ts` — Order creation, status updates, tracking simulation
- `order.model.ts` — Order schema with items, total, status
- `order.routes.ts` — Order API routes

## Data Flow
UI Checkout -> Order Controller -> Order Model -> DB. Socket.io emits events on status changes.

## State Management
Order status in MongoDB. Real-time updates pushed to clients.

## RBAC / Roles
- Users can view their own orders.
- Restaurant owners see orders for their restaurant.
- Delivery partners see available/assigned orders.
- Admins see all.

## Logger Events
Socket emits `order_status_update` and `notification`.

## Tests
N/A (Not verified in active code).

## Gotchas
`.controller.ts` has a `simulateOrderProgression` function which auto-updates order statuses (10s intervals) for demonstration purposes. Do not use this in real production without checking flags.
