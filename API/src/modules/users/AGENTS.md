---
scope: domain
path: API/src/modules/users
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["user.routes.ts"]
routes: ["/api/users/*"]
---

# Users Module (Backend)

## Purpose
Manages user profiles, addresses, and favorites.

## Active Status
Statically verified via `app.ts`.

## Key Files
- `user.controller.ts` — User profile logic
- `user.routes.ts` — Express router

## Data Flow
API -> Controller -> DB
