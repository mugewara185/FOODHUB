# FoodHub

> Full-stack multi-role food marketplace and delivery platform built as a portfolio project to demonstrate real-time systems, role-based authorization, server-authoritative state machines, and modular frontend architecture.

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat&logo=redux&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socketdotio&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

---

## What It Demonstrates

- **Role-based access control** across four distinct portal experiences (user, owner, partner, admin) enforced on both the API and frontend route layers.
- **Server-authoritative order lifecycle** with a 14-state machine enforced in MongoDB. The frontend is a display projection — it cannot invent state.
- **Delivery as a projection of Order state** — the `Delivery` record is a separate micro-state machine that maps onto the canonical `Order` lifecycle without duplicating it.
- **Real-time event distribution** via Socket.IO rooms: user rooms, order rooms, and an admin fleet channel. Events drive both live UI updates and the in-app notification system.
- **Switchable data sources** — a `VITE_DATA_SOURCE` environment variable routes UI data calls through the real API or a typed mock/factory layer, enabling UI development without a running server.
- **Engineering-grade dev tooling** built into the frontend: a structured logger, in-browser dev console, version switcher, GPS simulator, component playground, state inspector, and network inspector — all gated behind `IS_DEV`.
- **AI copilot for admin** — an `AIAgent` orchestrates MCP tool calls against an analytics data source, then grounds the LLM response in retrieved evidence. Provider is pluggable (Gemini live, mock for offline dev).

---

## Engineering Highlights

### 1. JWT Authentication + Role Authorization
**Problem:** Multiple actor types (user, owner, partner, admin) must see only their own data, and routes must reject unauthorized actors before any business logic runs.

**Implementation:** `API/src/shared/middleware/auth.middleware.ts` exports two composable middleware functions:
- `protect()` — verifies the `Bearer` token via `jsonwebtoken`, fetches the user from MongoDB (without password), and attaches `{ id, email, roles }` to `req.user`.
- `authorize(...allowedRoles)` — called after `protect`, throws a 403 `AppError` if none of the user's roles appear in the allowed set.

Routes compose them inline: `router.patch('/status', protect, authorize('owner', 'admin'), ...)`.

On the frontend, `ProtectedRoute` in `web/src/features/auth` checks Redux `auth` state and the `allowedRoles` prop before rendering any route tree. Admin, partner, and owner route trees are all wrapped this way in `web/src/app/routes/index.tsx`.

**Why it matters:** Authorization is declared at the route layer — business logic never needs to check roles itself.

---

### 2. Server-Authoritative Order Lifecycle (14-State Machine)
**Problem:** Distributed actors (user, owner, partner, admin) each advance the order through different phases. Without a canonical model, the UI could optimistically skip states or allow illegal transitions.

**Implementation:** `API/src/modules/orders/order.model.ts` declares the full `OrderStatus` union:

```
created → pending_owner → confirmed → preparing → ready_for_pickup
→ awaiting_partner → partner_assigned → picked_up → out_for_delivery
→ delivered → completed → reviewed
   ↘ rejected / cancelled (terminal)
```

Transitions are validated in `order.service.ts`. The frontend's `orderSlice` reflects the last-known API state; it does not compute next state locally.

**Why it matters:** Any actor attempting to skip a phase gets a 400 from the API. The UI is always a view, never a source of truth.

---

### 3. Delivery as a Projection of Order State
**Problem:** A delivery partner needs finer-grained location micro-states (`arrived_pickup`, `nearby`) that don't belong in the canonical order lifecycle but must remain synchronized with it.

**Implementation:** `API/src/modules/delivery/delivery.state.ts` defines a separate `DeliveryStatus` union and a `VALID_DELIVERY_TRANSITIONS` map that enforces a strict one-way graph:

```
partner_assigned → arrived_pickup → picked_up → out_for_delivery → nearby → delivered
```

The `Delivery` record is only created when a partner accepts a broadcast — there is no phantom "waiting" delivery. `assertValidTransition(from, to)` throws `InvalidStateTransitionError` on illegal hops (including skips). Delivery micro-states (`arrived_pickup`, `nearby`) do not appear in `OrderStatus` and are not reported to non-partner actors.

