# Zom2 Showcase / Interesting Features

## 1. Real-Time Order Tracking & Progression Simulation
**Location**: `API/src/modules/orders/order.controller.ts` & `web/src/App.tsx`
**Description**: The system uses Socket.io to push real-time order status updates (confirmed -> preparing -> out_for_delivery -> delivered) to the client.
**Why it's interesting**: The backend includes a `simulateOrderProgression` function that automatically advances the state of an order every 10 seconds for demonstration purposes. This is highly useful for portfolio demos and showcases a complete end-to-end WebSocket integration. The frontend listens globally in `App.tsx` and uses Redux (`updateOrderStatusLocally`) to optimistically update the UI.
**Status**: ACTIVE / STATICALLY VERIFIED
**Talking Points**: Mention the event-driven architecture, how WebSockets reduce API polling, and how the global Redux state instantly reflects changes across all components.

## 2. Multi-Role RBAC (Role-Based Access Control)
**Location**: `web/src/app/routes/index.tsx` & `web/src/features/auth/protectedRoute.tsx`
**Description**: The application supports four distinct user roles: `user`, `admin`, `delivery_partner`, and `restaurant_owner`.
**Why it's interesting**: Each role gets its own dedicated layout and routing namespace (e.g., `/admin`, `/partner`, `/owner`). The frontend router dynamically protects these paths. There is also a Developer Role Switcher (`RoleSwitcher`) in the UI that bypasses normal auth for easy local testing.
**Status**: ACTIVE / STATICALLY VERIFIED
**Talking Points**: Discuss how separation of concerns is maintained at the layout level, ensuring a delivery partner never downloads admin-specific JS bundles (if code-splitted). 

## 3. Custom Dev Tools & Logger Console
**Location**: `web/src/core/dev/` and `web/src/App.tsx`
**Description**: A custom suite of developer tools built directly into the app (Network Inspector, State Inspector, Logs, Component Tree).
**Why it's interesting**: Instead of relying solely on browser extensions, the app has a floating Dev Console that only renders if `APP_CONFIG.DEV_BYPASS_AUTH` is true or the user has a 'dev' role. This allows inspecting React state, capturing UI logs, and switching API versions directly on mobile or staging environments where standard dev tools are inaccessible.
**Status**: ACTIVE / STATICALLY VERIFIED
**Talking Points**: Highlight this as a mature engineering practice—building internal observability tools to improve developer velocity and QA testing.
