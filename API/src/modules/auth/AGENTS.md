---
scope: domain
path: API/src/modules/auth
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["auth.routes.ts"]
routes: ["/api/auth/register", "/api/auth/login", "/api/auth/me", "/api/auth/logout", "/api/auth/forgot-password", "/api/auth/reset-password"]
---

# Auth Module (Backend)

## Purpose
Handles user registration, authentication (JWT), password recovery, and role assignments.

## Active Status
Statically verified. Routes are registered in `API/src/app.ts`.

## Key Files
- `auth.controller.ts` — Logic for login/register/reset
- `auth.model.ts` — User schema with passwords and roles
- `auth.routes.ts` — Express route definitions

## Data Flow
Client Request -> Router -> Validator (Zod) -> Controller -> Model -> DB -> JWT Response

## State Management
Stateless REST API using JWT in HTTP-only cookies or Authorization headers.

## API Dependencies
None internal. Uses `jsonwebtoken` and `bcrypt`.

## RBAC / Roles
Defines baseline user roles (user, admin, delivery_partner, restaurant_owner).

## Gotchas
Ensure JWT secrets are properly set in `.env`.