**Why it matters:** This is the cleanest boundary in the codebase. The comment in `delivery.state.ts` captures the intent exactly: "Order is the canonical lifecycle owner. Delivery is a projection."

---

### 4. Real-Time Event Distribution via Socket.IO Rooms
**Problem:** Status changes initiated by one actor (e.g., owner confirms order) must reach the relevant customer and admin displays in real-time without broadcasting to every connected socket.

**Implementation:** `web/src/services/socket.ts` manages a singleton `SocketService` class. Rooms:
- **User room** — joined via `join_user_room <userId>` after auth; receives user-targeted notifications.
- **Order room** — joined via `join_order_room <orderId>` when tracking a specific order.
- **Admin fleet** — joined via `join_admin_fleet`; receives `delivery:location`, `delivery:status`, `delivery:risk`, `delivery:risk_cleared`.

Events consumed by the frontend:

| Event | Direction | Consumer |
|---|---|---|
| `order:status_changed` | server → client | customer, owner |
| `order:new` | server → client | owner, admin |
| `delivery:assigned` | server → client | customer, partner, admin |
| `delivery:location` | server → client | customer (tracking map), admin fleet |
| `delivery:status` | server → client | customer, admin |
| `delivery:available` | server → client | partner (broadcast) |
| `partner:location_updated` | client → server | partner (emits own GPS position) |
| `order_status_update` | client → server | legacy; scheduled for refactor |

**Why it matters:** Room-based targeting means a customer only receives events for their own orders, and fleet events only reach the admin fleet view.

---

### 5. Redux State Projection from Async Events
**Problem:** Socket events are asynchronous and arrive outside the React render cycle; they must update shared state predictably across all components that display order or delivery data.

**Implementation:** `web/src/app/store/V/Store_V.ts` configures a `redux-persist` store with `cart` and `notifications` whitelisted for `localStorage` survival across page reloads. The root reducer composes:

```
auth · cart · restaurants · ui · orders · notifications
owner · deliveryPartner · adminAi · ownerOrders · ownerRestaurant
```

The `useDeliveryNotifications` hook in `web/src/core/notifications/hooks/` consumes `delivery:assigned` and `delivery:status` via `useDeliverySocket`, then dispatches `addNotification` actions into Redux. Separately, a `useEffect` subscribes to `order:status_changed` and `order:created` directly on the socket instance to handle order-lifecycle notifications. This means the notification bell always reflects the latest server state without polling.

Dev mode exposes `window.reduxLoggerControl` for runtime action/state-change tracing, plus a custom `createReduxLoggerMiddleware` that logs per-feature (configurable per slice).

**Why it matters:** Real-time state arrives as server-push, not polling. The Redux layer acts as the single synchronization point for all async event sources.

---

### 6. Switchable Data Source Architecture
**Problem:** UI development is blocked when the backend isn't running. Running the full API for every component iteration is slow and couples frontend iteration to backend availability.

**Implementation:** `VITE_DATA_SOURCE=api|mock` controls which path the data layer takes. When set to `mock`, the UI resolves data from typed factory functions in `web/src/core/data/factories/`:

```
UI component → Redux thunk → DATA_SOURCE env check
    → api: HTTP via Axios / fetch → Express API → MongoDB
    → mock: unifiedFactory.ts → typed faker-generated records
```

Factories are defined for all major domains: `restaurants`, `foodItems`, `menus`, `orders`, `reviews`, `users`, `carts`, `notifications`, `addresses`, `favorites`, `offers`.

The factory graph mirrors the domain model:
```
Users → Addresses, Notifications, Favorites, Orders → FoodItems → Restaurants
Restaurants → FoodItems, Offers, Reviews
```

**Why it matters:** Frontend and backend can be developed and tested independently. The same components render real API data in production and factory data in isolation — no special-case conditionals in components.

---

### 7. AI Admin Copilot with MCP Tool Orchestration
**Problem:** Admins need to ask natural-language questions about platform analytics without writing queries. The LLM response must be grounded in real retrieved data, not hallucinated.

**Implementation:** `API/src/modules/ai/` implements a three-layer AI pipeline:

