---
scope: domain
path: web/src/features/auth
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["authSlice.ts"]
routes: []
---

# Auth Feature (Frontend)

## Purpose
Redux state and logic for client-side authentication and role management.

## Active Status
Statically verified. Used by `App.tsx` and `protectedRoute.tsx`.

## Key Files
- `authSlice.ts` — Redux slice for user data and token
- `protectedRoute.tsx` — Route guard based on auth state and roles
- `AuthContext.tsx` — Optional React Context wrapper for legacy/hybrid components

## Data Flow
API (`/api/auth`) -> Thunk -> Redux Store -> UI Components

## State Management
Redux (`auth` slice).

## RBAC / Roles
Used to gate `/admin`, `/partner`, `/owner`, and user-specific routes.

## Gotchas
Auth state affects WebSocket connections (initialized in `App.tsx`). If `isAuthenticated` is true, a socket connects.
