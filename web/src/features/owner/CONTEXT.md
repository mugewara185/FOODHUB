# Owner Domain Context

## Architecture
The Owner Domain provides a restaurant management interface. Currently, backend APIs are limited, and specifically, the backend `User` model lacks a direct `restaurantId` linkage for authorization, and the REST endpoints for owner operations (fetching/mutating orders, updating menu items) do not exist.

To unblock frontend development and provide a credible functional product demonstration, we use a Redux-backed mock provider (`ownerSlice.ts` and `ownerMockApi.ts`).

## Data Sources (Mock vs Real)
- **Real Data**: Not currently used for Owner pages. 
- **Mock Data**: We use `generateAllDummyData` from `unifiedFactory.ts` to hydrate `ownerMockApi.ts` in-memory state on initialization.
- **Provider**: `ownerMockApi.ts` simulates network delays and serves data that strictly aligns with the actual core models (`Order`, `FoodItem`, `Restaurant`, `Review` from `core/types/food.ts`).
- **Store**: `ownerSlice.ts` caches this state, allowing UI components to mutate orders, toggle availability, and change restaurant status without page reloads.

## Ownership Model (Gaps)
- **Current State**: The backend `auth.model.ts` has a `roles` array which includes `'owner'`, but it DOES NOT map an owner to a specific `Restaurant` document ID.
- **Enforcement**: Since there are no owner APIs, there is no server-side enforcement. The frontend simply loads a single mocked restaurant for demonstration.
- **Future Work**: The backend requires an update to include `ownedRestaurantId` on `User` and role-based guards (RBAC) on new `restaurants/:id/orders`, `restaurants/:id/menu` endpoints.

## API Boundaries
When replacing `ownerMockApi.ts` with real endpoints, map the thunks in `ownerSlice.ts` directly to the new `axios` calls. Because we used the actual application types (`Order['status']`), the UI layer will require zero refactoring.

## Logger Usage
The `logger` is actively used in `ownerMockApi.ts` to make simulated backend mutations observable.
- Events logged: `MOCK API: getOrders`, `MOCK API: updateOrderStatus`, etc.

## Known Limitations
- Analytics are derived dynamically from the mock dataset, meaning revenue charts refresh on hard load based on newly generated random data.
