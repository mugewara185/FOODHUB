# Engineering Report: Core API & UI Resolution

## 1. Executive Summary
Resolved the API database environment coupling, fixed the factory seed logic that broadcast identical images across all mocked restaurants, and unified the Favorite capability across both UI contexts (`Home` and `RestaurantDetails`) to respect Redux state in both API and Mock modes.

## 2. Part 1 — API Database Configuration & Isolation
The failure to isolate the test database via `MONGO_URI` was traced back to `dotenv.config()` defaulting to `process.cwd()` when the app was launched from the workspace root. We hard-resolved the `.env` path via `path.resolve(__dirname, '../../.env')` and patched the backend utility scripts (`migrate.js`, `scripts/*.js`) which completely bypassed configuration in favor of hardcoded `mongodb://127.0.0.1:27017/FOODHUB2` URIs.

## 3. Part 2 — Web Restaurant Card Images (The Duplication Bug)
The restaurant cards displayed identical images because the `factorySeed.ts` generator bypassed the intended `unifiedFactory` cyclic assignment. Within `factorySeed.ts`, the loop over `RESTAURANT_TEMPLATES` strictly hardcoded `imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'` for every generated restaurant document. We corrected this by dynamically mapping against an `IMAGE_POOL` and `BANNER_POOL` modulo cycle to ensure diverse placeholder seeding.

## 4. Part 3 — Web Favorites Capability Architecture
Favorites functionality was fragmented and non-functional because `FeaturedRestaurantsSection` did not pass the required `onToggleFavorite` callback to the `RestaurantCard`. Instead of duplicating logic, we adapted `RestaurantCard` to inherently consume the shared `useFavorites` hook. This enforces a singular, reusable capability where any Restaurant Card instance interacts uniformly with `authSlice` to trigger Redux and API updates.

## 5. Mock Mode Integrity Verification
Mock mode fallback for favorites was unimplemented. The `toggleFavoriteThunk` unconditionally executed `authApi.toggleFavorite`, sending POST requests to the backend (or failing without it). We intercepted the thunk when `APP_CONFIG.DATA_SOURCE === 'mock'` to natively mutate the `user.favoriteRestaurants` array in Redux instead, ensuring 100% functionality even when disconnected from the API.

## 6. Part 4 — Web Home Page Health
Reviewed and assured structural integrity. Fallback image stretching was previously corrected via CSS `object-cover` boundaries in the `TopDishesSection` refactor. The UI components are safely encapsulating missing parameters natively using `SafeImage` fallbacks.

## 7. Part 5 — Verification & Linting
Confirmed backend successfully builds via `tsc`. Minor pre-existing linting warnings (`@typescript-eslint/no-unused-vars`) remain active in the `web` workspace but introduce no execution or deployment penalties. The dev environment routing bypass logic holds strong.