1. **`AIAgent`** (`agent/ai.agent.ts`) — orchestrates the workflow: plan → fetch → ground. It does not query MongoDB directly. All data retrieval crosses the MCP tool boundary.
2. **`MCPClient`** (`mcp/mcp.client.ts`) — spawns a local MCP server process over `stdio`, speaks the MCP 2024-11-05 protocol (JSON-RPC), and calls tools like `get_analytics_summary`, `get_top_entities`, `analyze_trend`, `get_cancellation_metrics`.
3. **`AIProvider`** — interface with two implementations: `GeminiAIProvider` (live, using `@google/genai`) and `MockAIProvider` (offline dev). Selected at startup via `AI_PROVIDER=gemini|mock` in env.

`planToolCalls()` in the agent does keyword routing on the user message: restaurant name → restaurant-specific tools; "cancel" → cancellation metrics; "trend"/"revenue" → trend analysis; "top"/"best" → top entities. Evidence collected from MCP tools is injected into the provider prompt before generation.

The admin frontend reaches this via `/admin/ai` (chat) and `/admin/ai/investigations/:id` (investigation detail).

**Why it matters:** The LLM cannot fabricate data — it receives structured evidence from the MCP layer and is instructed to ground its response in that evidence.

---

## Features by Role

### User (`/`)
- Browse restaurants and menus
- Add to cart, checkout with delivery address and payment method (cash, card, UPI)
- Real-time order tracking via map (`/orders/tracking/:id`)
- Order history, profile, favorites, notifications, search

### Owner (`/owner/*`)
- Order queue — accept or reject incoming `pending_owner` orders
- Active orders view — monitor preparing → ready → dispatched states
- Dashboard, settings
- Receives real-time `New Order` notifications via Socket.IO

### Partner (`/partner/*`)
- Available deliveries broadcast — accept a delivery to create the `Delivery` record
- Active delivery — advance through delivery micro-states, emit GPS location updates
- Delivery history, earnings, profile, support

### Admin (`/admin/*`)
- Full order list, restaurant management, add restaurant, menu management
- Delivery fleet dashboard with live partner GPS positions
- User management, reports, promotions
- AI copilot chat and investigation pages
- Analytics (reports)

---

## Project Architecture

```
zom2/
├── API/                        # Node.js / Express backend
│   └── src/
│       ├── modules/            # Domain modules (auth, orders, delivery, restaurants,
│       │   │                   #   reviews, users, ai, analytics, notifications, dev)
│       │   ├── ai/
│       │   │   ├── agent/      # AIAgent — MCP orchestrator
│       │   │   ├── mcp/        # MCPClient — stdio JSON-RPC transport
│       │   │   ├── providers/  # AIProvider interface + Gemini + Mock + factory
│       │   │   └── observability/
│       │   ├── orders/         # 14-state order lifecycle
│       │   └── delivery/       # Delivery projection + risk engine + simulator
│       ├── shared/
│       │   └── middleware/     # protect(), authorize(), errorHandler
│       └── socket.ts           # Socket.IO room management
│
└── web/                        # React 19 / Vite frontend
    └── src/
        ├── app/
        │   ├── routes/         # Role-gated route trees (user, owner, partner, admin, dev)
        │   └── store/          # Redux store + persist + reduxLogger middleware
        ├── features/           # Domain slices: auth, cart, orders, restaurant,
        │                       #   owner, deliveryPartner, admin/ai, reviews, ui
        ├── core/
        │   ├── dev/            # Structured logger, GPS simulator, dev UI suite
        │   ├── data/           # Factory registry, domain factories, unifiedFactory
        │   ├── notifications/  # notificationSlice, useDeliveryNotifications, NotificationBell
        │   └── types/          # Typed Socket.IO event payloads
        ├── pages/              # Page components by role
        ├── services/           # SocketService singleton
        └── shared/             # Layout, components, hooks
```

---

## Backend Architecture

The Express application (`API/src/app.ts`) mounts modules as independent route trees:

```
/api/auth            → auth.routes       (register, login, token refresh)
/api/users           → user.routes
/api/restaurants     → restaurant.routes
/api/orders          → order.routes      (14-state lifecycle controller)
/api/reviews         → review.routes
/api/notifications   → notification.routes
/api/admin/analytics → analyticsRoutes
/api/admin/ai        → ai.routes         (chat, investigation)
/api/delivery        → delivery.routes
/api/delivery/partner → delivery.partner.routes
/api/dev             → dev.routes        (seed endpoints, dev utilities)
```

