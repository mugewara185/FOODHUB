# S05 Home Truthfulness: Data Provenance & Truthful CTAs — Evidence Notes

Recorded: 2026-10-14  
Repository: `https://github.com/mugewara185/FOODHUB.git` (local remote: `https://github.com/mugewara185/Zom2.git`)  
Target Branch: `dev/development`  
Authoritative Brief: `docs/portf/slices/SLICE-05.md`  

---

## 1. Summary of Changes Implemented

S05 transforms the Home page from an experience displaying fabricated statistics, fictional testimonials, non-functional promo codes, and fake quick delivery partners into an honest, fully truthful consumer food-ordering interface backed by genuine API and Redux data.

### Architectural & State Extensions (`web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts`)
- **`selectCuisineSummary` (Memoized Selector)**:
  - Dynamically extracts unique cuisines across all loaded restaurants.
  - Aggregates accurate restaurant counts per cuisine.
  - Selects cover image from the highest-rated restaurant in that cuisine with fallback support.
- **`selectFastestRestaurants` (Memoized Selector)**:
  - Parses real delivery time estimates (e.g. `"20-30 min"`, `"30 min"`) into ascending numerical minutes.
  - Returns top 3 fastest-delivering restaurants.
- **`fetchMenuHighlights` (Async Thunk)**:
  - Queries `restaurantApi.getById` across top featured restaurants in parallel (`Promise.allSettled`).
  - Filters out unavailable items (`isAvailable !== false`).
  - Stores items in `state.menuHighlights: { status, items, error }` with graceful empty/error handling.
- **`selectMenuHighlights` (Selector)**: Exposes menu highlights status, items, and error.

### Truthful Components (`web/src/features/home/components/`)
1. **`FastestDeliverySection.tsx`** (New):
   - Replaces `QuickDeliverySection` (which claimed fabricated 15-minute quick-commerce items).
   - Renders the top 3 restaurants by real delivery time using the standardized S03 `RestaurantCard` and MUI v7 Grid (`size={{ xs: 12, md: 4 }}`).
2. **`CuisineGridSection.tsx`** (New):
   - Replaces `CuisinesSection`.
   - Displays top 6 distinct cuisines with genuine restaurant counts and `SafeImage` cover.
   - Working deep links navigating to `/restaurants?cuisine=<name>`.
3. **`MenuHighlightsSection.tsx`** (New):
   - Replaces `TopDishesSection` (which showed mock-factory items with fake toasts).
   - Renders up to 6 real menu items fetched from actual restaurant menus.
   - Genuine "Add to Cart" action dispatching `addToCart` with single-restaurant conflict interception.
   - Custom MUI `Dialog` ("Replace items in cart?") when an item from a different restaurant is added while the cart is non-empty.
   - Secondary "View menu" link navigating to `/restaurants/:id`.
4. **`HowItWorksSection.tsx`**:
   - Rewrote steps to honest consumer ordering flow: "Explore Restaurants", "Choose Your Dishes", "Seamless Checkout", "Live Order Tracking".
   - Removed misleading claims ("Set your location near you", "20-40 minutes").
   - Migrated Grid to MUI v7 `size={{ xs: 12, sm: 6, md: 3 }}`.
5. **`HeroCompact.tsx`**:
   - Dynamic real stats: Real restaurant count, real cuisine count, and real fastest delivery minutes.
   - Skeleton loading state while restaurants are loading (never displays "0 Restaurants").
   - Search input connects to `/restaurants?q=<query>`.
6. **`Home_V.tsx`**:
   - Composed truthful sections in natural consumer ordering rhythm:
     `HeroCompact` → `FeaturedRestaurantsSection` → `MenuHighlightsSection` → `FastestDeliverySection` → `CuisineGridSection` → `HowItWorksSection` → `Truthful CTA`.
   - Replaced scratch chip (`"add more components here..."`) and purple gradient with theme palette.
   - Inline error `Alert` with working `Retry` button re-dispatching `fetchRestaurants` and `fetchMenuHighlights`.
