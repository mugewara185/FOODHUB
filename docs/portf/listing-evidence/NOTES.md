# S04 Listing Contract & Restaurant Discovery Polish — Evidence Notes

Recorded: 2026-10-14  
Repository: `https://github.com/mugewara185/FOODHUB.git` (local remote: `https://github.com/mugewara185/Zom2.git`)  
Target Branch: `dev/development`  
Authoritative Brief: `docs/portf/slices/SLICE-04.md` / Restaurant Listing Page Redesign & Functional Polish  

---

## 1. Summary of Changes Implemented

The restaurant listing page (`web/src/pages/restaurantListings/V/Restaurants_V.tsx`) has been redesigned and polished to achieve a responsive, portfolio-quality discovery experience matching the high standard of the Home page, while respecting its distinct purpose: **restaurant discovery, filtering, comparison, and navigation**.

### Architectural & State Extensions (`web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts`)
- **Resolved Slice Defects (D-10, D-11, D-12, D-13)**:
  - **D-10**: Fixed `filterByCuisine` reducer that was resetting all other filters. Now preserves other filters or uses dedicated toggle.
  - **D-11**: Fixed `setSearchQuery` reducer to reset `currentPage` to 1 on search input change.
  - **D-12**: Fixed delivery time filter to parse numerical upper bound (`<= maxMinutes`) rather than strict equality matching.
  - **D-13**: Evaluated pure boolean `isVeg === true` rather than truthy non-empty check.
- **Added Redux Capabilities**:
  - `featuredOnly` boolean filter property in state and URL.
  - `hydrateFilters` action for atomic batch hydration from URLSearchParams without multi-step re-renders.
  - `lastFetchedAt` timestamp with 60-second cache condition on `fetchRestaurants` to eliminate skeleton flash on route returns.
- **Added Selectors**:
  - `selectHasVegData`: checks whether catalogue data contains any explicit vegetarian flags.
  - `selectIsInitialLoading`: differentiates initial cold-start catalogue loading from filter changes.
  - `selectTotalPages`: clamped safely to `>= 1`.
  - `selectPaginatedRestaurants`: pagination slicing with bounds clamping.

### URL State Synchronization Contract (`web/src/features/restaurant/hooks/useRestaurantUrlState.ts`)
- Implemented pure `parseUrlParams` and `serializeUrlParams` functions supporting `q`, `cuisine`, `rating`, `time`, `open`, `featured`, `sort`, and `page`.
- Bidirectional synchronization between URL query parameters and Redux store with `isSyncingFromUrlRef` loop guard.
- Uses `replace: true` for typing and debounce search input, and `push: true` for discrete filter selections to preserve clean browser back/forward history.

### Listing Page Redesign (`web/src/pages/restaurantListings/V/Restaurants_V.tsx`)
- **Natural Layout & Sticky Sidebar**:
  - Eliminated rigid viewport height constraints (`calc(100vh - 140px)`).
  - Single natural page scrollbar; zero nested container scrollbars.
  - Sticky desktop sidebar (`SIDEBAR_WIDTH = 290px`, `top: 84px`) with independent internal overflow scroll.
  - Natural bottom placement for pagination controls.
- **Responsive Card Grid**:
  - Responsive breakpoints: `size={{ xs: 12, sm: 6, md: 6, lg: 4 }}`.
  - On `md` screens (beside the 290px sidebar), cards comfortably render in 2 columns instead of cramped 3 columns. On `lg`/`xl`, renders 3 columns. On mobile (`xs`), full-width single column.
- **Discovery Hierarchy**:
  - Clean compact `<h1>` "Explore Restaurants" heading with truthful count badge (`X places` / `1 place`).
  - Discovery toolbar with search input (with debounced dispatch and clear button) and sort selector.
  - Active filter chips bar (`data-testid="active-filter-chips"`) with individual chip removal and "Clear all" button.
  - Refined filter accordions with clean borders and active count badges.
  - Mobile filter drawer with independent scrolling and fixed bottom actions ("Clear all", "Apply filters").
