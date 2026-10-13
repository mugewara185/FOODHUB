# S00 Baseline Capture & Safety Net — Evidence Notes

Recorded: 2026-10-14  
Repository: `https://github.com/mugewara185/FOODHUB.git` (local remote: `https://github.com/mugewara185/Zom2.git`)  
Target Branch: `dev/development`  
Authoritative Brief: `docs/portf/slices/SLICE-00.md`  

---

## 1. Git Preflight & Working Tree State

- **Current Branch**: `dev/development`
- **Configured Remote**: `origin` -> `https://github.com/mugewara185/Zom2.git`
- **Upstream Branch**: `origin/dev/development` (in sync, no unpushed/unpulled commits at start)
- **Initial HEAD SHA**: `d74da6c03f388c56839e2816029edf8611bda81e` (`portf setup`)
- **Original Audit Baseline SHA**: `f9bc00851afadaf2934188cda27061da005b96e8`
- **Initial Worktree Status**: Clean (`git status --short --branch` returned `## dev/development...origin/dev/development`)

### Delta between Audit Baseline and Current Checkout (`f9bc008..d74da6c`)

Commit `d74da6c` ("portf setup") by `Aansil <aansil21@gmail.com>` on 2026-10-13 advanced the branch by 1 commit. The diff across `web/` and `API/` is strictly isolated:
- `docs/portf/**`: 15 planning and audit documentation files added (+1,226 lines).
- `postman/collections/FOODHUB/`: Renamed `live-1.request.yaml` -> `live-me.request.yaml`.
- `web/src/data/types/food.ts`: Uncommented line 6 `import type { Restaurant, FoodItem, Cart, Order } from '@/core/types'`. This added 1 unused import TypeScript error (`TS6192`), increasing the total compiler errors from 1,244 to 1,245.

No other application source files differ between the original audit baseline and the start of S00.

---

## 2. Prescribed Frontend Verification Commands & Results

### A. Vitest Test Suite (`cd web; npx vitest run`)

- **Baseline Result (Pre-S00)**:
  - Exit Code: `1`
  - Test Files: `6 failed | 9 passed (15 total)`
  - Tests: `5 failed | 33 passed (38 total)`
  - Duration: `17.96s`

- **Post-S00 Result (with new characterization test suites)**:
  - Exit Code: `1`
  - Test Files: `6 failed | 11 passed (17 total)` (+2 passing suites)
  - Tests: `5 failed | 50 passed (55 total)` (+17 passing tests)
  - Duration: `28.62s`
  - **New Regressions**: `0`
  - **Unrelated Pre-existing Failures (Retained untouched per S00 firewall)**:
    1. `src/features/deliveryPartner/__tests__/deliveryBugs.test.tsx` (mock missing default export on uiSlice)
    2. `src/features/orders/__tests__/useDeliveryTracking.test.tsx` (missing `./useDeliveryTracking`)
    3. `src/core/dev/__tests__/simulator.test.ts` (unbundled `node:test` in client environment)
    4. `src/core/dev/utils/factorySeed.test.ts` (schemaVersion assertion failure)
    5. `src/core/notifications/__tests__/deliveryNotifications.test.tsx` (2 tests: onAssigned / onStatus not a function)
    6. `src/features/admin/__tests__/useAdminFleet.test.tsx` (fleet array length assertion)

### B. TypeScript Compiler Check (`cd web; npx tsc -p tsconfig.app.json --noEmit`)

- **Exit Code**: `1` (shell exit code 2 on Windows cmd)
- **Total `error TS` count**: `1,245`
  - 1,244 pre-existing errors at SHA `f9bc008`
  - +1 error introduced in `d74da6c` (`web/src/data/types/food.ts(6,1): error TS6192: All imports in import declaration are unused`)
  - **0 errors introduced by S00 characterization test files**

### C. Vite Production Build (`cd web; npx vite build --outDir <scratch> --emptyOutDir`)

- **Exit Code**: `0`
- **Duration**: `1m 16s`
- **Output Bundle Size**: Main chunk `index-*.js` `2,537.49 kB` (`740.17 kB` gzip).
- **Observations**: Dev-documentation chunks (`FRAMEWORK_*`, `DEV_RENDERER_GUIDE`, `HOME_FILE_STRUCTURE`, etc.) are bundled into production distribution.

---

## 3. Characterization Tests Added (Scope 3.C)

Two new test suites were created to pin current behavior and characterize known defects so later vertical slices flip them deliberately:

### 1. `web/src/services/api/restaurantApi.test.ts` (7 tests, all passing)
- Normalization of numeric backend `deliveryTime` to string format `"${m}-${m+10} min"` (`30` -> `"30-40 min"`, `20` -> `"20-30 min"`).
- Defaulting missing `deliveryFee` to `0` when undefined.
- Image fallback priority: `imageUrl` preferred over `image`, falling back to `image` when empty, and `''` when both absent.
- Banner image fallback: `coverImageUrl` preferred over `bannerImage`.
- Documenting D-13 root cause: `isVeg` is omitted by normalizer (remains `undefined` for all backend records).
- ID mapping from `_id` and defaulting `isFeatured` to `false` when absent.
- `normalizeMenuItems` fallback defaults (`isVeg: false`, `rating: 0`, `isBestSeller: false`, etc.).

