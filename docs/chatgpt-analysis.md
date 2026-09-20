I analyzed `mugewara185/FOODHUB` on `dev/main`, including the current `web/src/core`, backend models, frontend routing/configuration, delivery tooling, and repository/package structure.

The main architectural finding is:

> **The extraction is feasible, but `web/src/core/dev/` is not currently a package boundary.** It contains a mixture of genuinely reusable tooling, FoodHub-specific dev UI, and tooling that is coupled to Redux/router/auth/app configuration. The cleanest extraction is therefore **tooling kernel first, FoodHub dev shell second**, rather than moving the whole directory wholesale.

# SECTION 1 — REPOSITORY MAP

## 1.1 Top-level tree

### Repository

```text
FOODHUB/
├── API/
│   ├── queries/
│   ├── scripts/
│   └── src/
│       ├── config/
│       ├── modules/
│       ├── shared/
│       ├── types/
│       ├── utils/
│       ├── app.ts
│       ├── server.ts
│       └── socket.ts
│
├── web/
│   ├── Docs/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── contexts/
│   │   ├── core/
│   │   ├── data/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   └── shared/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
│
├── mcp/
│   ├── src/
│   │   ├── data/
│   │   ├── prompts/
│   │   ├── resources/
│   │   ├── services/
│   │   └── tools/
│   └── package.json
│
├── AiPrompt/
├── _docs/
├── rough/
├── package.json
└── package-lock.json
```

The repository also contains `API.zip` and `web.zip`, which are committed archives of application code rather than architectural packages.

### `web/src`

```text
web/src/
├── api/          # lightweight/mock API helpers
├── app/          # application bootstrap, Redux store and routing
├── assets/       # frontend assets
├── contexts/     # application React contexts
├── core/         # mixed application core + dev infrastructure
├── data/         # application data/types/seeds
├── features/     # domain feature modules
├── pages/        # routed page components
├── services/     # HTTP/socket/application services
└── shared/       # reusable UI/layout/application shared components
```

### `API/src`

```text
API/src/
├── config/
├── modules/
│   ├── ai/
│   ├── analytics/
│   ├── auth/
│   ├── delivery/
│   ├── dev/
│   ├── notifications/
│   ├── orders/
│   ├── restaurants/
│   ├── reviews/
│   └── users/
├── shared/
├── types/
├── utils/
├── app.ts
├── server.ts
└── socket.ts
```

### `mcp/src` — ignored for analysis

```text
mcp/src/
├── data/
├── prompts/
├── resources/
├── services/
├── tools/
├── index.ts
└── server.ts
```

Per your instruction, I did not use the MCP implementation as evidence for the extraction analysis.

---

## 1.2 Top-level intent

| Folder              | Intent                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `web/`              | React/Vite FoodHub frontend plus its current dev tooling                                  |
| `API/`              | Express/Mongoose backend and domain services                                              |
| `mcp/`              | MCP server; intentionally excluded                                                        |
| `web/src/core/`     | Mixed shared application infrastructure, application types/data, and developer tooling    |
| `web/src/core/dev/` | Developer environment/tooling, diagnostics, mock inspectors, version switching and dev UI |
| `web/src/core/ui/`  | FoodHub-specific core UI primitives                                                       |
| `web/src/features/` | FoodHub domain/application features                                                       |
| `web/src/shared/`   | Cross-feature application UI/layout components                                            |
| `web/src/data/`     | FoodHub application types, seeds and data                                                 |
| `web/src/services/` | Application HTTP/socket integration                                                       |
| `API/src/modules/`  | Backend domain modules                                                                    |
| `API/src/shared/`   | Backend infrastructure shared across modules                                              |

---

# 1.3 `web/src/core/` classification

### Classification key

* **DEV-ONLY** — developer-facing infrastructure/UI and should not be part of normal production application behavior.
* **REUSABLE** — meaningful candidate for `packages/dev-tools/` or another reusable package.
* **APP-SPECIFIC** — FoodHub application infrastructure/data/types and should remain with FoodHub.

## `core/config`

| File                                | Classification             | Reason                                                       |
| ----------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `web/src/core/config/app.config.ts` | APP-SPECIFIC / DEV-COUPLED | Contains FoodHub API configuration plus logger configuration |
| `web/src/core/config/navigation.ts` | APP-SPECIFIC               | FoodHub navigation                                           |
| `web/src/core/config/uiConfig.ts`   | APP-SPECIFIC               | Application UI configuration                                 |

`app.config.ts` is particularly important because `Logger.ts` imports it, creating a dependency from tooling → application configuration.

---

## `core/constants`

| File                              | Classification       |
| --------------------------------- | -------------------- |
| `web/src/core/constants/food.ts`  | APP-SPECIFIC         |
| `web/src/core/constants/roles.ts` | APP-SPECIFIC         |
| `web/src/core/constants/index.ts` | APP-SPECIFIC / STALE |

`food.ts` contains `APP_NAME = 'FoodHub'`, food categories, restaurant mock data, routes, storage keys, etc.

`constants/index.ts` is notably suspicious: it contains `APP_NAME = 'LearnHub'`, course categories and other unrelated values. It appears to be leftover generic/template code rather than a clean FoodHub core module.

---

## `core/data`

