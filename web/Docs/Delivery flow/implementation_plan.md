# S5b: Favorites - Food Items Extension

This plan addresses the S5b requirements and the 3 specific clarifications to safely extend favorites to food items without causing regressions.

## Clarification 1: Food Item Model Shape
1. **Name & Path**: `IMenuItem` interface and `menuItemSchema` schema inside `API/src/modules/restaurants/restaurant.model.ts`.
2. **Top-Level vs Embedded**: It is **embedded** as `menu: [menuItemSchema]` inside the `Restaurant` model.
3. **Reference Strategy**: Since Mongoose assigns globally unique `ObjectId`s to embedded sub-documents (unless disabled), the `User.favoriteFoodItems` array will store them as flat `ObjectId`s WITHOUT a `ref`:
   `favoriteFoodItems: [{ type: Schema.Types.ObjectId }]`
   This correctly avoids invalid populate calls while allowing us to query `Restaurant.find({ 'menu._id': { $in: user.favoriteFoodItems } })` when needed.

## Clarification 2: `useFavorites()` Signature Precision
1. **Type Signature**: We will use a discriminated union. Even though `restaurantId` isn't strictly required by the backend to toggle an `ObjectId`, typing it strictly ensures the hook scales if the backend later requires compound references:
   ```typescript
   export type FavoriteTarget = 
     | { kind: 'restaurant'; id: string }
     | { kind: 'foodItem'; id: string };

   export function useFavorites() {
     const isFavorite = (target: FavoriteTarget): boolean => { ... };
     const toggleFavorite = async (target: FavoriteTarget): Promise<void> => { ... };
     return { isFavorite, toggleFavorite };
   }
   ```
2. **Endpoint Mapping**: Inside `useFavorites.ts`, the mapping will be an exhaustive `switch (target.kind)` statement. If a new kind is added to the `FavoriteTarget` union, TypeScript will enforce handling it in the `switch`.

## Clarification 3: `useRestaurantLogic` Refactor
I will **keep `useRestaurantLogic` AS-IS**. Refactoring it to use `useFavorites` internally poses a significant risk to the existing toast notifications, local component state, and error handling, breaking perfectly working code. 
Instead, I will leave the restaurant flow completely untouched and wire `useFavorites` purely into `FoodItemCard.tsx` and the newly created `toggleFoodFavoriteThunk`. This completely avoids regression risk on `useRestaurantLogic`.

## Refinements

### Refinement 1: Route Ordering
I will register `POST /favorites/food/:foodItemId` strictly BEFORE `POST /favorites/:restaurantId` in `user.routes.ts` to prevent Express from matching `food` as a `restaurantId`. I will add a comment explaining this ordering requirement. I will also add a runtime verification step to explicitly test this endpoint routing.

### Refinement 2: Rapid-click / Pending Handling
Upon inspecting `useRestaurantLogic`, the current `handleToggleFavorite` implementation has **no pending guard**. It dispatches unconditionally and relies on the backend's inherent idempotency (the toggle logic). I will mirror this exact behavior in `useFavorites`—it will dispatch unconditionally to preserve consistency with the existing flow.

### Refinement 3: Hard Reload Persistence
The manual verification plan has been updated to include a **HARD RELOAD** step to definitively prove the toggle persists to MongoDB and reconstructs cleanly into the Redux state upon re-hydration.

## Proposed Changes

### Backend

#### [MODIFY] auth.model.ts
- Add `favoriteFoodItems: [{ type: Schema.Types.ObjectId }]` to the `User` schema.

#### [MODIFY] user.routes.ts
- Expose `POST /favorites/food/:foodItemId` bound to `toggleFoodFavorite`.
- **CRITICAL**: Place this route BEFORE `POST /favorites/:restaurantId` to avoid param shadowing.

#### [MODIFY] user.controller.ts
- Add `toggleFoodFavorite` mirroring `toggleFavorite`, operating on `favoriteFoodItems`.

### Frontend

#### [MODIFY] authSlice.ts
- Add `favoriteFoodItems` to the `User` interface.
- Add `toggleFoodFavoriteThunk` (mirrors `toggleFavoriteThunk`, pointing to `/api/users/favorites/food/`).

#### [NEW] useFavorites.ts
- Create the generic `useFavorites()` hook with the discriminated union.
- Dispatches unconditionally without a pending guard, matching legacy behavior.

#### [MODIFY] FoodItemCard.tsx
- Remove the local `useState(false)` source of truth for `isFavorite`.
- Read `isFavorite({ kind: 'foodItem', id: foodItem.id })` from `useFavorites`.
- Bind the heart click to `toggleFavorite({ kind: 'foodItem', id: foodItem.id })`.

## Verification Plan

### Automated Tests
- Create `useFavorites.test.tsx` verifying the discriminated union correctly selects the restaurant vs food item thunks, and cleanly surfaces the current boolean from mocked auth slices.
- Runtime backend routing test: `POST /api/users/favorites/food/:foodItemId` successfully resolves to the food toggle controller (avoiding route shadowing).

### Manual Verification
- In the frontend, navigate to a Restaurant Details page.
- Click a food item heart. Ensure the API fires and the heart fills.
- **HARD RELOAD** the page.
- Assert the heart stays filled (proving MongoDB persistence and hydration).
- Verify restaurant favorites remain completely functional.
