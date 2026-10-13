# 00 — FoodHub Portfolio Audit

> Planning artefact only. No application code was changed to produce it.
> Index: [README](README.md) · Plan: [01](01-vertical-slice-plan.md) · Slices: [slices/](slices/) · Verification: [03](03-verification-matrix.md) · Open questions: [04](04-open-questions.md)

## 1. Audit baseline

| Item | Value |
|---|---|
| Local path | `c:\Aa\vs_Code\mern projects\zom2` |
| Branch | `dev/development` (matches expected) |
| **Initial HEAD SHA (baseline)** | `f9bc00851afadaf2934188cda27061da005b96e8` ("env changes", 2026-10-13 03:04 +05:30) |
| `origin` | `https://github.com/mugewara185/Zom2.git` |
| Repo identity | **Remote name differs from the brief (`FOODHUB.git`).** Verified same repo: `git ls-remote` on both URLs returned the identical `refs/heads/dev/development` tip `f9bc008…`; `README.md` title is "FoodHub"; `render.yaml` service is `foodhub-api`. Treated as a renamed repo. Recorded here instead of silently assumed. |
| Working tree at start | **Clean** (`git status --porcelain=v1 -b` printed only `## dev/development...origin/dev/development`). |
| Working tree at end | Only new, untracked `docs/portf/**` (see README for final `git status`). |
| Stray tracked file | `web/src/App.test.ts    (create)` — literal filename with spaces + "(create)", 313 bytes. Probably an accidental artefact. Not touched. |

### Instruction documents
| Requested path | Result |
|---|---|
| `/docs/ai/project_instruction_0.txt` | **ABSENT** (`docs/ai/` has only `AI_ARCHITECTURE.md`, `AI_OBSERVABILITY.md`, `AI_TOOL_REGISTRY.md`, `IMPLEMENTATION_STATUS.md`) |
| `/docs/ai/development-working-flow-conversation-format` | **ABSENT** |
| Equivalents found and read | `.agents/workflows/instructions.md` and `AiPrompt/core/core-instructions.md` (same content in spirit): inspect before changing; reuse existing abstractions; prefer small verifiable changes; record unrelated debt instead of expanding scope; read nearest `context.md`; keep business logic server-authoritative. The plan follows these. |

## 2. Verification levels (what was actually done)

| Level | Done? | Detail |
|---|---|---|
| Source-inspected | **Yes** | Files cited below, read at baseline SHA. |
| Build-verified | **Partial** | `npx vite build --outDir <scratch> --emptyOutDir` → exit 0 in 79.6 s. Main chunk `index-*.js` 2,537.41 kB (740.59 kB gzip), >500 kB warning. **`tsc` is NOT clean** (see below). |
| Unit tests | **Yes (baseline)** | `npx vitest run` → exit 1: **6 files failed / 9 passed; 5 tests failed / 33 passed (38)**. Failures are unrelated to Home/listing (3 suites fail to resolve `./useDeliveryTracking`; failures in `useAdminFleet`, `factorySeed`, `deliveryNotifications`). **No test exists for Home, listing, restaurant slice, RestaurantCard or SafeImage.** |
| Typecheck | **Yes** | `npx tsc -p tsconfig.app.json --noEmit` → exit 2, **1,244 `error TS` lines** (TS6133 ×566, TS2769 ×391, TS2339 ×73, TS2322 ×39, TS2554 ×36 …). `npm run build:typecheck` therefore fails; `npm run build` (vite only) passes; CI runs neither. |
| Runtime-verified (partial) | **One targeted check** | Server-side render of MUI `Grid` with legacy vs v2 props (see D-01). Not a browser session. |
| Browser/runtime session | **NOT DONE** | No dev server/browser launched; no screenshots. `NEEDS VERIFICATION`. |
| E2E | **NOT DONE** | `web/e2e.ts`, `e2e-chat.ts`, `testSeed.ts` exist but were not run; README states no E2E is connected to CI. |
| Backend tests | **NOT RUN** | Need Mongo (`MONGO_URI`) — not run to avoid touching any DB. |