| File                          | Classification              |
| ----------------------------- | --------------------------- |
| `Corefactory/Factory.ts`      | **REUSABLE**                |
| `factories/Offers.ts`         | APP-SPECIFIC                |
| `factories/_flow-chart.txt`   | APP-SPECIFIC / DEV DATA DOC |
| `factories/addresses.ts`      | APP-SPECIFIC                |
| `factories/carts.ts`          | APP-SPECIFIC                |
| `factories/favorites.ts`      | APP-SPECIFIC                |
| `factories/foodItems.ts`      | APP-SPECIFIC                |
| `factories/menus.ts`          | APP-SPECIFIC                |
| `factories/notifications.ts`  | APP-SPECIFIC                |
| `factories/orders.ts`         | APP-SPECIFIC                |
| `factories/restaurants.ts`    | APP-SPECIFIC                |
| `factories/reviews.ts`        | APP-SPECIFIC                |
| `factories/unifiedFactory.ts` | APP-SPECIFIC                |
| `factories/users.ts`          | APP-SPECIFIC                |

`Factory.ts` is the obvious exception. It contains generic factory/registry machinery and `generateObjectId()` without FoodHub domain imports.

The factory implementations themselves depend on FoodHub types/seeds/entities.

---

## `core/hooks`

| File                             | Classification                    |
| -------------------------------- | --------------------------------- |
| `web/src/core/hooks/useQuery.ts` | REUSABLE **after small refactor** |

It uses React Query generics, but also imports FoodHub's toast utility and contains FoodHub-specific query keys.

---

## `core/monitoring`

| File                                | Classification                             |
| ----------------------------------- | ------------------------------------------ |
| `web/src/core/monitoring/sentry.ts` | REUSABLE in principle, but currently empty |

The current file is zero bytes, so there is no extraction value yet.

---

## `core/notifications`

| File                                                     | Classification             |
| -------------------------------------------------------- | -------------------------- |
| `notifications/CONTEXT.md`                               | APP-SPECIFIC documentation |
| `notifications/__tests__/deliveryNotifications.test.tsx` | APP-SPECIFIC test          |
| `notifications/components/NotificationBell.tsx`          | APP-SPECIFIC               |
| `notifications/hooks/useDeliveryNotifications.ts`        | APP-SPECIFIC               |
| `notifications/notificationSlice.ts`                     | APP-SPECIFIC               |

These are Redux/application-domain components. They are not dev-tools candidates.

---

# `core/types`

| File                     | Classification                               |
| ------------------------ | -------------------------------------------- |
| `types/auth.ts`          | APP-SPECIFIC                                 |
| `types/delivery.ts`      | APP-SPECIFIC                                 |
| `types/food.ts`          | APP-SPECIFIC                                 |
| `types/index.ts`         | APP-SPECIFIC                                 |
| `types/location.ts`      | APP-SPECIFIC / partially reusable primitives |
| `types/socket.events.ts` | APP-SPECIFIC delivery contract               |

`Coordinates` itself is generic, but `location.ts` is dominated by DeliveryPartner, DeliveryRoute, LiveTracking and FoodHub delivery concepts.

---

# `core/utils`

| File                         | Classification                               |
| ---------------------------- | -------------------------------------------- |
| `utils/api.ts`               | REUSABLE after refactor                      |
| `utils/cn.ts`                | **REUSABLE — zero FoodHub coupling**         |
| `utils/index.ts`             | APP-SPECIFIC / stale                         |
| `utils/location.ts`          | APP-SPECIFIC                                 |
| `utils/logger.ts`            | REUSABLE but currently obsolete/thin         |
| `utils/performance.utils.ts` | **REUSABLE — zero obvious FoodHub coupling** |
| `utils/webVitals.ts`         | **REUSABLE — zero obvious FoodHub coupling** |

There are effectively **two logger locations**:

```text
web/src/core/utils/logger.ts
web/src/core/dev/logger/*
```

The second is the serious logger implementation. This duplication should be resolved before extraction.

---

# `core/dev`

This entire subtree is developer tooling, but **not all of it is package-ready**.

| File/group                            | Classification                                                 |
| ------------------------------------- | -------------------------------------------------------------- |
| `dev/gpsSimulator.ts`                 | DEV-ONLY + strong reusable candidate                           |
| `dev/gpsSimulator.test.tsx`           | DEV-ONLY                                                       |
| `dev/contexts/DevContext.tsx`         | DEV-ONLY / reusable after decoupling                           |
| `dev/contexts/LoggerContext.tsx`      | DEV-ONLY / reusable after decoupling                           |
| `dev/logger/Logger.ts`                | REUSABLE after refactor                                        |
| `dev/logger/index.ts`                 | DEV-ONLY / package entry candidate after refactor              |
| `dev/logger/logUtils.ts`              | REUSABLE after refactor                                        |
| `dev/logger/types.ts`                 | **REUSABLE**                                                   |
| `dev/logger/docs/*`                   | DEV-TOOL documentation                                         |
| `dev/renderer/DevErrorBoundary.tsx`   | REUSABLE after UI/application boundary cleanup                 |
| `dev/renderer/DevVersionRenderer.tsx` | REUSABLE after decoupling                                      |
| `dev/renderer/DevVersionSwitcher.tsx` | REUSABLE after decoupling                                      |
| `dev/renderer/docs/*`                 | DEV-TOOL documentation                                         |
| `dev/types/types_V1.tsx`              | DEV-ONLY / architecture-specific                               |
| `dev/ui/*`                            | Mostly DEV-ONLY; some components are reusable after extraction |

