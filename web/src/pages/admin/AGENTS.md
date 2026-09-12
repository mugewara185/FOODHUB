---
scope: domain
path: web/src/pages/admin
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["AdminDashboard.tsx", "orders/OrdersList.tsx"]
routes: ["/admin/*"]
---

# Admin Pages

## Purpose
Administrative dashboard for managing users, restaurants, orders, and platform settings.

## Active Status
Statically verified. Registered in `web/src/app/routes/index.tsx`.

## Key Files
- `AdminDashboard.tsx` — Main overview
- `orders/OrdersList.tsx` — Global order management
- `restaurants/RestaurantsList.tsx` — Restaurant moderation

## RBAC / Roles
Strictly requires `admin` role.

## Data Flow
UI -> API -> DB. Bypasses some user-centric Redux slices for direct API fetches.