Commands executed (all from repo, none mutated tracked files; scratch output went to `C:\Users\aansi\.gemini\antigravity\brain\8e5912bc-13b6-48ce-8803-6a7ba5a47f1a\scratch\`):
`git remote -v`, `git branch --show-current`, `git rev-parse HEAD`, `git status --porcelain=v1 -b`, `git ls-remote` ×2, `git ls-files …`, `npx vitest run`, `npx vite build --outDir <scratch>`, `npx tsc -p tsconfig.app.json --noEmit`, plus a Node SSR script (scratch) for the Grid check. A first `tsc … --incremental false` attempt failed with TS6379 (invalid flag for composite project) and was re-run correctly. A bundle string-scan and a repo-wide doc search were cancelled (too slow) — not relied upon.

## 3. Confirmed defects (source-level unless stated)

Evidence key: **[S]** source-inspected · **[R]** runtime-checked (SSR script) · **[B]** build/tsc-observed.

### 3.1 Layout / visual root cause

**D-01 — MUI v7 `Grid` legacy props are ignored (affects every Home/listing grid)** [S][R][B] — *High*
- `web/package.json` → `@mui/material ^7.3.7`; installed `7.3.7`. In v7 `Grid` is the v2 grid: `item`, `xs`, `sm`, `md` were removed; `size={{…}}` is used.
- Offending usages (Home + listing): `FeaturedRestaurantsSection.tsx` L64, L78; `Restaurants_V.tsx` L247-257 (cuisine chips), L853-890 (skeletons), L935-953 (cards); `CuisinesSection.tsx` L87-89; `PromoSection.tsx` L73-75; `StatsSection.tsx` L82-84; `TestimonialsSection.tsx` L125-127; `TopDishesSection.tsx` L185-187; `QuickDeliverySection.tsx` L77-79; `HeroCompact.tsx` L69-71. Repo-wide: 377 `<Grid item` single-line matches; 29 files-lines use `size=`.
- Evidence [R]: SSR render of `<Grid container><Grid item xs={12} sm={6} md={4}>` emitted MUI warnings "The `item` prop has been removed…", "The `xs`/`sm`/`md` prop has been removed" and the child received **no width rules** (only `min-width:0; box-sizing:border-box`), whereas `<Grid size={{xs:12,sm:6,md:4}}>` produced `width:calc(100% * 12 / …)` + media queries at 600/900 px. Container is `display:flex; flex-wrap:wrap; gap`.
- Evidence [B]: tsc TS2769 "No overload matches this call" at exactly these lines (391 total).
- Impact: cards are content-sized flex items, not a 1/2/3-column grid → non-uniform card widths/heights, broken responsive columns. **Confirmed in browser runtime in S00** ([baseline/NOTES.md](baseline/NOTES.md)).
- Fix: migrate to `size={{ xs: 12, sm: 6, md: 4 }}` (no `item`) on the Home/listing surfaces first (S03); full-repo codemod is out of scope.

**D-16 — `RestaurantCard_V` geometry is not self-contained** [S][R] — *Medium*
- `RestaurantCard_V.tsx` L104: `className="relative w-full aspect-[16/9] overflow-hidden"` — **no Tailwind exists** (not in `web/package.json`, no tailwind/postcss config, no directive in `index.css`/`App.css`), so the class is inert (confirmed in browser runtime in S00); the wrapper `div` has no height and `SafeImage height:100%` resolves against `auto`. The outer MUI `Box` (L69-75) already sets `aspectRatio:'16/9'`, so the image is cropped/short rather than `cover`-filling.
- L106: `` `${image}?w=400&h=225&fit=crop&q=80` `` blindly appends a query string — wrong for URLs that already have `?`, for local `/assets/…` files and data URLs.
- L137: `{restaurant.rating && …toFixed(1)}` renders literal `0` for rating `0` (new restaurants default `rating: 0`, `restaurant.model.ts` L59).
- L55: whole card is `onClick` on a `Card` (not a link/`CardActionArea`) → no keyboard/semantic navigation, no middle-click.
- Variable-height content (cuisine chips L150-167, tags L199-212, `noWrap` name beside rating box) with no min-height → uneven cards even after D-01 is fixed.

**D-17 — `SafeImage` gaps** [S] — *Medium* (`web/src/shared/components/ui/SafeImage.tsx`)
- L18-23: `hasError` is never reset when `src` changes (a reused component instance keeps showing the fallback).
- Fallback is a single flat grey PNG (L5); no aspect-ratio wrapper, no `loading="lazy"`/`decoding="async"`, no skeleton while loading.
- Only `RestaurantCard_V` uses it. `TopDishesSection` (L78-91) uses `CardMedia` + `onError` swapping to an Unsplash URL; `CuisinesSection`, `QuickDeliverySection` (L93-107 `backgroundImage`), `HeroCompact` (L49, L289) and `TestimonialsSection` (pravatar) hot-link remote images with **no fallback at all**.
- Doc discrepancy: `FINAL_REPORT.md` §6 claims TopDishes was refactored to use `SafeImage`/`object-cover`; source shows it does not.

**D-15 — Listing page shell** [S][R] — *Medium; runtime clipping confirmed in S00*
- `Restaurants_V.tsx` L462-471: `Container height: calc(100vh - 140px)`, `overflow:hidden` on desktop; the results pane is the only scroll area (L835-849) while the `Pagination` block (L964-985) is a sibling after a `height:'94%'` box (L478-485) → clips the pager on short viewports (confirmed in browser runtime at 700px height in S00, [baseline/NOTES.md](baseline/NOTES.md)).
- L444-455: any `error` replaces the entire page with an `Alert` — no retry, no filters.
- L853-890: skeleton (200 px + text rows) ≠ real card geometry (layout shift).
- L228: `const FilterContent = () => …` is a component **defined inside render** → remounts on each render (accordion state/slider focus reset). Rendered at L583 and L1057.

### 3.2 Production-visible dev artefacts

> **Showcase Philosophy Note (Reconciled):** FoodHub is an engineering portfolio laboratory for recruiters and technical evaluators. Developer tooling, dynamic component version switching (`DevVersionRenderer`), mock/API toggles, and diagnostic logs are intentional engineering capabilities to be preserved and demonstrated, rather than hidden. D-02 refers to raw scratch placeholder text (such as `"add more components here..."`), while intentional showcase badges and `DevVersionSwitcher` are valid portfolio features. Similarly, D-22's component version swapping is safe client-side behavior demonstrating architecture flexibility, not a security vulnerability.

**D-02 — Dev badges render for every visitor** [S][B] — *High (credibility)*
- `HeroCompact.tsx` L77-94: unconditional Chip `"⚡ Development Mode - _V_ Renderer"` (L80).
- `Home_V.tsx` L129-138: unconditional Chip `"add more components here..."` + `Code` icon.
- `MainLayout.tsx` L586 renders `<DevVersionSwitcher />` unconditionally; it self-hides unless `user.role` includes `dev` or `bypassAuth` (`DevVersionSwitcher.tsx` ~L30-33) — so exposure depends on role issuance (see S-01/S-04).
- Build log shows dev-documentation chunks shipped in `dist` (`FRAMEWORK_EXECUTIVE_SUMMARY`, `DEV_RENDERER_GUIDE`, `HOME_FILE_STRUCTURE`, `HOME_PAGE_WIRING_GUIDE`, `TYPES_REFACTOR_REPORT`, `REDUX_LOGGER_*`, `delivery_vertical_spec`, …). Whether they are reachable by a visitor is `NEEDS VERIFICATION` (`/dev` is `IS_DEV`-gated, `DevRoutes.tsx` L16, and `staticwebapp.config.json` 404s `/dev/*`).

**D-22 — Persisted version override is honoured in production** [S] — *Low/Medium*
- `DevContext.tsx` L16/L24 reads `zom2_dev_versions` from `localStorage` with no `IS_DEV` guard; `DevVersionRenderer` uses `selectedVersions[pageKey] || defaultVersion`. A visitor can force `Home_V0/V1/V2`, `Restaurants_V0/V1/V2`, `RestaurantDetails*` (all bundled via `import.meta.glob`). Impact: unfinished variants reachable; not an auth bypass.

### 3.3 Truthfulness (fabricated data / fake actions)

| ID | Where | What is fabricated / fake | Evidence |
|---|---|---|---|
| D-03 | `Home_V.tsx` L106-112 | stats `'200' Dishes`, `'10k' Customers`, `'30' min Delivery` (only `Restaurants` is real) | [S] |
| D-03 | `StatsSection.tsx` L20-53 | "2500+ Restaurants", "50K+ Happy Users", "100K+ Orders Delivered Every month", "20-40 Min Delivery" | [S] |
| D-03 | `HeroCompact.tsx` L24-28 | defaults "100+ Restaurants", "50+ Offers", "30 min" | [S] |
| D-03 | `Home_V.tsx` L201-203; `TestimonialsSection.tsx` L120-122; `SearchPage.tsx` L128; `HowItWorksSection.tsx` L25-47 | "Join thousands of satisfied customers", "thousands of happy customers", "500+ restaurants", "Set Your Location… near you", "thousands of dishes", "20-40 minutes" | [S] |
| D-04 | `TestimonialsSection.tsx` L24-57 | 4 hard-coded reviews with invented names/roles/ratings and `i.pravatar.cc` avatars; mention "scheduled delivery" and "rewards program" that do not exist | [S] |
| D-05 | `PromoSection.tsx` L24-49, L147-150 | codes `FIRST50`, `MEGA40`, `FREEDELIVERY`; click copies and toasts "Code … copied **and applied**!" but nothing is applied. Cart only knows `SAVE10`/`FLAT50` (`cartSlice_V.ts` L137-148) and is mock, client-only logic | [S] |
| D-06 | `QuickDeliverySection.tsx` L25-53, L172-186 | "Pizza Express / Dessert Heaven / Fresh Juice Co" are not DB restaurants; invented 15/10/8 min and 30/25/20 % discounts + progress bar; "Order Now" → generic `/restaurants`; header claims "15 minutes or less". No quick-commerce/category data exists in `restaurant.model.ts` | [S] |
| D-07 | `TopDishesSection.tsx` L16, L33-45, L175-181, L190 | imports the **mock factory** `core/data/factories/foodItems` unconditionally (also in prod); `orders: 1200 + index*340` (fabricated, unused in UI); `badge` TRENDING/BESTSELLER assigned by array index; header "MOST ORDERED / what our customers love"; Add-to-cart button only shows a toast "…added to cart!" **without touching the cart**; dish ids/restaurantIds are not DB ids. API menu items have `isBestSeller:false, rating:0` always (`restaurantApi.ts` L135-138) and there is no popularity endpoint | [S] |
| D-08 | `CuisinesSection.tsx` L23-66, L88-139, L149 | restaurant counts (45, 38, 52…) invented; **cards have no `onClick`**; "View All Cuisines" → `/restaurants` unfiltered; Unsplash hot-links | [S] |
| D-19 | `MainLayout.tsx` L593, L600 | "Deliver to Home • 123 Street" hard-coded; button navigates to `/location`, **no such route** in `UserRoutes.tsx` → falls to `*` redirect (`routes/index.tsx` L38) | [S] |
| D-18 | `SearchPage.tsx` L24-26, L64-74; Home hero → `/search` (`Home_V.tsx` L91-96) | search page filters `MOCK_RESTAURANTS`/`MOCK_FOOD_ITEMS` from `core/constants/food.ts` (L102, L128), **not** Redux/API; search "history" and "trending" are hard-coded; results point to mock ids | [S] |

Copy/semantic mismatches: `FeaturedRestaurantsSection.tsx` L37-39 "Discover top-rated restaurants **near you**" — list is `isFeatured` flag only (`restaurantSlice_V.ts` L225), not rating- or distance-based.

### 3.4 Home → Restaurant Discovery flow (the "earlier finding", re-verified)

**D-09 — URL params produced by Home are never consumed** [S][R] — *High; confirmed in runtime in S00*
- Producers: `Home_V.tsx` L97-100 `/restaurants?cuisine=<name>` (**dead code in the default version** — `handleCuisineClick` is never passed to `CuisinesSection`), L102-104 `/restaurants?filter=featured` (used by "View All Restaurants", L123).
- Consumers: **none**. `useSearchParams|useLocation|URLSearchParams` is absent from `Restaurants_V.tsx`, `RestaurantsV1/V2/V0` (grep-verified); only `SearchPage.tsx` reads `?q=`. Confirmed in browser runtime in S00 ([baseline/NOTES.md](baseline/NOTES.md)): `/restaurants?cuisine=Indian` and `/restaurants?filter=featured` render the default 8 cards with no chips applied.

**D-10 — `filterByCuisine` reducer corrupts shared state** [S] — *Medium (latent in default version)*
- `restaurantSlice_V.ts` L137-146 replaces `state.restaurants` with `mockRestaurants` filtered; `mockRestaurants` is `[]` unless `import.meta.env.DEV` (L42-48, async import) → in production it would **empty** the list. It also bypasses `filters.cuisines`, so the listing UI never shows the cuisine chip. Called from `Home_V0.tsx` L69/L195 (live click handler) and `Home_V2.tsx` L75; imported but unused in `Home_V.tsx`/`Home_V1.tsx`. Reachable in prod only via D-22.

### 3.5 Listing filter / search / pagination correctness

| ID | Defect | Evidence |
|---|---|---|
| D-11 | `setSearchQuery` does **not** reset `pagination.currentPage` (other filter reducers do) → searching from page ≥2 shows "No restaurants found" while matches exist. `selectPaginatedRestaurants` does not clamp the page. | `restaurantSlice_V.ts` L148-150 vs L151-185; selectors L323-330 |
| D-12 | **Delivery-time filter can never match API data.** Filter uses strict `===` between `restaurant.deliveryTime` and `DELIVERY_TIMES` values (`'10-15 mins' … '40-50 mins'`, `core/constants/food.ts` L83-90); API normaliser emits `` `${m}-${m+10} min` `` (`restaurantApi.ts` L84-85) — different shape (`min` vs `mins`, different windows). | slice L288 |
| D-13 | **"Pure Veg" returns zero results on API data.** `isVeg` is not in the backend schema (`restaurant.model.ts`), normaliser omits it (`restaurantApi.ts` L110), filter requires truthy `restaurant.isVeg` (slice L291). Also `FoodItem.isVeg` is hard-coded `false` (`restaurantApi.ts` L135). | |
| D-14 | Search input state is not initialised from store/URL (`Restaurants_V.tsx` L89) → returning to the page shows an empty box while a filter chip is active; "Clear" paths reset inconsistently. Debounce timer lives in `useState` (L91-93). | |
| D-20 | `fetchRestaurantById.fulfilled` never sets `fetchByIdStatus='success'` (slice L237-243; it sets unused `loading`). `selectFavorites` (L352) reads `user.favoriteRestaurants` which is not on `AuthUser` (tsc TS2339). Parallel `favorites: string[]` slice state + `toggleFavorite` reducer duplicates the auth-slice favourites. | |
| D-21 | Both Home (`Home_V.tsx` L80-89) and listing (`Restaurants_V.tsx` L122-124) re-dispatch `fetchRestaurants` on every mount (no cache/TTL/dedupe) and the list pane flashes skeletons each time (`selectRestaurantLoading` L260). `restaurantApi.getAll` hard-codes `?limit=200` (L159) and ignores `pagination.total` → silent truncation beyond 200. | |
| — | Price filter is on `minOrder` while the sort labels say "Price: Low to High" (slice L282, L311-314; `Restaurants_V.tsx` L713-719). Misleading label. | |
| — | **No batch loading exists**: no `IntersectionObserver`/"Load more"/`fetchNextPage` anywhere outside commented code. Current model = fetch ≤200 once, client-side filter, client-side 10/page (`itemsPerPage:10`, slice L122). | grep-verified |
| — | **No tests** for the slice, selectors, pagination, listing, Home or cards. | `git ls-files` test list |

## 4. Security & authorisation findings (adjacent but gating)

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| **S-01** | **Privilege escalation at registration (mass assignment).** `validateRequest` runs `schema.parseAsync(req.body)` but discards the parsed result (`validate.middleware.ts` L7), so unknown fields survive; `register` calls `User.create(body)` with the raw body (`auth.controller.ts` L44). `roles` is a schema field with enum incl. `admin`, `owner`, `partner`, `dev` (`auth.model.ts` ~L47-50). A public `POST /api/auth/register` carrying `roles:["admin"]` would very likely create an admin. **Source-inferred, NOT runtime-tested** (would need a DB; deliberately not exercised). | | **Critical** |
| S-02 | `login` logs the full request body (incl. plaintext password) and the user document incl. password hash (`select('+password')`) | `auth.controller.ts` L65, L68 | High |
| S-03 | `protect` logs decoded JWT and user on every protected request | `auth.middleware.ts` L45, L47 | Medium |
| S-04 | `ProtectedRoute` lets any user whose `roles` include `dev` bypass all role checks (`protectedRoute.tsx` L41); `DevVersionSwitcher` appears for `role` containing `dev`; combined with S-01 a self-registered `dev` gets both. Client checks are not security by themselves, but this widens exposure. | | High (chain) |
| S-05 | `login` builds `new RegExp(`^${body.email}$`)` (`auth.controller.ts` L66): unescaped regex from user input; `.` in an email local-part matches any char | | Low/Medium |
| S-06 | `web/.env` is **tracked** (`git ls-files web/.env`) and contains `VITE_DEV_BYPASS_AUTH=true`, a Maps key and a Sentry DSN (values not reproduced here). Production is protected by `bypassAuth = IS_DEV && …` (`app.config.ts` L97) and `.env.production` sets `false`. Tracked env file is still hygiene debt. | | Medium |
| S-07 | `/api/dev/*` is mounted unconditionally (`app.ts` L63) and unauthenticated; the three handlers return 403 when `NODE_ENV==='production'` (`dev.controller.ts` L34, L52, L209). `render.yaml` sets `NODE_ENV=production`. Safe **only** if that env stays set. | | Medium |
| S-08 | `GET /api/restaurants` parses `limit`/`page` with `parseInt` and no cap/NaN guard (`restaurant.controller.ts` L16-18); `search` uses `$text` (word match, not prefix) | | Low |
| S-09 | CI (`.github/workflows/azure-static-web-apps.yml`) deploys on `main`/`dev/main`, **not** `dev/development`, and runs no tests/typecheck. `docs/deploymentRunbook.md` references `MONGODB_URI`/`CORS_ORIGIN`/`dev/main` whereas code uses `MONGO_URI` (`env.ts`) and `CLIENT_URL` + `corsOrigin.ts`. | | Process |

> Slice S01 must close S-01/S-02/S-03 (backend) **before** any visitor/demo entry point goes live.

## 5. Existing abstractions to preserve/reuse

| Abstraction | Path | Why keep |
|---|---|---|
| Redux slice, thunks, selectors | `web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts` (re-exported by `restaurantSlice/index.ts`) | Required: no new state system. Extend, don't replace. |
| `restaurantApi` + `normalizeRestaurant` | `web/src/services/api/restaurantApi.ts` | Single normalisation point (documented in file header). |
| `api` client w/ interceptors + mock adapter | `web/src/core/utils/api.ts` (L154-209); mock switch L161-166 → `core/dev/simulator/ApiSimulator.ts` | Mock/API switching already centralised. |
| `appConfig`/`IS_DEV`/`IS_PROD` | `web/src/core/config/app.config.ts` | Use for gating dev UI. |
| `SafeImage` | `web/src/shared/components/ui/SafeImage.tsx` | Extend (reset on src change, aspect/lazy), reuse everywhere. |
| `RestaurantCard_V` (default export of `RestaurantCard/index.tsx`) | `web/src/features/restaurant/components/RestaurantCard/` | Single card used by Home, listing, search. |
| `useFavorites` | `web/src/features/auth/hooks/useFavorites.ts` | Auth-aware ("Please log in…" toast), tested. |
| `showToast` / `uiSlice` | `web/src/features/ui/uiSlice` | Existing feedback channel. |
| Cart slice (`addToCart` payload `Omit<CartItem,'id'>`; single-restaurant rule L59-65) | `web/src/features/cart/cartSlice/V/cartSlice_V.ts` | Real add-to-cart path. |
| `reviewApi` (`GET /reviews/restaurant/:id` real) | `web/src/services/api/reviewApi.ts` | Only genuine review source. |
| `DevVersionRenderer` (`_V` pattern) | `web/src/core/dev/renderer/` | Project's lab pattern; keep default version names `Home_V`, `Restaurants_V`. |
| `useHideGlobalSearch` | `web/src/features/ui/hooks/` | Used by Home. |
| Seed assets | `web/public/assets/restaurants/restaurant1-10.jpg`, `web/public/assets/menuItems/restaurant1-10.jpg` | The only in-repo food imagery; whether real photos vs placeholders is `NEEDS VERIFICATION` (not opened). |

Worth keeping visually: `FeaturedRestaurantsSection` header/CTA/empty-state structure, `HowItWorksSection` (copy needs fixing), `HeroCompact` search form + motion variants (`features/home/utils/animations.ts`), card hover lift.
Candidates to remove/consolidate: `StatsSection` (fabricated), `TestimonialsSection` (fabricated), `PromoSection` (fake apply), `QuickDeliverySection` (invented), the `"add more components here"` chip, `HeroCompact` dev chip, inactive `Home_V0/V1/V2`, `Hero_V.tsx`/`Hero.tsx`, `HomeContainer.tsx` (unused composite, see below).

## 6. Data-source map

### Home (default `Home_V`, rendered through `DevVersionRenderer`, `pages/Home/index.tsx` L35-39)
| Section | Source | Real? |
|---|---|---|
| Hero (`HeroCompact`) | text + Unsplash bg + `stats` from `Home_V` | stats mostly fake (D-03) |
| Featured Restaurants | Redux `featuredRestaurants` = `restaurants.filter(isFeatured)` (slice L225) ← `GET /api/restaurants?limit=200` | **Real** (limited to ≤6, `FeaturedRestaurantsSection` L77) |
| Popular Dishes | `core/data/factories/foodItems` (mock, bundled) | **Fake** (D-07) |
| Stats | hard-coded | Fake |
| Promo | hard-coded | Fake |
| Quick Commerce | hard-coded | Fake |
| Cuisines | hard-coded + Unsplash | Fake counts, dead cards |
| How It Works | static copy | Static; claims unsupported |
| Testimonials | hard-coded + pravatar | Fake |
| Final CTA | static; navigates `/restaurants` | CTA real, copy overclaims |
`HomeContainer.tsx` is **not used** by the active Home (it imports `Hero`, `DownloadAppSection`); do not treat it as the Home composition.

### Restaurant listing (`Restaurants_V`)
`fetchRestaurants` → `restaurantApi.getAll()` → `api.request('/restaurants?limit=200')` → real API or `ApiSimulator` (matches `/api/restaurants$` on `pathname`, so the query string is fine, `ApiSimulator.ts` L51-52, L114; returns all docs, ignores `limit/page/cuisine/search`) → `normalizeRestaurant` → Redux `restaurants` → client selectors (filter → sort → paginate).

## 7. Backend contract (what truly exists)

`GET /api/restaurants` (`restaurant.controller.ts` L6-41; public, `restaurant.routes.ts` L7):
- Query: `city` (regex, case-insens.), `cuisine` (**single** value, `$in`), `search` (`$text` — index on `name,cuisine,city`, `restaurant.model.ts` L87), `page` (default 1), `limit` (default **10**, **no max**).
- Fixed sort `{rating:-1}`; `-menu` excluded from list.
- Response `data: { restaurants[], pagination:{ total, page, limit, pages } }`.
- **Not supported server-side:** `isFeatured`, `isOpen`, `minRating`, `deliveryTime`, price/`minOrder`, veg, sort selection, tags, multi-cuisine.
`GET /api/restaurants/:id` returns restaurant + embedded `menu[]` (`isAvailable`, `price`, `category`, `imageUrl`) — **no** `isBestSeller`, rating, popularity, order counts.
`GET /api/reviews/restaurant/:restaurantId?page&limit` — public, real; `rating`, `comment`, `createdAt`, populated `userId{name,avatar}`; reviews exist only for delivered orders (`review.controller.ts` L27-96). **No cross-restaurant "recent reviews" endpoint.**
`GET /api/reviews/eligibility/:id`, `POST /api/reviews` — authenticated.
No coupon/promo, popularity, quick-commerce/category, or geolocation endpoint was found in `API/src/modules/*`.

## 8. Mock vs API behaviour

- `VITE_DATA_SOURCE`: default `mock` in dev, `api` in production (`app.config.ts` L28, L62); dev can override via `localStorage.DEV_DATA_SOURCE` (dev only). `web/.env` currently sets `api`; `.env.production` and CI set `api`.
- Mock mode intercepts **all** `api.request` calls (`api.ts` L161-166) → `ApiSimulator` (factory data via `buildFactorySeedPayload`, randomised `isFeatured`/`isVeg` each refresh: `unifiedFactory.ts` L118-119). Mock list ignores pagination params and returns `deliveryTime` strings in the *mock* shape (`'20-30 min'` …) while API returns minutes-derived strings → D-12 manifests differently in mock vs API.
- Several components bypass the switch and use mock data directly in all modes: `TopDishesSection` (factory), `SearchPage` (`MOCK_*` constants), `filterByCuisine` (factory via dev-only dynamic import).
- README step 2 says `VITE_DATA_SOURCE=mock` renders "entirely from factory data" — true only for code paths that go through `api.request`; the three bypasses above contradict it.

## 9. Route / auth / role constraints

- Route set is chosen by **`user.role[0]`** only (`routes/index.tsx` L24-37): a multi-role account sees just the first role's tree. `/` redirects stack for admin/owner/partner/dev (L19-22). Unauthenticated users get `UserRoutes` (L33-36).
- Public (no guard): `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/restaurants`, `/restaurants/:id`, `/favorites`, `/notification`, `/search`, `/settings`, `/orders/confirmation`, `/orders/tracking/:id` (`UserRoutes.tsx` L36-54). Guarded by `UserProtected`: `/profile`, `/cart`, `/checkout`, `/orders`. `/help` → ComingSoon; `/location` missing.
- Guards read `roles` (plural) in `ProtectedRoute` but the router reads `role` (singular array): `core/types/auth.ts` L49-50 declares both. Keep them consistent in any new gate.
- Owner (`/owner/*`): real pages only `index`, `settings`, `queue`, `active`; menu/analytics/promotions/reviews/staff/finance/support/profile are `ComingSoon` (`OwnerRoutes.tsx`). Admin has real orders/restaurants/users/ai/delivery pages; payments etc. are ComingSoon. Partner has dashboard/orders/active/profile/history/earnings/support/settings.
- `DevRoutes` = `IS_DEV ? … : null`; but `routes/index.tsx` L22 still redirects a `dev` user from `/` to `/dev`, which in production resolves to `*` → `/` (possible redirect loop for a `dev`-role user, `NEEDS VERIFICATION`).
- Dev bypass: `appConfig.dev.bypassAuth = IS_DEV && VITE_DEV_BYPASS_AUTH` → cannot be true in a production build. Backend bypass only when `NODE_ENV==='development'` (`auth.middleware.ts` L24-27).
- No demo/guest/visitor concept exists in code (`grep demo|guest|visitor|showcase` → only labels). No demo accounts are documented; seeded users are dev-only (`dev@`/`devdev` fixed user, hashed only when `__isFixed && password==='devdev'`, `dev.controller.ts` ~L100-110). Docs record seeded non-fixed users with plaintext passwords as a deferred bug.

## 10. Review/testimonial provenance
Home testimonials = hard-coded fiction (D-04). Real reviews exist only on `RestaurantDetail_V` via `reviewApi.listRestaurantReviews` (`RestaurantDetail_V.tsx` L86-100) and require delivered orders. `useRestaurantDetails.tsx` L29-42 and `data/dummyData` are dev-only legacy and unrelated to `RestaurantDetail_V`.

## 11. Cart / dish-action constraints
- Real add: `dispatch(addToCart({ foodItemId, restaurantId, restaurantName, name, price, quantity, … }))` as in `RestaurantDetail_V`/`RestaurantDetailsV0.tsx` L133-170. Different-restaurant add **silently clears** the cart (`cartSlice_V.ts` L59-65) — no confirmation UX.
- `/cart` and `/checkout` require a `user` role session (`UserRoutes.tsx` L51-52); browsing/adding is possible as a visitor, checkout redirects to `/login` with `state.from`.
- Dish ids from the factory cannot be ordered against the real backend. Any Home dish CTA must either deep-link to `/restaurants/:id` (real) or add a real menu item fetched from `GET /restaurants/:id`.
- Coupons: client-only mock (`SAVE10`, `FLAT50`); whether the backend honours/recomputes discount is `UNKNOWN` (order controller not audited in depth).

## 12. Visual baseline (source-level; screenshots `NEEDS VERIFICATION`)

Current default Home order (inside `Container maxWidth="lg"`, `Home_V.tsx` L114-227):
1. `HeroCompact` — solid `primary.main` band (py 3-5), Unsplash bg at 8 % opacity (`HeroCompact.tsx` L33-66), dev chip, H1 "Craving something delicious?", search field, stats row, hero image (Unsplash, L289). Compact; low-impact; no real food imagery from the project.
2. Featured Restaurants (≤6 cards, framer entrance + hover lift). *Preserve.*
3. Popular Dishes — 110 px-high horizontal cards, 9 items, tiny type (0.55-0.9 rem). *Replace/remove (D-07).*
4. Dev placeholder chip + "Explore" divider. *Remove.*
5. Stats → Promo → Quick Commerce (cream band) → Browse by Cuisine **(two headings: `Home_V.tsx` L167-172 and inside `CuisinesSection` L79-84)** → How It Works → Testimonials → purple-gradient Final CTA (#667eea→#764ba2, off-brand vs coral primary used elsewhere).
Observations: ~9 sections, every section re-declares its own `py` (8-10) and overline/H3 header pattern → long, repetitive scroll; mixed wrappers (`Container` nested in `Container` in `TopDishesSection` L172 inside `Home_V` L121 container, `StatsSection` L81, `PromoSection` L57); animation wrappers (`Fade`, `Zoom`, `Grow`) fire on mount, not on scroll, so they animate off-screen content; the `Grid` bug (D-01) likely collapses most multi-column sections. Intended direction in [01](01-vertical-slice-plan.md) §3.

Distinguish: *design problems* = repetition, off-brand gradient, tiny dish type, weak hero imagery, heavy copy; *state/data problems* = fake stats/dishes/testimonials/offers, dead cuisine cards, missing real imagery fallbacks; *code problems* = D-01.

## 13. Unknowns, blockers, assumptions

| ID | Item | Status |
|---|---|---|
| U-01 | Is a hosted instance live? README says "not yet live / no URL published" (L542-546); brief calls it "hosted". Which branch deploys (`main`/`dev/main`, not `dev/development`)? | `UNKNOWN` |
| U-02 | Production DB contents (restaurant count, `isFeatured`, image URLs, reviews, any seeded role accounts) | `UNKNOWN` |
| U-03 | Browser rendering of D-01/D-15/D-16 and card heights | **CONFIRMED in runtime** (S00, see [baseline/NOTES.md](baseline/NOTES.md)) |
| U-04 | S-01 exploitability on a live DB | `NEEDS VERIFICATION` on a **test** DB only |
| U-05 | Backend discount/coupon handling at order creation | `UNKNOWN` |
| U-06 | Whether `/dev` redirect for a `dev`-role user loops in production | `NEEDS VERIFICATION` |
| U-07 | Whether `public/assets/**` images are usable real photography | `NEEDS VERIFICATION` |
| U-08 | Production bundle contains mock factories/faker/dev docs (chunk names seen in build log; string scan cancelled) | partially observed |
| B-01 | Popularity/best-seller/order-count data | **BLOCKED** (no endpoint/field) → honest fallback in S05 |
| B-02 | Cross-restaurant recent reviews | **BLOCKED** (no endpoint) → honest fallback in S05 |
| B-03 | Server-side filtering other than `cuisine/search/city/page/limit` | **BLOCKED** → client-side incremental rendering in S06 |
| B-04 | Role demo accounts in production | **BLOCKED on a product/security decision** (see [04](04-open-questions.md)) |
Assumptions: repo rename (see §1); the audited SHA is the deployed candidate; `web/.env` values are dev-local.