Security stack applied at app level: `helmet()`, `cors({ origin: CLIENT_URL })`, `express.json()`, Morgan HTTP logger (non-test environments only). Centralized error handling via `errorHandler` middleware (always last).

Each module follows the pattern: `model.ts` (Mongoose schema) → `service.ts` (business logic) → `controller.ts` (HTTP adapter) → `routes.ts` (Express router + middleware composition).

---

## Order + Delivery Lifecycle

### Order States (`API/src/modules/orders/order.model.ts`)

```
created
  └─► pending_owner       # Awaiting restaurant accept
        ├─► rejected       # Terminal — restaurant declined
        └─► confirmed
              └─► preparing
                    └─► ready_for_pickup
                          └─► awaiting_partner    # Broadcast to available partners
                                └─► partner_assigned
                                      └─► picked_up
                                            └─► out_for_delivery
                                                  └─► delivered
                                                        └─► completed
                                                              └─► reviewed
cancelled                  # Terminal — available from several states
```

### Delivery States (`API/src/modules/delivery/delivery.state.ts`)

The `Delivery` record is only created when a partner accepts a broadcast. Micro-states are Delivery-only and are not surfaced in `OrderStatus`:

```
partner_assigned → arrived_pickup → picked_up → out_for_delivery → nearby → delivered
```

`assertValidTransition(from, to)` enforces this graph server-side. Self-transitions are permitted (e.g., location ping without state change). Illegal hops throw `InvalidStateTransitionError`.

---

## Real-Time Architecture

The backend `socket.ts` manages Socket.IO rooms. The frontend's `SocketService` class (`web/src/services/socket.ts`) is a singleton that manages one persistent `Socket` connection per session.

**Connection flow:**
1. After login, `socketService.connect(userId, role)` is called.
2. On `connect`, the client emits `join_user_room <userId>`.
3. When a customer navigates to order tracking, `join_order_room <orderId>` is emitted.
4. Admin fleet view emits `join_admin_fleet`; leaving the view emits `leave_admin_fleet`.

**Event catalog:**

| Event | Type | Notes |
|---|---|---|
| `order:status_changed` | server → client | Primary order lifecycle event |
| `order:new` | server → client | Triggers owner `pending_owner` notification |
| `order:created` | server → client | Used as notification trigger |
| `delivery:assigned` | server → client | Typed: `DeliveryAssignedPayload` |
| `delivery:location` | server → client | Typed: `DeliveryLocationPayload` — drives map |
| `delivery:status` | server → client | Typed: `DeliveryStatusPayload` |
| `delivery:available` | server → client | Broadcast to available partners |
| `delivery:risk` | server → client | Admin fleet only |
| `delivery:risk_cleared` | server → client | Admin fleet only |
| `partner:location_updated` | client → server | Partner emits own GPS position |
| `join_user_room` | client → server | |
| `join_order_room` | client → server | |
| `leave_order_room` | client → server | |
| `join_admin_fleet` | client → server | |
| `leave_admin_fleet` | client → server | |
| `order_status_update` | client → server | **Legacy** — scheduled for refactor |

The `notification` server event and `order_status_update` client event are legacy paths maintained for backward compatibility.

---

## State Management

The Redux store (`web/src/app/store/V/Store_V.ts`) uses `@reduxjs/toolkit` with `redux-persist`:

| Slice | Backing | Notes |
|---|---|---|
| `auth` | API-backed | JWT token + user profile |
| `cart` | Persisted (localStorage) | Survives page reload |
| `restaurants` | API-backed / mock-switchable | Re-fetched on navigation |
| `orders` | API-backed | Updated by Socket.IO events |
| `ownerOrders` | API-backed | Owner-specific order queue |
| `owner` | API-backed | Restaurant and settings data |
| `ownerRestaurant` | API-backed | |
| `deliveryPartner` | API-backed | Active delivery state + partner profile |
| `adminAi` | API-backed | AI conversation history |
| `notifications` | Persisted (localStorage) | Driven by socket events |
| `ui` | Session-only | Modal state, loading flags |

