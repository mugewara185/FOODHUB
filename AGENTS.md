---
scope: root
path: /
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["web/src/main.tsx", "API/src/server.ts"]
routes: []
---

# Zom2 Root Context

## Purpose
Root directory for the Zom2 application (MERN stack food delivery platform). Contains frontend (`web`) and backend (`API`).

## Global Rules
Before working in any folder, read the nearest AGENTS.md. If missing, read the parent. If stale, update it before making changes.

## Active Status
Verified via static analysis of entry points and route definitions. Excludes test-only, deprecated, and mock code.

## Key Files
- `web/src/main.tsx` — Frontend entrypoint
- `API/src/server.ts` — Backend entrypoint
- `web/src/app/routes/index.tsx` — Global route configuration

## Data Flow
Frontend (React/Redux) -> REST API (Express) -> Controller -> Service/Model -> MongoDB

## AI Boundary
N/A at root.

## Related Docs
- [API Auth](API/src/modules/auth/AGENTS.md)
- [API Users](API/src/modules/users/AGENTS.md)
- [API Restaurants](API/src/modules/restaurants/AGENTS.md)
- [API Orders](API/src/modules/orders/AGENTS.md)
- [Web Auth](web/src/features/auth/AGENTS.md)
- [Web Orders](web/src/features/orders/AGENTS.md)
