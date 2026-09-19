- Maps to spec sections: §31 (Favorites)
- Goal: Extend the existing User-embedded favorites pattern to support food items with a small reusable abstraction on the frontend, avoiding a full polymorphic migration.

- In scope:
  Part A — Backend Extension:
  1. Add `favoriteFoodItems: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }]` (or appropriate ref) to the `User` schema in `API/src/modules/auth/auth.model.ts`.
  2. Add a new route `POST /api/users/favorites/food/:foodItemId` mirroring the existing restaurant toggle route.
  3. Implement the corresponding controller logic to toggle the food item ID in `user.favoriteFoodItems`.

  Part B — Frontend Reusable Layer:
  1. Add `favoriteFoodItems` to the Redux Auth user state.
  2. Create a generic `useFavorites()` hook exposing:
     - `isFavorite(kind: 'restaurant' | 'foodItem', id: string): boolean`
     - `toggleFavorite(kind: 'restaurant' | 'foodItem', id: string): Promise<void>`
  3. The hook routes to the correct Redux thunk (`toggleRestaurantFavoriteThunk` or `toggleFoodFavoriteThunk`) based on the `kind`.
  4. Refactor existing `useRestaurantLogic` to consume the new `useFavorites()` hook instead of dispatching directly.

  Part C — UI Wiring:
  1. Identify the active food item card component used on the Restaurant Details page.
  2. Wire a heart/favorite toggle into this specific food item card using `useFavorites('foodItem', id)`.
  3. Do NOT wire all food card variants across the app.

- Out of scope (do NOT touch):
  - Migrating to the polymorphic `Favorite` entity described in spec §31.
  - Adding favorite buttons to Home or RestaurantListings food cards.
  - Creating a second, parallel favorite system from scratch.
  - Any UI redesign.

- Verification:
  - `cd API && npx tsc --noEmit` -> passes.
  - `cd web && npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -iE "favorite|food|restaurant"` -> clean for touched files.
  - Runtime headless test for `useFavorites`:
    - `isFavorite('restaurant', id)` and `isFavorite('foodItem', id)` return correct values based on mocked state.
    - `toggleFavorite` dispatches the correct endpoint based on kind.
    - Unauthenticated toggles do nothing (fail safely).
  - Manual verification: clicking the food favorite heart on the Restaurant Details page fills it; persists through navigation and reload/logout.

- Debt Logging:
  - Update `DELIVERY_STATUS.md` with: "The spec proposed a polymorphic Favorite entity. Current implementation uses embedded arrays on User. Decision: extend the existing pattern with a reusable frontend layer. Migrate to polymorphic entity only when a third favorite type appears."

- Stop Conditions:
  - If adding the food-item toggle requires touching more than 5 files -> STOP and show the list.
  - If the existing `RestaurantCard` favorite button behavior deviates from the assumption -> STOP and ask.