The strongest candidates are therefore:

```text
Factory
GPS simulator
logger core
logger types
logger utilities
error boundary
version registry/context/renderer
some dev UI primitives
```

---

# `core/ui`

| File                                  | Classification        |
| ------------------------------------- | --------------------- |
| `ui/buttons/FloatingTrigger.tsx`      | REUSABLE UI candidate |
| `ui/buttons/RoleSwitcher.tsx`         | APP-SPECIFIC          |
| `ui/draggable/DraggableContainer.tsx` | **REUSABLE**          |

`FloatingTrigger` and `DraggableContainer` are visually/application independent enough to be package candidates.

`RoleSwitcher` is not. It is coupled to FoodHub's auth/role model.

---

# SECTION 2 — EXTRACTION FEASIBILITY

## 2.1 Reusable candidates

### A. `Factory.ts`

**Path**

```text
web/src/core/data/Corefactory/Factory.ts
```

**Dependencies**

```text
none of significance
```

It defines:

```text
GeneratorFn
Factory<T>
FactoryRegistry
globalRegistry
generateObjectId
```

This is the cleanest extraction candidate.

**FoodHub coupling**

None apparent.

**Reverse imports**

It is used by the factory layer, but I cannot establish a complete repository-wide reverse-import list from the available GitHub code-search interface. The direct factory architecture indicates it is intended as the generic primitive underneath the FoodHub factories.

**Extraction status:** **one-step candidate**.

---

### B. `cn.ts`

```text
web/src/core/utils/cn.ts
```

Implementation is generic class-name composition.

**Dependencies:** none.

**FoodHub coupling:** none apparent.

**Extraction status:** **one-step candidate**.

---

### C. `performance.utils.ts`

```text
web/src/core/utils/performance.utils.ts
```

No FoodHub-specific imports were found.

**Dependencies:** browser performance APIs only.

**Extraction status:** one-step candidate, subject to checking its exact public API during package creation.

---

### D. `webVitals.ts`

```text
web/src/core/utils/webVitals.ts
```

Depends on:

```text
web-vitals
```

and exposes `reportWebVitals`.

No FoodHub dependency is present.

**Extraction status:** one-step candidate.

---

### E. `gpsSimulator.ts`

```text
web/src/core/dev/gpsSimulator.ts
```

This is a strong portfolio/dev-tools candidate.

It contains:

```text
GPSSimulator
useGPSSimulator
Location
```

and does not import FoodHub state, Redux, router or application services.

However it is currently physically consumed by:

```text
web/src/pages/_deliveryPartner/ActiveDelivery.tsx
```

That page passes FoodHub-specific state into the generic simulator.

So:

```text
simulator engine → reusable
ActiveDelivery integration → FoodHub-specific
```

**Extraction status:** very good candidate.

---

### F. `logger/types.ts`

```text
web/src/core/dev/logger/types.ts
```

Defines:

```text
LogLevel
LogEntry
LogStats
LoggerConfig
FilterOptions
```

No FoodHub model/type imports.

**Extraction status:** one-step candidate.

---

### G. `Logger.ts`

```text
web/src/core/dev/logger/Logger.ts
```

This is **not** one-step-ready.

It imports:

```text
uuid
@/core/config/app.config
```

The second dependency is the problem.

The logger itself uses application configuration/localStorage and therefore knows about the FoodHub application's configuration boundary.

The package version should receive configuration through constructor/options instead of importing:

```text
APP_CONFIG
```

directly.

**Extraction status:** refactor first.

---

### H. `logUtils.ts`

```text
web/src/core/dev/logger/logUtils.ts
```

Good reusable concepts:

```text
logAPI
logRedux
logComponent
logPerformance
logAuth
logError
logWithThreshold
exportDebugInfo
PerformanceSpan
```

But `logRedux` and `exportDebugInfo` are tied to the application's Redux/debug representation.

So this should be split conceptually into:

```text
generic logging primitives
        +
FoodHub Redux adapters
```

**Extraction status:** refactor first.

---

### I. `DevContext.tsx`

```text
web/src/core/dev/contexts/DevContext.tsx
```

The version registry itself is reusable:

```text
availableVersions
selectedVersions
registerVersions
unregisterVersions
setVersion
```

But it directly imports the FoodHub logger and uses a FoodHub-specific storage key:

```text
zom2_dev_versions
```

So the context needs configuration/injection.

**Extraction status:** refactor first.

---

### J. `LoggerContext.tsx`

```text
web/src/core/dev/contexts/LoggerContext.tsx
```

Conceptually reusable.

It exposes filtering and logger state through React context.

Its implementation is coupled to the current logger module but not to FoodHub domain objects.

**Extraction status:** refactor first, but relatively low risk.

---

### K. `DevErrorBoundary.tsx`

```text
web/src/core/dev/renderer/DevErrorBoundary.tsx
```

Generic error-boundary behavior.

It depends on:

```text
React
MUI
```

and does not appear to require FoodHub state.

The MUI dependency is a package-level UI decision, though—not FoodHub coupling.

