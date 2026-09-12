# Logger Event Catalog

This document catalogs the observability events integrated into the application to trace the execution and data flow.

## 1. Application Lifecycle (`APP`)
- `APP.INIT` - Application initialization started.
- `APP.READY` - Application successfully rendered.
- `APP.STORE.INIT` - Redux store successfully configured and initialized.
- `APP.RENDER.ERROR` - React error boundary caught a render exception.

## 2. Real-time Communication (`SOCKET`)
- `SOCKET.CONNECT.START` - Initiating socket connection with the server.
- `SOCKET.CONNECT.SUCCESS` - Socket successfully connected.
- `SOCKET.DISCONNECT` - Socket intentionally disconnected (e.g., on logout).
- `NOTIFICATION.RECEIVED` - Socket received a transient UI notification payload.

## 3. Routing (`ROUTE`)
- `ROUTE.CHANGE.START` - User initiated navigation to a new path.
- `ROUTE.CHANGE.SUCCESS` - Navigation successfully completed.

## 4. Network Boundary (`API`)
These events use `logAPI.*` and always share a generated `traceId` for the lifecycle of the request.
- `API.REQUEST` - HTTP request dispatched.
- `API.RESPONSE` - HTTP response received successfully (status < 400).
- `API.ERROR` - HTTP request failed or received error status code.

## 5. Authentication (`AUTH`)
- `AUTH.LOGIN.START` / `AUTH.LOGIN.SUCCESS` / `AUTH.LOGIN.FAILURE`
- `AUTH.SIGNUP.START` / `AUTH.SIGNUP.SUCCESS` / `AUTH.SIGNUP.FAILURE`
- `AUTH.LOGOUT.SUCCESS` - User cleared their session.

## 6. Restaurant & Discovery (`RESTAURANT`)
- `RESTAURANT.LOAD.START` / `RESTAURANT.LOAD.SUCCESS` / `RESTAURANT.LOAD.FAILURE` - Fetching restaurant feed.
- `RESTAURANT.DETAIL.LOAD.START` / `RESTAURANT.DETAIL.LOAD.SUCCESS` / `RESTAURANT.DETAIL.LOAD.FAILURE` - Fetching details and menu for a specific restaurant.
- `RESTAURANT.DETAIL.NOT_FOUND` - Requested restaurant ID does not exist.

## 7. Cart Operations (`CART`)
- `CART.ADD.START` / `CART.ADD.SUCCESS` - User attempted to add an item.
- `CART.RESTAURANT.CONFLICT` - User attempted to add an item from a different restaurant.
- `CART.RESET_FOR_RESTAURANT` - Cart was cleared automatically due to a conflict.
- `CART.REMOVE` - Item removed.
- `CART.QUANTITY.UPDATE` - Item quantity changed.
- `CART.CLEAR` - Entire cart was cleared intentionally.

## 8. Orders (`ORDER`)
- `ORDER.VALIDATION.START` / `ORDER.VALIDATION.SUCCESS` - Cart logic validating items before submission.
- `ORDER.CREATE.START` / `ORDER.CREATE.SUCCESS` / `ORDER.CREATE.FAILURE` - Submitting order payload.
- `ORDER.CREATE.PAYLOAD_READY` - Payload fully constructed for network transmission.
- `ORDER.HISTORY.LOAD.START` / `ORDER.HISTORY.LOAD.SUCCESS` / `ORDER.HISTORY.LOAD.FAILURE` - Loading past orders.
- `ORDER.DETAIL.LOAD.START` / `ORDER.DETAIL.LOAD.SUCCESS` / `ORDER.DETAIL.LOAD.FAILURE` - Loading specific order view.

## 9. Favorites (`FAVORITE`)
- `FAVORITE.TOGGLE.START` / `FAVORITE.TOGGLE.SUCCESS` / `FAVORITE.TOGGLE.FAILURE` - Adding/removing a restaurant from favorites.
- `FAVORITE.TOGGLE.UNAUTHENTICATED` - Blocked action because user isn't logged in.

---

### Redux Middleware
Note: If Redux logger middleware is enabled, every Redux action will be logged automatically (e.g. `REDUX.ACTION`) with an automated differential of state changes.