7. **Listing Contract & Search Redirection (Minimal S04 contract)**:
   - `Restaurants_V.tsx`: Synchronizes URL search params (`?cuisine=`, `?q=`, `?sort=`) on mount.
   - `UserRoutes.tsx`: Added `SearchRouteRedirect` forwarding `/search` and `/search?q=` to `/restaurants?q=`.

### Legacy Annotations
- Marked fabricated legacy components with `/** @deprecated fabricated content — see docs/portf */`:
  - `StatsSection.tsx`, `PromoSection.tsx`, `QuickDeliverySection.tsx`, `TopDishesSection.tsx`, `TestimonialsSection.tsx`, `CuisinesSection.tsx`.

---

## 2. Verification Evidence

### A. Automated Unit & Integration Tests
1. **`restaurantSlice.home.test.ts` (4/4 passed)**:
   - Memoized `selectCuisineSummary`: aggregates unique cuisines, counts, and highest-rated cover image.
   - Memoized `selectFastestRestaurants`: sorts restaurants by delivery time ascending.
   - `fetchMenuHighlights` thunk: dispatches `getById` for featured restaurants and filters unavailable items.
   - Fallback resilience on API error: captures error state cleanly without unhandled rejection.
2. **`Home_V.test.tsx` (3/3 passed)**:
   - Renders all truthful section headers (`Featured Restaurants`, `Menu Highlights`, `Fastest Delivery`, `Browse by Cuisine`, `How It Works`, `Ready to Order?`) and real loaded data.
   - Single-restaurant cart conflict dialog: adding an item from a different restaurant displays the confirmation dialog and preserves the current cart if canceled.
   - **FORBIDDEN-TEXT LINT**: Asserts that none of the following fabricated tokens appear in the DOM:
     - Stats: `2500+`, `50K+`, `100K+`, `10k`
     - Promo codes: `FIRST50`, `MEGA40`, `FREEDELIVERY`
     - Fictional testimonials: `Sarah Johnson`, `Rajesh Kumar`, `pravatar.cc`
     - Scratch notes: `add more components here`
     - Fabricated headings: `MOST ORDERED`, `Quick Commerce`
3. **Characterization Tests (All passing, 0 regressions)**:
   - `restaurantApi.test.ts` (4 passed)
   - `restaurantSlice.test.ts` (10 passed)
   - `SafeImage.test.tsx` (5 passed)
   - `RestaurantCard_V.test.tsx` (8 passed)
   - `RestaurantGrid.test.tsx` (1 passed)

### B. TypeScript Compiler Check
- Command: `npx tsc -p tsconfig.app.json --noEmit`
- Baseline errors: `1,245`
- S03 post-refactor errors: `1,240`
- **S05 post-refactor errors: `1,221` (19 fewer compiler errors)**
- Errors in S05 touched files: **0**

### C. Production Build
- Command: `npx vite build`
- Exit Code: **0**
- Duration: 1m 12s
- Forbidden string check in production chunk:
  - `findstr /m /c:"Sarah Johnson" web\dist\assets\Home_V-*.js` → Exit 1 (No match)
  - `findstr /m /c:"factorySeed" web\dist\assets\Home_V-*.js` → Exit 1 (No match)

### D. Visual Evidence Screenshots (`docs/portf/s05-evidence/`)
Captured via automated headless Chromium runner against production preview (`DEV_DATA_SOURCE=mock`):
1. `home-1280.png` (1280x800 desktop):
   - Truthful stats in Hero ("20 Restaurants", "10 Cuisines", "30m Fastest Delivery").
   - "Featured Restaurants" section with truthful subtitle "Restaurants highlighted on FoodHub".
2. `home-768.png` (768x1024 tablet): Responsive layout verified.
3. `home-360.png` (360x800 mobile): Responsive compact view verified.