**Extraction status:** reusable with little refactoring.

---

### L. `DevVersionRenderer.tsx`

Reusable concept:

```text
selected version
→ choose component
→ render under error boundary
```

But it depends on:

```text
DevContext
DevErrorBoundary
MUI
```

and therefore should move together with those abstractions.

**Extraction status:** refactor/package together.

---

### M. `DevVersionSwitcher.tsx`

Currently imports:

```text
AuthContext
DevContext
APP_CONFIG
```

So it is **not** a clean package component.

The actual version-selection UI is reusable; the FoodHub authorization/configuration policy isn't.

**Extraction status:** refactor first.

---

### N. `FloatingTrigger.tsx`

```text
web/src/core/ui/buttons/FloatingTrigger.tsx
```

Good candidate for reusable dev-tools UI.

---

### O. `DraggableContainer.tsx`

```text
web/src/core/ui/draggable/DraggableContainer.tsx
```

Good candidate.

It is a generic UI interaction primitive rather than FoodHub domain logic.

---

## 2.2 Zero-coupling vs refactor-first

### Can move essentially as-is

| File                                       | Status                 |
| ------------------------------------------ | ---------------------- |
| `core/data/Corefactory/Factory.ts`         | **YES**                |
| `core/utils/cn.ts`                         | **YES**                |
| `core/utils/performance.utils.ts`          | **YES**                |
| `core/utils/webVitals.ts`                  | **YES**                |
| `core/dev/gpsSimulator.ts`                 | **YES, with its test** |
| `core/dev/logger/types.ts`                 | **YES**                |
| `core/ui/draggable/DraggableContainer.tsx` | **YES / very close**   |
| `core/ui/buttons/FloatingTrigger.tsx`      | **YES / very close**   |

### Refactor first

| File                                       | Why                                                   |
| ------------------------------------------ | ----------------------------------------------------- |
| `core/dev/logger/Logger.ts`                | imports `APP_CONFIG`                                  |
| `core/dev/logger/logUtils.ts`              | Redux/application adapters mixed with generic logging |
| `core/dev/contexts/DevContext.tsx`         | FoodHub storage key + logger dependency               |
| `core/dev/contexts/LoggerContext.tsx`      | package logger coupling                               |
| `core/dev/renderer/DevVersionRenderer.tsx` | depends on FoodHub-oriented context boundary          |
| `core/dev/renderer/DevVersionSwitcher.tsx` | imports `AuthContext` and `APP_CONFIG`                |
| `core/utils/api.ts`                        | depends on FoodHub config/auth-token implementation   |
| `core/hooks/useQuery.ts`                   | depends on FoodHub toast + FoodHub query keys         |

---

## 2.3 Web/API type duplication

There is substantial **semantic duplication**, but it is not a clean 1:1 shared-contract layer.

### Authentication

Frontend:

```text
web/src/core/types/auth.ts
web/src/data/types/auth.ts
```

Backend:

```text
API/src/modules/auth/auth.model.ts
```

Both define:

```text
User
Address/IAddress
roles
```

but their shapes differ.

For example backend roles include:

```text
user
admin
owner
partner
dev
delivery_partner
```

while `web/src/core/types/auth.ts` uses:

```text
admin
dev
restaurant_owner
user
delivery_partner
```

So this is **duplicated and divergent**, not simply duplicated.

---

### Delivery status

Frontend:

```text
web/src/core/types/delivery.ts
```

Backend:

```text
API/src/modules/delivery/delivery.state.ts
API/src/modules/delivery/delivery.model.ts
```

Both define the same delivery-state vocabulary:

```text
pending
assigned
accepted
arrived_pickup
picked_up
out_for_delivery
nearby
delivered
cancelled
```

This is the clearest cross-application contract duplication.

---

### Delivery partner

Frontend:

```text
web/src/core/types/location.ts
```

defines:

```text
DeliveryPartner
```

Backend:

```text
API/src/modules/delivery/delivery-partner.model.ts
```

defines:

```text
IDeliveryPartner
DeliveryPartnerStatus
```

These diverge significantly:

Frontend:

```text
vehicleType
vehicleNumber
avatar
currentLocation: Coordinates
status: online | offline | ...
```

Backend:

```text
vehicle
currentLocation: GeoJSON Point
status: available | assigned | on_delivery | offline
```

This is a **real contract mismatch**, not just harmless duplication.

---

### Restaurant

Frontend:

```text
web/src/core/types/food.ts
```

Backend:

```text
API/src/modules/restaurants/restaurant.model.ts
```

Both model Restaurant, but the backend has substantially more fields and different representations:

```text
imageUrl
coverImageUrl
contact
openingHours
menu
priceRange
```

versus the frontend's:

```text
image
bannerImage
contact: string
openingHours
```

Again: duplicated semantic model + divergence.

---

### Orders

Frontend:

```text
web/src/core/types/food.ts
```

Backend:

```text
API/src/modules/orders/order.model.ts
```

The mismatch is particularly significant:

Frontend:

```text
deliveryAddress: Address
paymentMethod: cod | card | upi | wallet
paymentStatus
estimatedDelivery
```

Backend:

```text
deliveryAddress: string
paymentMethod: cash | card | upi
note
```

This should not be solved by blindly sharing the existing interfaces. The boundary currently lacks a canonical DTO contract.