**Dev features:** `window.reduxLoggerControl` is exposed in dev mode. `createReduxLoggerMiddleware` supports per-feature logging toggling (auth, cart, restaurants, ui independently configurable). Dev mode also supports `sessionStorage` isolation via a `zom2_dev_session_isolation` flag for multi-tab testing scenarios.

---

## Notification System

The notification system is implemented in `web/src/core/notifications/`:

- **`notificationSlice.ts`** — Redux slice managing up to 50 in-memory notifications, each with `{ id, title, message, type, isRead, createdAt, orderId?, targetPath? }`. `unreadCount` is derived from the `items` array. `cart` and `notifications` slices are persisted across sessions.

- **`useDeliveryNotifications(role)`** — a hook consumed by each role's layout. Internally calls `useDeliverySocket` to subscribe to `delivery:assigned` and `delivery:status`, then dispatches `addNotification` actions with role-appropriate messages and `targetPath` values (e.g., `/orders/tracking/:id` for customers, `/admin/delivery` for admin, `/owner/queue` for owner). Also subscribes directly to `order:status_changed` and `order:created` for order-lifecycle notifications.

  `delayed` and `offline` status handling in `onStatus` is currently stubbed (comment: "Not currently emitted by backend").

- **`NotificationBell.tsx`** — renders the bell icon with unread badge; clicking opens a notification list with navigation to `targetPath`.

---

## Development Infrastructure

`web/src/core/dev/` is a standalone developer tooling layer. All routes under `/dev` are gated by `IS_DEV` in `web/src/app/routes/index.tsx` — they are stripped from production builds.

### Reusable Infrastructure (`web/src/core/dev/logger/`)
- **`Logger`** (`Logger.ts`) — structured logger with levels `DEBUG | INFO | WARN | ERROR | CRITICAL`, per-category filtering, optional localStorage persistence (bounded rolling buffer of 500 entries), `TraceLogger` for correlated multi-step traces, JSON/CSV export, and listener subscriptions for reactive UI. Configurable via `APP_CONFIG.Logger_Config`.
- **`GPSSimulator`** (`gpsSimulator.ts`) — interpolates a lat/lng route between two points at a configurable interval. Used by the delivery partner `ActiveDelivery` page to simulate GPS movement for demo purposes.

### Dev UI Suite (routes under `/dev/*`)
These are FoodHub-specific inspection and development pages, visible only in dev mode:

| Route | Page | Purpose |
|---|---|---|
| `/dev` | `DevDashboard` | Overview of all dev tools |
| `/dev/component-tree` | `ComponentTreeExplorer` | Browse React component tree |
| `/dev/components` | `ComponentPlayground` | Render and inspect individual components |
| `/dev/state` | `StateInspector` | Live Redux store viewer |
| `/dev/props` | `PropsPanel` | Inspect component props |
| `/dev/versions` | `VersionSwitcher` | Switch between component variants (`_V` directories) |
| `/dev/network` | `NetworkInspector` | Inspect HTTP/socket activity |
| `/dev/logs` | `LogPanel` | Live Logger output viewer |
| `/dev/performance` | `PerformanceMetrics` | Performance instrumentation |
| `/dev/docs` | `DocumentationViewer` | Inline markdown docs from `docsRegistry.ts` |

Additional tooling: `FloatingDevConsole.tsx`, `DevErrorBoundary.tsx`, `DevVersionRenderer.tsx`, Redux logger middleware with `window.reduxLoggerControl` runtime control.

---

## Data Source / Factory Architecture

The pattern allows the entire UI to operate without a running backend:

```
UI Component
  └─► Redux Thunk / API call
        └─► checks VITE_DATA_SOURCE
              ├─► "api"  → HTTP request → Express API → MongoDB
              └─► "mock" → unifiedFactory.ts → typed fake records
```

`web/src/core/data/Corefactory/Factory.ts` defines a generic `Factory<T>` class with `build(count, overrides)` and `buildOne(overrides)`. A `FactoryRegistry` maps domain names to factory instances.

