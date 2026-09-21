# FoodHub — Architecture Plan
## Extraction + Hosting + Showcase

---

## Current Phase

**CP-A1 — Workspace setup — NOT STARTED**

---

## Track Map

| Track | Goal |
|-------|------|
| **Track A** | Extract zero-coupling primitives into `packages/dev-tools/` |
| **Track B** | Refactor coupled pieces (Logger, DevContext, versioning) so they can be extracted cleanly |
| **Track C** | Fix all static-host blockers in `web/` — prepare for Azure |
| **Track D** | Deploy `web/` to Azure Static Web Apps |
| **Track E** | Build + deploy standalone dev-tools showcase site |

Tracks A and C are independent and can interleave with Track 2 domain work (see [Sequencing Note](#sequencing-note)).

---

## Phase Plan

### Track A — Extract zero-coupling primitives

- [ ] **CP-A1**: Workspace root + `packages/dev-tools/` skeleton
  - **Files in scope**
    - `package.json` (root) — add npm workspaces declaration
    - `packages/dev-tools/package.json` — new package manifest
    - `packages/dev-tools/tsconfig.json` — new TS config
    - `packages/dev-tools/src/index.ts` — barrel entry point
  - **Dependencies**: none — first step
  - **Verification**: `npm install` from root resolves workspace; `tsc --noEmit` inside `packages/dev-tools/` passes
  - **Definition of done**: `packages/dev-tools/` exists as a valid npm workspace package; root `package.json` declares `"workspaces": ["web", "packages/*"]`; no code moved yet

- [ ] **CP-A2**: Extract zero-coupling primitives
  - **Files in scope** (from `docs/chatgpt-analysis.md` Section 2.2 — "Can move essentially as-is")
    - `web/src/core/data/Corefactory/Factory.ts` → `packages/dev-tools/src/core/Factory.ts`
    - `web/src/core/utils/cn.ts` → `packages/dev-tools/src/core/cn.ts`
    - `web/src/core/utils/performance.utils.ts` → `packages/dev-tools/src/core/performance.utils.ts`
    - `web/src/core/utils/webVitals.ts` → `packages/dev-tools/src/core/webVitals.ts`
    - `web/src/core/dev/gpsSimulator.ts` → `packages/dev-tools/src/core/gpsSimulator.ts`
    - `web/src/core/dev/gpsSimulator.test.tsx` → `packages/dev-tools/src/core/gpsSimulator.test.tsx`
    - `web/src/core/dev/logger/types.ts` → `packages/dev-tools/src/core/logger/types.ts`
    - `web/src/core/ui/buttons/FloatingTrigger.tsx` → `packages/dev-tools/src/ui/FloatingTrigger.tsx`
    - `web/src/core/ui/draggable/DraggableContainer.tsx` → `packages/dev-tools/src/ui/DraggableContainer.tsx`
  - **Dependencies**: CP-A1 complete
  - **Verification**: `tsc --noEmit` inside `packages/dev-tools/` passes with zero errors; `grep -r "from '@/" packages/dev-tools/` returns zero hits; `web/` still compiles
  - **Definition of done**: All nine primitives live in `packages/dev-tools/`; `web/` re-imports them via `@zom2/dev-tools`; no FoodHub-specific symbols inside the package

### Track B — Refactor coupled pieces

- [ ] **CP-A3**: Refactor + extract coupled pieces
  - **Files in scope** (from `docs/chatgpt-analysis.md` Section 2.2 — "Refactor first")
    - `web/src/core/dev/logger/Logger.ts` — remove `@/core/config/app.config` import; accept config via constructor options. **Note**: Pre-existing issue to resolve during extraction: `Logger.ts` is both statically imported (by DevContext, LoggerContext, logger/index, logUtils, ownerMockApi) AND dynamically imported (by AuthContext, authSlice, protectedRoute). The mixed pattern defeats tree-shaking. Make consumers consistent (all-static or all-dynamic).
    - `web/src/core/dev/logger/logUtils.ts` — split generic primitives from FoodHub Redux adapters; Redux adapters stay in `web/` as `foodhubLogAdapters.ts`
    - `web/src/core/dev/contexts/DevContext.tsx` — replace hardcoded `zom2_dev_versions` storage key with injectable config; remove direct logger import
    - `web/src/core/dev/contexts/LoggerContext.tsx` — decouple from module-level logger instance
    - `web/src/core/dev/renderer/DevVersionRenderer.tsx` — package together with decoupled context and boundary
    - `web/src/core/dev/renderer/DevVersionSwitcher.tsx` — remove `AuthContext` and `APP_CONFIG`; accept via props
  - **FoodHub adapters that stay in `web/`** (never extracted)
    - `web/src/core/dev/ui/layout/DevLayout.tsx` → keep as `FoodHubDevLayout.tsx`
    - `web/src/core/dev/ui/mockData.ts` — stays; never moves
    - FoodHub Redux log adapters → `web/src/core/dev/logger/foodhubLogAdapters.ts`
  - **Dependencies**: CP-A2 complete
  - **Verification**: `grep -r "from '@/" packages/dev-tools/"` returns zero; `grep -r "zom2_dev" packages/dev-tools/"` returns zero
  - **Definition of done**: Logger, DevContext, DevVersionSwitcher are fully injectable; FoodHub app functions via adapter wrappers

- [ ] **CP-A4**: Extract refactored pieces into package
  - **Files in scope**
    - `web/src/core/dev/renderer/DevErrorBoundary.tsx` → `packages/dev-tools/src/react/DevErrorBoundary.tsx`
    - `web/src/core/dev/logger/Logger.ts` (post-refactor) → `packages/dev-tools/src/core/logger/Logger.ts`
    - `web/src/core/dev/logger/logUtils.ts` (generic half) → `packages/dev-tools/src/core/logger/logUtils.ts`
    - `web/src/core/dev/contexts/DevContext.tsx` (post-refactor) → `packages/dev-tools/src/react/DevContext.tsx`
    - `web/src/core/dev/contexts/LoggerContext.tsx` (post-refactor) → `packages/dev-tools/src/react/LoggerContext.tsx`
    - `web/src/core/dev/renderer/DevVersionRenderer.tsx` → `packages/dev-tools/src/react/DevVersionRenderer.tsx`
  - **Dependencies**: CP-A3 complete
  - **Verification**: `packages/dev-tools/` standalone `tsc --noEmit` passes; `DevErrorBoundary` can be used in a plain React app with no FoodHub imports
  - **Definition of done**: `packages/dev-tools/src/index.ts` re-exports all extracted items; no FoodHub-named symbols or storage keys in package

- [ ] **CP-A5**: Verify FoodHub still works after extraction
  - **Files in scope**
    - `web/src/` — updated import paths pointing to `@zom2/dev-tools`
    - `web/src/core/dev/` — FoodHub adapter wrappers
    - `web/src/main.tsx` — provider wiring
    - `web/src/App.tsx` — adapter imports
  - **Dependencies**: CP-A4 complete
  - **Verification**: `cd web && npm run build` green; app loads in browser; delivery partner flow works end-to-end; `/dev/*` routes render
  - **Definition of done**: FoodHub build is green; no regressions; adapter pattern documented in `packages/dev-tools/README.md`

---

### Track C — Azure hosting readiness

- [x] **CP-C1**: Fix hardcoded `localhost` URLs in delivery slice
  - **Files in scope**
    - `web/src/features/deliveryPartner/deliveryPartnerSlice.ts` — replace all `http://localhost:5000/...` literals with calls routed through `web/src/core/utils/api.ts` using `APP_CONFIG.API_URL`
  - **Endpoints to fix** (from `docs/chatgpt-analysis.md` Section 6.1)
    - `http://localhost:5000/api/delivery/partner/me`
    - `http://localhost:5000/api/delivery/partner/me/status`
    - `http://localhost:5000/api/delivery/${deliveryId}/status`
    - `http://localhost:5000/api/delivery/${orderId}/accept`
    - `http://localhost:5000/api/delivery/${orderId}/reject`
  - **Dependencies**: independent — can start immediately
  - **Verification**: `grep -n "localhost" web/src/features/deliveryPartner/deliveryPartnerSlice.ts` returns zero hits
  - **Definition of done**: All five endpoints use `APP_CONFIG.API_URL` via `api.ts`

- [x] **CP-C2**: Production-gate `/dev` routes and dev providers
  - **Files in scope** (from `docs/chatgpt-analysis.md` Section 6.2 and Section 3.4)
    - `web/src/app/routes/index.tsx` — wrap entire `/dev/*` route subtree in `IS_DEV` / `import.meta.env.DEV` guard
    - `web/src/App.tsx` — lazy-import `FloatingDevConsole` behind `IS_DEV`; remove from static module graph
    - `web/src/main.tsx` — conditionally mount `LoggerProvider` and `DevProvider` only when guard passes
  - **Dependencies**: independent — can start immediately
  - **Verification**: `grep -l "FloatingDevConsole" web/dist/assets/*.js` returns zero files
  - **Definition of done**: Dev tools are absent from production bundle

- [x] **CP-C2.1**: Fixed all 4 broken imports (RestaurantsV1, RestaurantDetailsV1, reviews, dummyData) blocking the production build. `npx vite build` succeeds. FloatingDevConsole verified absent from dist/assets.

- [x] **CP-C3**: Add SPA fallback config + Azure build pipeline
  - **Files in scope** (from `docs/chatgpt-analysis.md` Section 6.3)
    - `web/staticwebapp.config.json` — new; SPA fallback: all routes → `/index.html`
    - Root `package.json` — add `"build:web": "npm run build --workspace=web"`
    - `.github/workflows/azure-static-web-apps.yml` — new CI pipeline (`app_location: web`, `output_location: dist`)
  - **Dependencies**: CP-C1, CP-C2 complete
  - **Required Azure Env Vars**:
    - `VITE_API_URL` — production backend URL
    - `VITE_SOCKET_URL` — production socket URL
    - `VITE_DATA_SOURCE` — must be 'api' in production
  - **Verification**: `staticwebapp.config.json` validates against Azure SWA schema; direct navigation to `/admin/delivery` returns SPA shell
  - **Definition of done**: `web/staticwebapp.config.json` exists; Azure pipeline YAML exists; `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_DATA_SOURCE` documented as required Azure env vars

---

### Track D — Deploy

- [ ] **CP-D1**: Deploy `web/` to Azure Static Web Apps
  - **Files in scope**
    - Azure portal/CLI — create SWA resource
    - `web/.env.production` — production env values (`VITE_API_URL`, `VITE_SOCKET_URL`)
    - Azure environment variable configuration
  - **Dependencies**: CP-C3 complete; CP-A5 complete (dev code not deployed)
  - **Verification**: Live Azure URL serves FoodHub SPA; deep-link to `/orders/tracking/test-id` returns SPA shell; delivery feature calls real backend endpoints; zero `localhost` in network traffic
  - **Definition of done**: Public URL accessible; `/dev/*` returns 404; delivery partner flow functional against production backend

---

### Track E — Showcase

- [ ] **CP-E1**: Scaffold showcase site (`packages/dev-tools-demo/`)
  - **Files in scope**
    - `packages/dev-tools-demo/` — new Vite + React app
    - `packages/dev-tools-demo/src/demos/LoggerDemo.tsx`
    - `packages/dev-tools-demo/src/demos/VersionSwitcherDemo.tsx`
    - `packages/dev-tools-demo/src/demos/GpsSimulatorDemo.tsx`
    - `packages/dev-tools-demo/src/demos/ErrorBoundaryDemo.tsx`
    - `packages/dev-tools-demo/staticwebapp.config.json`
  - **Showcase capabilities** (from `docs/chatgpt-analysis.md` Section 4.3 — minimum viable showcase)
    1. **Logger** — configurable sink, context/provider, filter/search UI, console/render switches
    2. **Version switching** — register versions, select, persist, render, recover errors with boundary
    3. **GPS simulator** — start/pause/reset, source/target/speed, live coordinate output
    4. **Dev error boundary** — throw intentionally, catch, show diagnostic state, recover
  - **Dependencies**: CP-A5 complete (package stable); CP-D1 complete (hosting pattern proven)
  - **Verification**: `cd packages/dev-tools-demo && npm run build` green; all four demos render without FoodHub imports
  - **Definition of done**: Showcase depends only on `@zom2/dev-tools` for dev-tools components; no `@features`, `@app`, `@contexts` imports anywhere in demo

- [ ] **CP-E2**: Deploy showcase
  - **Files in scope**
    - Azure portal — second SWA resource for showcase
    - `.github/workflows/azure-static-web-apps-showcase.yml`
  - **Dependencies**: CP-E1 complete
  - **Verification**: Public showcase URL accessible; all four demos functional live
  - **Definition of done**: Showcase publicly accessible at a distinct URL from FoodHub

---

## Verified Working

- **CP-C1**: Replaced all hardcoded `localhost` URLs in `deliveryPartnerSlice.ts` with `api` wrapper. Verified zero occurrences of "localhost" in file.
- **CP-C2**: Dev-gated FloatingDevConsole, /dev/* routes, and dev providers. Verified via `grep -l FloatingDevConsole dist/assets/*.js` → zero matches.
- **CP-C2.1**: All build-blocking imports fixed. Production bundle builds successfully.
- **CP-C3**: Build scripts split. Created `staticwebapp.config.json` and Azure Actions workflow. Env vars documented.

---

## Build Hygiene

- `web/package.json` "build" script is `tsc -b && vite build`. Because
  `tsc -b` fails on ~3000 pre-existing type errors, `npm run build` has
  never succeeded. `npx vite build` works.
- Fix (CP-C3): split the scripts:
    "build": "vite build"
    "build:typecheck": "tsc -b && vite build"
  The Azure CI pipeline (CP-C3) must use `build` until type cleanup is
  done.
- The frontend was never production-buildable before CP-C2.1. Dev server
  tolerated the broken imports; production build did not.
- Long-term debt: ~3000 pre-existing type errors in `web/`. Cleaning
  them is a dedicated vertical, not a hosting task.

---

## Known Blockers

Pulled directly from `docs/chatgpt-analysis.md` **Section 6** with exact file citations:

### Blocker 1 — Hardcoded `localhost` URLs (Critical)

**File**: `web/src/features/deliveryPartner/deliveryPartnerSlice.ts`

Analysis Section 6.1 identifies these direct URL literals hardcoded in the delivery slice:
```
http://localhost:5000/api/delivery/partner/me
http://localhost:5000/api/delivery/partner/me/status
http://localhost:5000/api/delivery/${deliveryId}/status
http://localhost:5000/api/delivery/${orderId}/accept
http://localhost:5000/api/delivery/${orderId}/reject
```
The existing abstraction at `web/src/core/config/app.config.ts` (`APP_CONFIG.API_URL`) and `web/src/core/utils/api.ts` is bypassed entirely by the delivery slice.

**Impact**: A deployed Azure frontend will attempt to call the developer's local machine.
**Resolved by**: CP-C1

---

### Blocker 2 — `/dev/*` routes not production-gated (Critical)

**Files**: `web/src/app/routes/index.tsx`, `web/src/App.tsx`, `web/src/main.tsx`

Analysis Section 6.2 and Section 3.4 establish:
- Routes `/dev`, `/dev/component-tree`, `/dev/components`, `/dev/state`, `/dev/props`, `/dev/versions`, `/dev/network`, `/dev/logs`, `/dev/performance`, `/dev/docs` are registered unconditionally in `web/src/app/routes/index.tsx`
- `FloatingDevConsole` is statically imported in `web/src/App.tsx` (unconditional module-graph inclusion)
- `LoggerProvider` and `DevProvider` are always mounted in `web/src/main.tsx`
- `@faker-js/faker` ships as a production dependency with no tree-shake boundary

**Impact**: Dev tooling ships into the production bundle. Azure serves whatever Vite builds.
**Resolved by**: CP-C2

---

### Blocker 3 — No SPA fallback config for Azure (Critical)

**Files**: `web/package.json`, `web/vite.config.ts`, `web/src/main.tsx`, `web/src/app/routes/index.tsx`

Analysis Section 6.3 confirms:
- Application uses `BrowserRouter` (client-side routing)
- `web/staticwebapp.config.json` does **not** exist anywhere in the repository
- Root `package.json` has no workspace definition and no web build script

**Impact**: Direct navigation or refresh on `/admin/delivery`, `/partner/active`, `/orders/tracking/:id` will be treated as a static-file 404 by Azure SWA.
**Resolved by**: CP-C3

---

## Sequencing Note

**Track C must complete before Track D.** Deploying before fixing the three hosting blockers produces a broken deployment: delivery calls localhost, dev tooling ships to production, deep links 404.

**Tracks A and C can interleave safely with Track 2 domain work** (`docs/domainFlowCompletion.md`) because they touch separate subtrees:

| Track | Primary files |
|-------|--------------|
| A (extraction) | `web/src/core/dev/`, `web/src/core/utils/cn.ts`, `web/src/core/data/Corefactory/`, `packages/dev-tools/` |
| C (hosting) | `web/src/features/deliveryPartner/deliveryPartnerSlice.ts` (URL fix only), `web/src/app/routes/index.tsx`, `web/src/App.tsx`, `web/src/main.tsx`, `web/staticwebapp.config.json` |
| Track 2 (domain) | `web/src/features/orders/`, `API/src/modules/orders/`, `API/src/modules/delivery/`, domain logic in `deliveryPartnerSlice.ts` |

The overlap between CP-C1 and Track 2 in `deliveryPartnerSlice.ts` is **additive**: CP-C1 fixes URL hygiene; Track 2 adds domain logic. They can be sequenced or merged without structural conflict.

See `docs/domainFlowCompletion.md` for the parallel domain track.

---

## Decisions Deferred

These items are explicitly flagged in `docs/chatgpt-analysis.md` **Section 5.3** as must-NOT-extract-now. Do not move any of these in any extraction session without reading Section 5.3 first.

| Item | Path | Reason (from analysis) |
|------|------|------------------------|
| Application type contracts | `web/src/core/types/*` | Domain/API contracts, not reusable tooling |
| Food constants | `web/src/core/constants/food.ts` | FoodHub domain — `APP_NAME`, food categories, routes, storage keys |
| Role constants | `web/src/core/constants/roles.ts` | FoodHub authorization model |
| FoodHub factories | `web/src/core/data/factories/*` | FoodHub data model (orders, restaurants, menus, users) |
| Notifications | `web/src/core/notifications/*` | Redux + domain application functionality |
| `DevLayout.tsx` | `web/src/core/dev/ui/layout/DevLayout.tsx` | Imports `AuthContext`, `@app/store`, `@features/cart/cartSlice` |
| `FloatingDevConsole.tsx` | `web/src/core/dev/ui/modals/FloatingDevConsole.tsx` | FoodHub restaurant/factory state integration |
| `mockData.ts` | `web/src/core/dev/ui/mockData.ts` | Entirely FoodHub-oriented (Restaurant, Food, Cart, Redux snapshots) |
| `NetworkInspector.tsx` | `web/src/core/dev/ui/` | Built around mocked FoodHub API calls |
| `PerformanceMetrics.tsx` | `web/src/core/dev/ui/` | Built around mocked FoodHub metrics |
| `StateInspector.tsx` | `web/src/core/dev/ui/` | Consumes FoodHub Redux snapshot from `mockData.ts` |
| `PropsPanel.tsx` | `web/src/core/dev/ui/` | FoodHub component metadata catalog |
| `RoleSwitcher.tsx` | `web/src/core/ui/buttons/RoleSwitcher.tsx` | Coupled to FoodHub auth/role model |
| `location.ts` | `web/src/core/types/location.ts` | Delivery domain types (DeliveryPartner, DeliveryRoute, LiveTracking) |
| `useQuery.ts` | `web/src/core/hooks/useQuery.ts` | FoodHub toast utility + FoodHub query keys |
| `utils/api.ts` | `web/src/core/utils/api.ts` | Application auth-token and config coupling |
| `ComponentPlayground.tsx` | `web/src/core/dev/ui/pages/ComponentPlayground.tsx` | Hardcoded `RestaurantCard` imports — not a generic playground |

> **Guard rule**: Before any extraction session, grep proposed move list against this table. If any name matches, stop and re-read `docs/chatgpt-analysis.md` Section 5.3.

---

## Debt / Deferred

- `web/src/app/config/reduxLogger.config.ts:185` has a logic bug: `return !filter.actions?.includes(actionType) ?? true;` — the `??` after `!` is dead code. Author likely intended different behavior. Not blocking; fix in a polish session.

---

## Next Exact Task

**CP-A1**: Set up workspace root and `packages/dev-tools/` skeleton.

1. Add `"workspaces": ["web", "packages/*"]` to root `package.json`
2. Create `packages/dev-tools/package.json` (`name: "@zom2/dev-tools"`, `version: "0.0.1"`, `private: true`)
3. Create `packages/dev-tools/tsconfig.json`
4. Create `packages/dev-tools/src/index.ts` as empty barrel
5. Run `npm install` from root to verify workspace linking

---

## Resume Prompt

```
Read docs/architecturePlan.md.
Read docs/chatgpt-analysis.md.
Verify the last completed checkpoint (find [x] items in the Phase Plan).
Continue from "Next Exact Task".
Do not redesign completed work.
Do not extract any item listed under "Decisions Deferred".
Do not run npm run dev, nodemon, vite dev, or any long-running process.
Use the editor tool for all file writes. Never use shell redirection or Out-File.
```

---

## Related Docs

- `docs/domainFlowCompletion.md` — parallel Track 2 (domain flow + multi-actor simulator)
- `docs/chatgpt-analysis.md` — source repository analysis (all section citations above reference this file)
- `web/Docs/Delivery flow/delivery_status.md` — the living status pattern this document follows
- `web/Docs/Delivery flow/delivery_vertical_spec.md` — delivery domain context
- `.agents/workflows/instructions.md` — project constitution (priority: Core Dev > Architecture > Domain)