---

### Socket delivery events

Frontend:

```text
web/src/core/types/socket.events.ts
```

Backend:

```text
API/src/modules/delivery/delivery.events.ts
```

This is actually relatively aligned.

Both define:

```text
DeliveryBasePayload
DeliveryAssignedPayload
DeliveryStatusPayload
DeliveryLocationPayload
PartnerLocationUpdatedPayload
```

This is arguably the strongest candidate for a future shared contract package, although that is separate from `packages/dev-tools/`.

---

## 2.4 Dev tooling outside `core`

There are several important examples.

### GPS simulator consumer

```text
web/src/pages/_deliveryPartner/ActiveDelivery.tsx
```

imports:

```text
../../core/dev/gpsSimulator
```

The simulator itself belongs in dev-tools; the page integration does not.

---

### Route logger

```text
web/src/app/routes/RouteLogger.tsx
```

uses:

```text
../../core/dev/logger
```

This is a dev/observability adapter living in application routing.

The generic route-tracking primitive could eventually belong to dev-tools, while `RouteLogger` remains the FoodHub integration.

---

### Global error boundary

```text
web/src/shared/components/ErrorBoundary/ErrorBoundary.tsx
```

imports:

```text
../../../core/dev/logger
```

This is a legitimate application integration point.

Do **not** move the whole component blindly. Extract the generic error-boundary/logger integration capability instead.

---

### Delivery feature debugging

`web/src/features/deliveryPartner/` contains explicit development behavior such as:

```text
seedAvailableAssignments
```

and comments describing dev-only behavior in:

```text
web/src/features/deliveryPartner/deliveryPartnerSlice.ts
```

That is **application-specific dev functionality**, not generic dev-tools.

---

# SECTION 3 — HOSTING READINESS

## 3.1 Static-host risks

### Hardcoded localhost URLs — YES, significant problem

The delivery slice contains multiple direct URLs:

```text
web/src/features/deliveryPartner/deliveryPartnerSlice.ts
```

Examples include:

```text
http://localhost:5000/api/delivery/partner/me
http://localhost:5000/api/delivery/partner/me/status
http://localhost:5000/api/delivery/${deliveryId}/status
http://localhost:5000/api/delivery/${orderId}/accept
http://localhost:5000/api/delivery/${orderId}/reject
```

This is the biggest frontend hosting problem.

`web/src/core/utils/api.ts` already has the correct abstraction:

```text
APP_CONFIG.API_URL
```

but Delivery bypasses it.

### Socket URL

`web/src/services/socket.ts` uses:

```ts
import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"
```

This is structurally correct for deployment because it is environment-driven.

The production environment must provide the actual backend Socket.io URL.

### API URL

`web/src/core/config/app.config.ts`:

```text
VITE_API_URL
```

is already build-time configurable.

### SSR

No SSR requirement is evident.

The application is explicitly bootstrapped with:

```text
ReactDOM.createRoot(...)
```

in:

```text
web/src/main.tsx
```

and Vite is configured as a normal client-side React application.

### Browser routing

The application uses:

```text
BrowserRouter
```

in:

```text
web/src/main.tsx
```

with routes such as:

```text
/orders/tracking/:id
/admin/*
/partner/*
/dev/*
```

I found **no `staticwebapp.config.json`** under `web/`.

Therefore Azure Static Web Apps needs an explicit SPA fallback configuration or equivalent deployment configuration outside the repository.

---

## 3.2 Environment variables

### Build-time variables

All `import.meta.env.*` values are Vite build-time substitutions.

| Variable                         | Source                      | Purpose                 |
| -------------------------------- | --------------------------- | ----------------------- |
| `VITE_API_URL`                   | `core/config/app.config.ts` | backend REST API        |
| `VITE_SOCKET_URL`                | `services/socket.ts`        | Socket.io backend       |
| `VITE_DEV_BYPASS_AUTH`           | `core/config/app.config.ts` | development auth bypass |
| `VITE_DATA_SOURCE`               | `core/config/app.config.ts` | mock/API data mode      |
| `VITE_SENTRY_DSN`                | `core/config/app.config.ts` | Sentry configuration    |
| `VITE_LOGGER_MAX_LOGS`           | `core/config/app.config.ts` | logger configuration    |
| `VITE_LOGGER_PERSIST_LOGS`       | `core/config/app.config.ts` | logger persistence      |
| `VITE_LOGGER_LEVEL`              | `core/config/app.config.ts` | logger level            |
| `VITE_LOGGER_ENABLE_STACK_TRACE` | `core/config/app.config.ts` | stack traces            |
| `VITE_LOGGER_ENABLE_TIMESTAMPS`  | `core/config/app.config.ts` | timestamps              |
| `VITE_LOGGER_CONSOLE_ENABLED`    | `core/config/app.config.ts` | browser console logging |
| `VITE_LOGGER_RENDER_ENABLED`     | `core/config/app.config.ts` | rendered logger         |
| `VITE_LOGGER_ROUTE_ENABLED`      | `core/config/app.config.ts` | route logging           |
| `VITE_LOGGER_REDUX_ENABLED`      | `core/config/app.config.ts` | Redux logging           |
| `VITE_LOGGER_API_ENABLED`        | `core/config/app.config.ts` | API logging             |

