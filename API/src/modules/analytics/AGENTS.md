---
scope: domain
path: API/src/modules/analytics
status: active
last_verified: 2026-09-12
verified_by: static
entrypoints: ["analytics.routes.ts"]
routes: ["/api/admin/analytics/*"]
---

# Analytics Module (Backend)

## Purpose
Provides data aggregation and reporting for the admin dashboard (e.g., revenue, top restaurants, order volume).

## Active Status
Statically verified via `app.ts`.

## Key Files
- `analytics.controller.ts` — Aggregation pipelines
- `analytics.routes.ts` — Express router

## Data Flow
API -> Controller -> MongoDB Aggregations

## RBAC / Roles
Strictly requires `admin` role.