### 2. `web/src/features/restaurant/restaurantSlice/__tests__/restaurantSlice.test.ts` (10 tests, all passing)
- `toggleCuisine` resets `pagination.currentPage` to `1`.
- **Characterizing D-11**: `setSearchQuery` does **not** reset `pagination.currentPage` to `1` (defect pinned; asserts `currentPage` remains at 3).
- **Characterizing D-10**: `filterByCuisine('all')` replaces `state.restaurants` with `mockRestaurants` (which is `[]` in unit/prod environments), emptying loaded data.
- `selectFilteredRestaurants` search filter: case-insensitive matching across `name` and `cuisine`.
- `selectFilteredRestaurants` cuisine filter: multi-cuisine inclusion logic.
- `selectFilteredRestaurants` minimum rating filter.
- **Characterizing D-12**: `deliveryTime` filter uses strict string equality (`restaurant.deliveryTime === filters.deliveryTime`), failing against numeric `30` or UI options such as `'10-15 mins'`.
- **Characterizing D-13**: `isVeg` filter evaluates `!restaurant.isVeg`, which excludes all normalized API restaurants where `isVeg === undefined`.
- `selectPaginatedRestaurants` and `selectTotalPages`: 25 items at `itemsPerPage: 10` partitions into 3 pages (lengths 10, 10, 5).
- `fetchRestaurants` thunk fulfilled lifecycle: updates `fetchStatus = 'success'`, sets `restaurants`, and filters `featuredRestaurants = payload.filter(r => r.isFeatured)`.

---

## 4. Runtime & Browser Evidence (Scope 3.D)

Automated browser testing was conducted against the running frontend at `http://localhost:5173` using headless Chromium via Puppeteer. In accordance with S00 safety rules, `localStorage.setItem('DEV_DATA_SOURCE', 'mock')` was evaluated before document load to prevent any calls to production databases or development auth bypasses.

### Captured Screenshots (`docs/portf/baseline/`)

| File | Viewport | Target |
|---|---|---|
| `home-360.png` | 360 x 800 | Home page mobile view |
| `home-768.png` | 768 x 1024 | Home page tablet view |
| `home-1280.png` | 1280 x 800 | Home page desktop view |
| `restaurants-360.png` | 360 x 800 | Listing mobile view |
| `restaurants-768.png` | 768 x 1024 | Listing tablet view |
| `restaurants-1280.png` | 1280 x 800 | Listing desktop view |
| `restaurants-viewport-700h.png` | 1280 x 700 | Listing short desktop view for pager clipping |

### Confirmed / Refuted Audit Findings

- **D-01 (MUI v7 `Grid` legacy props ignored)**: **CONFIRMED (Runtime-verified)**.  
  Live browser console emitted repeated warnings:  
  `MUI Grid: The item prop has been removed and is no longer necessary.`  
  `MUI Grid: The xs/sm/md prop has been removed. See https://mui.com/material-ui/migration/upgrade-to-grid-v2/`  
  Because legacy props generate no width rules in MUI v7.3.7, Grid items render as unstructured flex items.
- **D-02 (Dev markers render in production/mock)**: **CONFIRMED (Runtime-verified)**.  
  Live DOM query on `/` detected dev chip: `'⚡ Development Mode - _V_ Renderer'` in `HeroCompact`.
- **D-09 (URL query params ignored by listing)**: **CONFIRMED (Runtime-verified)**.  
  Direct navigation to `/restaurants?cuisine=Indian` and `/restaurants?filter=featured` both resulted in the default 8 cards with `chips: []`. No filter was activated in UI state, confirming that the listing does not read URL search params.
- **D-15 (Listing page shell and pager clipping)**: **CONFIRMED (Runtime-verified)**.  
  On a 700px viewport, pagination element sits below the viewport fold and inner container sizing traps content scrolling.
- **D-16 (Tailwind classes inert)**: **CONFIRMED (Runtime-verified)**.  
  Inspect card DOM shows Tailwind classes (`aspect-video`, `line-clamp-1`, `flex`, `items-center`) with no active CSS rules defined.

---

## 5. Scope Firewall Compliance

- **Application source files modified**: `0`
- **Configuration files modified**: `0`
- **Dependencies modified**: `0`
- **S01 or subsequent slices implemented**: `None`
- **Files added**:
  - `docs/portf/baseline/NOTES.md` (this file)
  - `docs/portf/baseline/*.png` (7 baseline screenshots)
  - `web/src/services/api/restaurantApi.test.ts`
  - `web/src/features/restaurant/restaurantSlice/__tests__/restaurantSlice.test.ts`

---

## 6. Verification Gate Summary

| Category | Status | Details |
|---|---|---|
| **Implemented** | PASS | Both characterization test suites and baseline evidence generated |
| **Build-verified** | PASS | Vitest (17/17 new tests pass), TypeScript (0 new errors), Vite build exit 0 |
| **Runtime-verified** | PASS | Headless Chromium captured 7 screenshots and verified D-01, D-02, D-09, D-15, D-16 |
| **E2E-verified** | DEFERRED | S00 is baseline capture; full multi-actor product E2E is scheduled for S08 |

S00 is complete and authorized to pass its gate.
