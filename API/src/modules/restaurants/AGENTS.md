---
scope: domain
path: API/src/modules/restaurants
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["restaurant.routes.ts"]
routes: ["/api/restaurants/*"]
---

# Restaurants Module (Backend)

## Purpose
Manages restaurant listings, menus, and operating hours.

## Active Status
Statically verified via `app.ts`.

## Key Files
- `restaurant.controller.ts` — CRUD for restaurants and menu items
- `restaurant.model.ts` — Restaurant and menu schemas
- `restaurant.routes.ts` — Express router

## Data Flow
API -> Controller -> DB

## RBAC / Roles
Public can view. Owners can edit their own. Admins have full access.
