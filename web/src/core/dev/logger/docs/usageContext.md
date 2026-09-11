# Logger Usage Context

This document explains how the logger is integrated into the FoodHub application.

## 1. Application-Wide Integration

### 1.1 Network Boundary (API Interceptors)
Instead of a single centralized Axios instance, the active application relies on feature-specific `request` wrappers (e.g., `authApi.ts`, `restaurantApi.ts`, `reviewApi.ts`, `orderApi.ts`). Each has been instrumented using `logAPI.request()`, `logAPI.response()`, and `logAPI.error()` to automatically measure duration, track status codes, and emit `API.REQUEST` and `API.RESPONSE` events.

### 1.2 State Transitions (Redux Middleware)
The `createReduxLoggerMiddleware` handles global state monitoring. It is enabled in `app/store/V/Store_V.ts`. This middleware automatically tracks `auth`, `cart`, `restaurants`, `ui`, `orders`, and `notifications` state changes. Action payloads and state diffs are logged securely (with sensitive data masked where applicable) under the `REDUX` namespace.

### 1.3 Routing and Component Lifecycle
Routing transitions are tracked automatically in `app/routes/index.tsx` using `logPerformance.navigation()` triggered via `useLocation()`. Critical component lifecycles (such as `RestaurantDetail` and `Checkout`) are instrumented using `logComponent.mount()` and `logComponent.unmount()`.

### 1.4 WebSockets (Real-time Events)
The `socketService` handles real-time application updates. Socket connection state, user/order room joins, and incoming messages (such as `ORDER.STATUS.UPDATE.RECEIVED` and `NOTIFICATION.RECEIVED`) are explicitly logged with `logger.info()` and `logger.debug()` calls to maintain a complete timeline of live updates.

### 1.5 App Bootstrap
The main application shell (`App.tsx`) emits an `APP.INIT` event when the app begins mounting and auth dependencies initialize.

## 2. Feature-Specific Traces

### Checkout Flow
The Checkout component (`Checkout.tsx`) employs structured traces for step completion and order submission:
- `CHECKOUT.OPEN`
- `CHECKOUT.STEP_COMPLETE`
- `CHECKOUT.SUBMIT.START`
- `CHECKOUT.SUBMIT.SUCCESS` or `CHECKOUT.SUBMIT.FAILURE`

### Reviews
Submitting a review in `RestaurantDetail_V.tsx` is tracked using a `TraceLogger` spanning from validation to success/failure:
- `REVIEW.SUBMIT.START`
- `REVIEW.SUBMIT.PAYLOAD_READY`
- `REVIEW.SUBMIT.SUCCESS` or `REVIEW.SUBMIT.FAILURE`

### Restaurant Discovery
Fetching restaurants list and details emits structured data, primarily intercepted inside `restaurantSlice_V.ts` via Redux async thunks:
- `RESTAURANTS.LOAD.START` / `SUCCESS` / `FAILURE`
- `RESTAURANT.DETAIL.LOAD.START` / `SUCCESS` / `FAILURE`

## 3. Privacy & Security
The current implementation adheres strictly to the rule of avoiding logging sensitive information. Authentication payloads, passwords, and sensitive JWTs are handled at the Redux Middleware level (which masks sensitive payloads) and the custom `fetch` wrappers bypass logging sensitive request/response bodies.