Domains with factory implementations: `restaurants`, `foodItems`, `menus`, `orders`, `reviews`, `users`, `carts`, `notifications`, `addresses`, `favorites`, `offers`.

`unifiedFactory.ts` composes cross-domain factory calls, respecting the domain relationship graph:
```
Users → Addresses, Notifications, Favorites
      → Orders → FoodItems → Restaurants
               → Reviews
Restaurants → FoodItems, Offers, Reviews
```

`@faker-js/faker` provides the underlying data generation.

---

## AI Capabilities

The admin AI feature at `/admin/ai` implements a grounded-generation pipeline:

**Implemented:**
- `AIAgent` plans which MCP tools to invoke based on keyword analysis of the user message (restaurant name detection, intent keywords: cancel, trend, revenue, top, best, perform).
- `MCPClient` launches a local MCP server process (`mcp/dist/index.js`) via `child_process.spawn` with `stdio` pipes, speaks MCP protocol version `2024-11-05` (JSON-RPC 2.0), and calls tools: `analyze_restaurant_performance`, `get_restaurant_performance`, `get_cancellation_metrics`, `get_analytics_summary`, `analyze_trend`, `get_top_entities`, `get_metrics`.
- `GeminiAIProvider` uses `@google/genai` with evidence injected into the prompt context.
- `MockAIProvider` returns deterministic responses for offline development.
- Provider is selected at startup: `AI_PROVIDER=gemini|mock` (defaults to `mock`).
- Full observability: every AI request emits structured log events (`ai:request:start`, `mcp:tool:start`, `mcp:tool:complete`, `ai:provider:complete`, etc.) via `AILogger`.
- `AIError` with `safeMessage` prevents internal details from leaking to API responses.

**Not implemented:**
- Claude and OpenAI providers are defined as stubs in `provider.factory.ts` but throw immediately if selected.
- MCP server is a local stdio process; there is no remote or hosted MCP integration.

---

## Security / Backend Foundations

Security mechanisms present in the codebase:

- **JWT** — `jsonwebtoken` for token signing/verification. Secret via `JWT_SECRET` env var. Expiry configurable via `JWT_EXPIRES_IN`.
- **bcryptjs** — password hashing at registration; `bcryptjs.compare` at login.
- **Role authorization** — `authorize(...roles)` middleware composition on every protected route.
- **Helmet** — HTTP security headers applied globally.
- **CORS** — restricted to `CLIENT_URL` origin with credentials.
- **Zod** — request body validation (`zod` is a direct API dependency).
- **Centralized error handling** — `errorHandler` middleware converts `AppError` instances to structured JSON responses. Unhandled errors are caught and normalized before reaching the client.
- **`AI_API_KEY` protection** — `AIError.safeMessage` field separates internal error messages from client-facing ones.

This is a portfolio project. No penetration testing or security audit has been performed.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### Backend

```bash
cd API
npm install
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, CLIENT_URL
npm run dev
```

Available scripts (`API/package.json`):
- `dev` — `nodemon --exec ts-node src/server.ts`
- `build` — `tsc`
- `start` — `node dist/server.js`

### Frontend

```bash
cd web
npm install
# Create .env (see Environment Variables below)
npm run dev
```

Available scripts (`web/package.json`):
- `dev` — `vite` (default port 5173)
- `build` — `vite build`
- `build:typecheck` — `tsc -b && vite build`
- `lint` — `eslint .`
- `preview` — `vite preview`

> There is no root-level script that starts both services simultaneously. Run API and web in separate terminals.

---

## Environment Variables

### Backend (`API/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default: `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `CLIENT_URL` | Yes | Frontend origin for CORS (e.g., `http://localhost:5173`) |
| `AI_PROVIDER` | No | `gemini` \| `mock` (default: `mock`) |
| `AI_API_KEY` | Cond. | Required when `AI_PROVIDER=gemini` |
| `AI_TIMEOUT` | No | MCP request timeout in ms (default: `30000`) |
| `MCP_SERVER_PATH` | No | Absolute path to MCP server entry (default: `../mcp/dist/index.js`) |

### Frontend (`web/.env`)