The committed `web/.env` also defines:

```text
VITE_GOOGLE_MAPS_API_KEY
```

but the inspected `web/src/shared/components/maps/Map.tsx` uses Leaflet/CARTO tiles rather than Google Maps. I cannot establish another source usage from the repository inspection, so its actual necessity is **cannot determine**.

### `web/src/.env`

There is also:

```text
web/src/.env
```

containing:

```text
VITE_GOOGLE_MAPS_API_KEY
VITE_SOCKET_URL
VITE_DEV_BYPASS_AUTH
```

That is an architectural smell. Vite's normal env loading is rooted at the project directory (`web/`), not `web/src/`. The authoritative frontend env file is therefore `web/.env`.

---

### Runtime variables

There are effectively **no server-side runtime environment variables** for the SPA.

After Vite builds:

```text
import.meta.env.VITE_*
```

values are embedded into the client bundle.

So:

```text
Azure environment change
        ↓
new frontend build
```

not:

```text
Azure runtime environment change
        ↓
existing JS bundle dynamically reads it
```

This matters for your Azure deployment process.

---

## 3.3 Monorepo build

Root:

```text
package.json
```

contains dependencies but **no workspace configuration and no build scripts**.

`web/package.json` owns:

```json
"build": "tsc -b && vite build"
```

Therefore:

```text
npm run build
```

from the repository root is **not the web build**.

The web assumes itself to be a package root.

You can invoke it from the repository root using a package-manager prefix/workdir mechanism, but there is no repository-level build command currently establishing that convention.

This becomes important when introducing:

```text
packages/dev-tools/
```

because the repository is **not yet a workspace**.

---

## 3.4 Dev/mock/simulation code that can enter production

This is a significant weakness.

### `/dev` routes are not environment-gated

`web/src/app/routes/index.tsx` registers:

```text
/dev
/dev/component-tree
/dev/components
/dev/state
/dev/props
/dev/versions
/dev/network
/dev/logs
/dev/performance
/dev/docs
```

There is no production environment condition around this route tree.

That means the dev tooling is currently part of the application's route graph.

### Dev console is statically imported

`web/src/App.tsx` imports:

```text
@/core/dev/ui/modals/FloatingDevConsole
```

unconditionally.

It is conditionally rendered:

```text
APP_CONFIG.DEV_BYPASS_AUTH || user?.role.includes('dev')
```

but the module is still part of the frontend module graph.

### Dev providers are always mounted

`web/src/main.tsx` mounts:

```text
LoggerProvider
DevProvider
```

for the application.

Again: the behavior is not structurally separated from production.

### GPS simulator

```text
web/src/core/dev/gpsSimulator.ts
```

is imported directly by:

```text
web/src/pages/_deliveryPartner/ActiveDelivery.tsx
```

The simulator is therefore part of the application bundle/module graph.

### Factory data

The factory layer is used by:

```text
web/src/core/dev/utils/factorySeed.ts
web/src/core/dev/ui/modals/FloatingDevConsole.tsx
```

and the frontend package directly depends on:

```text
@faker-js/faker
```

There is no obvious production build exclusion boundary around this code.

### Current auth bypass

`web/.env` currently has:

```text
VITE_DEV_BYPASS_AUTH=true
```

but `app.config.ts` additionally requires:

```text
IS_DEV
```

so the code attempts to prevent bypassing auth in production.

That guard is good.

However, the repository-level configuration is still dangerous because the intended deployment state is not represented by a production env file/configuration.

---

# SECTION 4 — SHOWCASE FEASIBILITY

## 4.1 What could the standalone showcase demonstrate?

The current codebase already contains enough tooling for a strong showcase.

| Capability               | Existing implementation                       | Showcase viability                                |
| ------------------------ | --------------------------------------------- | ------------------------------------------------- |
| Logger                   | `core/dev/logger/*`                           | **High**                                          |
| GPS simulator            | `core/dev/gpsSimulator.ts`                    | **High**                                          |
| Version switching        | `core/dev/contexts/DevContext.tsx` + renderer | **High**                                          |
| Error boundary           | `core/dev/renderer/DevErrorBoundary.tsx`      | **High**                                          |
| Component playground     | `core/dev/ui/pages/ComponentPlayground.tsx`   | Medium                                            |
| Component tree inspector | `ComponentTreeExplorer*`                      | Medium                                            |
| State inspector          | `StateInspector.tsx`                          | Medium                                            |
| Props inspector          | `PropsPanel.tsx`                              | Medium                                            |
| Network inspector        | `NetworkInspector.tsx`                        | Medium, currently mock-driven                     |
| Performance metrics      | `PerformanceMetrics.tsx`                      | Medium, currently mock-driven                     |
| Documentation viewer     | `DocumentationViewer.tsx`                     | High                                              |
| Dev console              | `FloatingDevConsole.tsx`                      | Medium/low until FoodHub state is removed         |
| Factory/seeding          | `core/dev/utils/factorySeed.ts`               | High as a concept, but currently FoodHub-specific |

---

## 4.2 Hardcoded FoodHub state/store/routing

### `DevLayout.tsx`

This is one of the most coupled components.

```text
web/src/core/dev/ui/layout/DevLayout.tsx
```

It imports:

```text
@core/constants/food
@contexts/AuthContext
@app/store
@features/cart/cartSlice
```