- **States & Truthfulness**:
  - Grid skeleton loader matching card dimensions during cold starts.
  - Truthful empty state with "Reset all filters" button when filters yield 0 results.
  - Retryable error state alert box when catalogue fetch fails.

---

## 2. Verification Evidence

### A. Automated Unit & Integration Tests (50/50 Passed)
- **`web/src/pages/restaurantListings/__tests__/Restaurants_V.test.tsx` (6/6 passed)**:
  1. `renders discovery page header and truthful restaurant count badge`
  2. `initializes filters and active chips from supported URL query parameters`
  3. `handles search input with debounce and updates filtered cards`
  4. `clears active filters and restores full catalogue when Clear All is clicked`
  5. `displays truthful empty state when filters produce zero matches and allows reset`
  6. `displays retryable error alert when catalogue fetch fails`
- **`web/src/features/restaurant/hooks/__tests__/useRestaurantUrlState.test.ts` (8/8 passed)**:
  - Tests parsing, serialization, defaults handling, invalid value guards, and round-trip consistency.
- **`web/src/features/restaurant/restaurantSlice/__tests__/restaurantSlice.test.ts` (14/14 passed)**:
  - Tests D-10, D-11, D-12, D-13 fixes, `hydrateFilters`, `featuredOnly`, and selectors.
- **Touched Domain Regression Suites (22/22 passed)**:
  - `web/src/pages/Home/__tests__/Home_V.s07.test.tsx` (6 passed)
  - `web/src/pages/Home/__tests__/Home_V.test.tsx` (3 passed)
  - `web/src/features/restaurant/restaurantSlice/__tests__/restaurantSlice.home.test.ts` (4 passed)
  - `web/src/features/restaurant/components/RestaurantCard/__tests__/RestaurantCard_V.test.tsx` (8 passed)
  - `web/src/services/api/restaurantApi.test.ts` (1 passed)

### B. Responsive & Horizontal Overflow Verification
Measured programmatically via Puppeteer at `http://localhost:4173/restaurants`:

| Viewport | Device Class | ScrollWidth | ClientWidth | InnerWidth | Horizontal Overflow? |
|:---:|:---|:---:|:---:|:---:|:---:|
| **320px** | Ultra-narrow Mobile | 320 | 320 | 320 | **FALSE (0px)** |
| **360px** | Small Android | 360 | 360 | 360 | **FALSE (0px)** |
| **390px** | Standard iPhone (12/13/14) | 390 | 390 | 390 | **FALSE (0px)** |
| **430px** | Large Mobile (iPhone Pro Max) | 430 | 430 | 430 | **FALSE (0px)** |
| **768px** | Portrait Tablet (iPad) | 768 | 768 | 768 | **FALSE (0px)** |
| **1024px** | Small Desktop / Tablet Landscape | 1024 | 1024 | 1024 | **FALSE (0px)** |
| **1280px** | Standard Desktop | 1280 | 1280 | 1280 | **FALSE (0px)** |
| **1440px** | Large Desktop | 1440 | 1440 | 1440 | **FALSE (0px)** |

### C. Visual Evidence Captures
Stored in [`docs/portf/listing-evidence/`](./):
- `restaurants-320.png`: Ultra-narrow mobile listing view
- `restaurants-360.png`: Small mobile listing view
- `restaurants-390.png`: Standard mobile listing view
- `restaurants-430.png`: Large mobile listing view
- `restaurants-768.png`: Tablet listing view
- `restaurants-1024.png`: Small desktop listing view (sidebar + 2 card columns)
- `restaurants-1280.png`: Standard desktop listing view (sidebar + 3 card columns)
- `restaurants-1440.png`: Large desktop listing view
- `restaurants-filtered-1280.png`: Filtered URL state (`?cuisine=Indian&featured=1`) showing active chips and truthful matching count

### D. Production Build Verification
- Command: `npm run build`
- Exit Code: **0**
- Module size: `dist/assets/Restaurants_V-*.js` ~17.04 kB (gzip: ~5.10 kB)