These are Vite build-time variables (exposed as `import.meta.env.VITE_*`):

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL (e.g., `/api` for proxied dev, `https://api.example.com/api` for prod) |
| `VITE_SOCKET_URL` | Socket.IO server URL (empty string = same host) |
| `VITE_DATA_SOURCE` | `api` \| `mock` — controls data source routing |
| `VITE_DEV_BYPASS_AUTH` | `true` \| `false` — development-only auth bypass |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps integration key |

---

## Portfolio Demo

A recruiter or reviewer can trace the full request lifecycle without writing code:

1. **Register/Login** (`/signup`, `/login`) — creates a `user`-role account. Inspect the JWT in Redux DevTools under `state.auth`.

2. **Browse and add to cart** (`/restaurants` → `/restaurants/:id`) — toggle `VITE_DATA_SOURCE=mock` to see the frontend render entirely from factory data without a running backend.

3. **Place an order** (`/cart` → `/checkout`) — observe the order enter `created → pending_owner` in the owner portal simultaneously.

4. **Owner accepts** (`/owner/queue`) — the owner accepts the order; `order:status_changed` fires in real-time; the customer's order page updates without a refresh.

5. **Partner picks up** (`/partner/orders` → `/partner/active`) — partner advances delivery through micro-states; the customer's tracking map (`/orders/tracking/:id`) updates via `delivery:location` events.

6. **Notification bell** — throughout the flow, the notification bell accumulates `Order Confirmed`, `Being Prepared`, `Delivery Update`, `Order Delivered` notifications, each with a `targetPath` deep-link.

7. **Dev tooling** (`/dev` — dev mode only) — `StateInspector` shows live Redux slices; `LogPanel` streams logger output; `VersionSwitcher` lets you toggle between `_V` component variants.

8. **Admin AI** (`/admin/ai`) — type "show me top performing restaurants" or "what are the cancellation trends?" The agent plans MCP tool calls, fetches analytics evidence, and grounds the Gemini response in retrieved data. Structured observability events appear in the API console.

---

## Deployment / Hosting

**Intended architecture (not yet live):**
- Frontend: **Azure Static Web Apps** — `web/staticwebapp.config.json` is present and configured with SPA fallback routing. The `/dev/*` route returns 404 in production (enforced by the config).
- Backend: **Render** (or equivalent Node.js host) — `npm run build && npm start` produces the compiled `dist/server.js`.

No live deployment URL is currently published. Treat all deployment configuration as intended architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19, TypeScript |
| Build tool | Vite 7 |
| State management | Redux Toolkit 2, redux-persist |
| Routing | React Router v7 |
| UI components | MUI v7, Framer Motion, Lucide React |
| Maps | Leaflet, react-leaflet, geolib |
| Charts | Recharts |
| Real-time | Socket.IO client v4 |
| HTTP | Axios / fetch |
| Test data | @faker-js/faker |
| Backend framework | Express 4, Node.js |
| Language | TypeScript (API + web) |
| Database | MongoDB + Mongoose |
| Auth | jsonwebtoken, bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS |
| Real-time | Socket.IO v4 |
| HTTP logging | Morgan |
| AI | @google/genai (Gemini), MCP stdio protocol |
| Monitoring (web) | @sentry/react (dependency present) |

---

## Current Scope / Honest Limitations

- **Portfolio project.** Not deployed to production. No real payment processing. No real SMS/email notifications.
- **MCP server** is a local stdio process — no hosted or remote MCP integration is active.
- **Claude and OpenAI** AI providers are defined as stubs but not implemented.
- **`delayed` / `offline` delivery status notifications** in `useDeliveryNotifications` are stubbed — the backend does not currently emit these events.
- **Owner portal** is partially complete: queue and active views are functional; analytics, menu management, promotions, reviews, staff, and finance pages render a `ComingSoon` component.
- **`order_status_update`** client→server Socket.IO event is labeled legacy in the codebase and is scheduled for refactor.
- **AI analytics data** is sourced from MCP mock data (Q4 2024 range) — it is not live MongoDB analytics.
- No automated end-to-end test suite is connected to CI; test files exist (`factorySeed.test.ts`, `authSlice.test.ts`, `deliveryNotifications.test.tsx`) but test coverage is not measured.

---

## License

No license file was found in the repository. All rights reserved by the author unless explicitly stated otherwise.