It also reads FoodHub cart state.

Therefore:

> **Do not extract `DevLayout.tsx` as-is.**

Instead extract a generic shell and keep:

```text
FoodHubDevLayout
```

as an application adapter.

---

### `ComponentPlayground.tsx`

Both versions import:

```text
@features/restaurant/components/RestaurantCard/RestaurantCard_V
```

Therefore the existing playground is not actually a generic component playground.

It is a:

> **FoodHub component showcase with a generic-looking shell.**

The reusable version should receive a component registry/catalog as props/configuration.

---

### `mockData.ts`

```text
web/src/core/dev/ui/mockData.ts
```

contains concrete:

```text
Restaurant
Food
Cart
Order
Delivery
Redux
```

examples.

This is strongly FoodHub-specific.

The standalone showcase should not import this file.

---

### `StateInspector`

Currently consumes:

```text
reduxStateSnapshot
```

from `mockData.ts`.

Therefore it demonstrates a fake FoodHub Redux state rather than an arbitrary store.

The reusable version needs an injected state source/adapter.

---

### `NetworkInspector`

Currently consumes:

```text
mockApiCalls
```

from `mockData.ts`.

So it is currently a **mock network viewer**, not a generic network inspector.

---

### `PerformanceMetrics`

Currently consumes:

```text
componentPerfData
bundleMetrics
```

from `mockData.ts`.

Again, this is currently demonstration data rather than a live instrumentation boundary.

---

### `PropsPanel`

Uses:

```text
propsOverrideData
```

from FoodHub-oriented mock data.

The concept is reusable; the current catalog isn't.

---

### `VersionSwitcher`

Consumes:

```text
componentVersions
```

from FoodHub mock data.

The actual switching mechanism is reusable; the current version registry isn't.

---

## 4.3 Minimum viable showcase

I would build the first showcase around **four** capabilities.

### 1. Logger

Existing:

```text
core/dev/logger/Logger.ts
core/dev/logger/types.ts
core/dev/logger/logUtils.ts
core/dev/contexts/LoggerContext.tsx
```

Standalone requirements:

```text
Logger
→ configurable sink/options
→ context/provider
→ filter/search UI
→ console/render switches
```

This is probably the strongest portfolio demonstration because it represents real developer infrastructure rather than UI decoration.

---

### 2. Version switching

Existing:

```text
DevContext
DevVersionRenderer
DevVersionSwitcher
```

Standalone showcase:

```text
ButtonV1
ButtonV2
CardV1
CardV2
```

Then demonstrate:

```text
register versions
→ select version
→ persist selection
→ render selected implementation
→ recover errors with boundary
```

This would show a reusable development capability very clearly.

---

### 3. GPS simulator

Existing:

```text
core/dev/gpsSimulator.ts
```

Show:

```text
start
pause
reset
source
target
speed
current coordinate
```

with a generic map/coordinate visualizer.

The simulator itself does not need FoodHub.

FoodHub's `ActiveDelivery.tsx` integration stays outside the package.

---

### 4. Dev error boundary

Existing:

```text
core/dev/renderer/DevErrorBoundary.tsx
```

Show:

```text
normal component
→ intentionally throw
→ boundary catches
→ developer diagnostic state
→ recover/retry
```

This is easy to make standalone and demonstrates an actual production/development engineering pattern.

---

# SECTION 5 — RISKS AND ORDER OF OPERATIONS

## 5.1 Recommended order

### Do **not** do:

```text
extract everything
→ deploy Azure
→ discover broken boundaries
→ build showcase
```

And I would also avoid:

```text
showcase-first
```

because the showcase would force you to discover the package boundary while simultaneously designing the showcase.

### Safer sequence

```text
1. Establish workspace/package boundary
        ↓
2. Extract only zero-coupling primitives
        ↓
3. Refactor logger/version/GPS boundaries
        ↓
4. Keep FoodHub adapters inside web/
        ↓
5. Verify FoodHub locally
        ↓
6. Fix static-host blockers
        ↓
7. Deploy web to Azure
        ↓
8. Validate API/socket production endpoints
        ↓
9. Build standalone showcase using the extracted package
```

In other words:

> **Extract → stabilize → host → showcase**

not:

> host first.

The reason is that the current extraction boundary and hosting boundary overlap around dev tooling.

---

## 5.2 Most likely extraction breakages

### 1. Logger initialization

Current dependency:

```text
Logger.ts
  ↓
APP_CONFIG
```

If you move Logger without changing this, the package will still depend on FoodHub.

Verify:

```text
packages/dev-tools
  ↓
no @/core imports
no @features imports
no FoodHub config imports
```

---

### 2. DevContext storage

Current:

```text
zom2_dev_versions
```

This is an application-specific storage key.

The extracted version context should not know what `zom2` is.

Verify that the package has no FoodHub-named storage keys.

---

### 3. Component playground

Current playground is coupled to:

```text
RestaurantCard
```

Verify that the package can render a component provided from outside rather than importing FoodHub components.

---

### 4. Redux inspectors

Current state inspector consumes a FoodHub snapshot.

Verify that the extracted inspector accepts an injected state/debug source.

---

### 5. Router/auth coupling

`DevLayout` and `DevVersionSwitcher` currently depend on:

```text
AuthContext
react-router
APP_CONFIG
```

Verify that the extracted package does not require the application's auth system just to render its tools.

---

# 5.3 What should NOT be extracted now

Defer these:

| Item                      | Reason                                        |
| ------------------------- | --------------------------------------------- |
| `core/types/*`            | They are application/domain contracts         |
| `core/constants/food.ts`  | FoodHub domain                                |
| `core/constants/roles.ts` | FoodHub authorization model                   |
| `core/data/factories/*`   | FoodHub data model                            |
| `core/notifications/*`    | Redux/domain application functionality        |
| `DevLayout.tsx`           | Strong FoodHub routing/store/auth coupling    |
| `FloatingDevConsole.tsx`  | Strong FoodHub restaurant/factory integration |
| `mockData.ts`             | Entirely FoodHub-oriented                     |
| `NetworkInspector.tsx`    | Currently built around mocked FoodHub calls   |
| `PerformanceMetrics.tsx`  | Currently built around mocked FoodHub metrics |
| `StateInspector.tsx`      | FoodHub Redux snapshot                        |
| `PropsPanel.tsx`          | FoodHub component metadata                    |
| `RoleSwitcher.tsx`        | FoodHub roles/auth                            |
| `location.ts`             | Delivery domain                               |
| `useQuery.ts`             | Application toast/query-key coupling          |
| `utils/api.ts`            | Application auth/config coupling              |

These should remain in `web/` until after the hosting boundary is stable.

---

# SECTION 6 — TOP 3 CLEANUP PRIORITIES BEFORE HOSTING

## 1. Remove hardcoded backend URLs from Delivery

### Files

```text
web/src/features/deliveryPartner/deliveryPartnerSlice.ts
```

Current code directly uses:

```text
http://localhost:5000/api/...
```

for:

```text
partner/me
partner/me/status
delivery/:id/status
delivery/:orderId/accept
delivery/:orderId/reject
```

### Change

Route these requests through the existing API configuration/client boundary:

```text
web/src/core/config/app.config.ts
web/src/core/utils/api.ts
```

or the already-existing API service architecture.

### Why

This will otherwise make the deployed Azure frontend attempt to call your local machine.

**Priority: critical.**

---

## 2. Establish an explicit production boundary for dev tooling

### Files

```text
web/src/app/routes/index.tsx
web/src/App.tsx
web/src/main.tsx
web/src/core/dev/*
```

The `/dev/*` route tree is currently registered regardless of environment.

`FloatingDevConsole`, `DevProvider`, and `LoggerProvider` are also statically integrated into the application.

### Change

The production application should not expose:

```text
/dev
/dev/*
```

and dev tooling should have a clear production boundary.

The important point is not merely hiding the UI. The current architecture places dev tooling directly into the production module graph.

### Why

Azure will happily serve whatever Vite builds. A static host does not know that:

```text
core/dev
```

is supposed to be developer-only.

**Priority: critical.**

---

## 3. Fix the SPA deployment/build boundary

### Files

```text
web/package.json
web/vite.config.ts
web/src/main.tsx
web/src/app/routes/index.tsx
```

There is currently:

```text
BrowserRouter
```

but no:

```text
web/staticwebapp.config.json
```

or equivalent repository-level Azure SPA fallback configuration.

The repository also has no root workspace/build configuration:

```text
package.json
```

contains no workspace definition and no web build script.

### Change

Before deployment, establish explicitly:

```text
repository root
    ↓
web package
    ↓
vite build
    ↓
Azure Static Web Apps
    ↓
SPA fallback
```

and make the production API/socket endpoints explicit build-time configuration.

### Why

Without the SPA fallback, direct navigation/refresh on:

```text
/admin/delivery
/partner/active
/orders/tracking/:id
```

can be treated as a static file request rather than an application route.

**Priority: critical.**

---

# Bottom-line architecture

The current repository has a useful dev-tools nucleus, but I would **not extract `web/src/core/dev/` wholesale**.

The natural package boundary is closer to:

```text
packages/dev-tools/
│
├── core/
│   ├── logger/
│   ├── versioning/
│   ├── gps/
│   ├── error-boundary/
│   └── performance/
│
├── react/
│   ├── LoggerProvider
│   ├── VersionProvider
│   ├── VersionRenderer
│   └── dev hooks
│
└── ui/
    ├── DevConsole primitives
    ├── FloatingTrigger
    └── DraggableContainer
```

while FoodHub retains:

```text
web/src/core/dev/
├── FoodHubDevLayout
├── FoodHubComponentCatalog
├── FoodHubStateAdapters
├── FoodHubMockData
├── FoodHubFactorySeedAdapter
└── FoodHub-specific inspectors/adapters
```

The most important architectural distinction is:

```text
GENERIC TOOL
    ↑
    │
FoodHub adapter
    ↑
    │
FoodHub feature
```

rather than:

```text
FoodHub app
    ↓
"core"
    ↓
package
```

That distinction is already visible in the current code: `gpsSimulator.ts`, `Logger/types.ts`, `Factory.ts`, `cn.ts`, and the versioning primitives have genuine extraction value, while `DevLayout`, `mockData`, `ComponentPlayground`, `StateInspector`, and `FloatingDevConsole` currently use the FoodHub application as their implicit dependency container.
