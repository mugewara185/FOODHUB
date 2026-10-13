# SLICE-04 — Listing contract: URL ↔ Redux ↔ filters/search/pagination

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`. Evidence: [../00-audit.md](../00-audit.md) D-09…D-14, D-18, D-20, D-21.

| Field | Value |
|---|---|
| Complexity | **L** |
| Backend dependency | **No** (all filtering stays client-side over the fetched list; see S06 for server paging) |
| Verification target | unit, component, integration (router+store), runtime |
| Depends on | S03 (card/grid foundation), S00 (characterization tests to flip) |
| Unblocks | S05 (Home CTAs need real URLs), S06 |

## Goal / user-visible outcome
Clicking "View All Restaurants", a cuisine, or the Home search lands on `/restaurants` **already filtered**, the URL reflects every filter/search/sort/page, reload/back/share restores the same view, and search/filters/pagination behave correctly with real API data.

## Why it matters
Today Home produces `?cuisine=` / `?filter=featured` URLs that nothing reads (D-09); `setSearchQuery` doesn't reset the page (D-11); the delivery-time filter can never match API data (D-12); "Pure Veg" always yields zero (D-13); `/search` shows mock restaurants that don't exist (D-18); `filterByCuisine` can empty the store (D-10).

## The contract (implement exactly this)
URL = shareable source of truth; Redux `restaurants.filters` + `pagination` = working copy hydrated from the URL.

| Param | Meaning | Values / validation | Redux field |
|---|---|---|---|
| `q` | text search (name, cuisine, tags; case-insensitive, trimmed) | ≤80 chars | `filters.searchQuery` |
| `cuisine` | comma-separated cuisine names (case-insensitive match to restaurant cuisines) | any strings | `filters.cuisines` |
| `rating` | minimum rating | integer 1-5 | `filters.minRating` |
| `time` | delivery within N minutes, judged by the **upper bound** of the restaurant's window (`"30-40 min"` → 40) | `30|40|50|60` | `filters.deliveryTime` (`'all'` or the number as string) |
| `open` | open now | `1` | `filters.isOpen` |
| `featured` | featured only (`isFeatured`) | `1` | **new** `filters.featuredOnly` |
| `sort` | sort | `rating|deliveryTime|price|price_desc|name` (whitelist; default `rating` is omitted from URL) | `filters.sortBy` |
| `page` | 1-based page (client-side, until S06 replaces it) | positive int, clamped to `[1,totalPages]` | `pagination.currentPage` |
Defaults are never written to the URL. Unknown/invalid params are ignored (no throw). Legacy `?filter=featured` is accepted and mapped to `featured=1` (backwards compatibility with old links).
Updating rules: typing in search → `replace` (debounced 400 ms); discrete changes (cuisine/rating/time/open/sort/featured/clear) → `push`; page changes → `push`; any filter change resets `page` to 1 (including search — fixes D-11).
Price range (`minPrice/maxPrice` on `minOrder`) stays Redux-only, **not** in the URL (low value), but labelled "Minimum order" consistently (sort labels renamed "Min. order: Low to High/High to Low", `Restaurants_V.tsx` L713-719).
**Pure Veg**: remove from UI unless data supports it — show the control/chip only when `selectHasVegData` (any loaded restaurant has `typeof isVeg === 'boolean'`); API data never has it today (`restaurantApi.ts` L110) so it disappears (honest de-scope, D-13).

## In scope
1. **Slice changes** in `web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts`:
   - add `filters.featuredOnly: boolean` (+ `clearFilters`, active-count selector L337-350, filter selector L264-299);
   - new reducer `hydrateFilters(state, action: PayloadAction<{filters: Partial<RestaurantFilters>; page?: number}>)`;
   - `setSearchQuery` also sets `pagination.currentPage = 1` (D-11);
   - `selectPaginatedRestaurants` clamps the page to `[1, totalPages]`; `selectTotalPages` returns ≥1;
   - delivery filter: replace strict equality (L288) with `maxMinutes(restaurant.deliveryTime) <= Number(filters.deliveryTime)` where `maxMinutes` = the last integer in the string (API `"30-40 min"` → 40, mock `"20-30 min"` → 30; unparsable → excluded); remove `DELIVERY_TIMES` string options from `Restaurants_V.tsx` (L391-398) → radio options "Within 30/40/50/60 min" (D-12);
   - veg filter (L291) applies only when `isVeg` is a boolean; add `selectHasVegData`;
   - search matches name, cuisine, **tags** (the box placeholder must say exactly that);
   - `filterByCuisine` (L137-146): delete the mock import block (L42-48) and rewrite as `state.filters.cuisines = action.payload==='all' ? [] : [action.payload]; state.pagination.currentPage = 1;` — signature preserved, so inactive `Home_V0/V2` still compile (D-10);
   - `fetchRestaurantById.fulfilled` sets `fetchByIdStatus='success'` (D-20);
   - **fetch dedupe**: `lastFetchedAt: number|null` in state; `fetchRestaurants` gets a `condition` (skip when `fetchStatus==='loading'` or fetched < 60 s ago unless `force`); new selector `selectIsInitialLoading = status==='loading' && restaurants.length===0` — listing/Home use it so skeletons don't flash on re-entry (D-21).
2. **Hook** `web/src/features/restaurant/hooks/useRestaurantUrlState.ts` (react-router `useSearchParams`): `parse(searchParams)` / `serialize(filters,page)` pure functions exported for tests; effect 1 (URL→Redux) runs when the serialized URL differs from the serialized store; effect 2 (Redux→URL) runs when the store differs; guard with a ref to avoid ping-pong.
3. **Listing page** `Restaurants_V.tsx`: use the hook; initialise `localSearch` from `filters.searchQuery` and resync when the store value changes (D-14); remove `filterByCuisine`/`mock` dependence; show a `Featured` chip; clamp pagination; keep layout from S03.
4. **Home CTAs** (minimal, truthful; broader Home rewrite is S05): `Home_V.tsx` L102-104 → `navigate('/restaurants?featured=1')`; hero search (`handleSearch` L91-96) → `navigate('/restaurants?q=…')`; delete dead `handleCuisineClick` (L97-100) and `filterByCuisine` import.
5. **`/search`**: `UserRoutes.tsx` L45 → `<Route path="search" element={<SearchRedirect/>} />` where `SearchRedirect` = `<Navigate to={{pathname:'/restaurants', search: location.search /* ?q= kept */}} replace />`; `MainLayout.tsx` L639 `navigate('/search')` → `/restaurants`. Delete (or leave unrouted) `SearchPage.tsx`'s mock tabs; **no dish search** (no API) — recorded in [../04-open-questions.md](../04-open-questions.md) Q4.
6. **Active-filter chips** and "Clear" use the same actions; chips include `Featured`, `Within N min`.

## Out of scope
Batch/infinite loading and server-side params (S06); Home section content (S05); visual polish; backend changes (no new query params, no `$text` reliance on the client).

## Files to inspect/touch
`web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts`, new `web/src/features/restaurant/hooks/useRestaurantUrlState.ts`, `web/src/pages/restaurantListings/V/Restaurants_V.tsx`, `web/src/pages/Home/versions/Home_V.tsx`, `web/src/app/routes/domain/UserRoutes.tsx`, `web/src/shared/layout/MainLayout.tsx`, `web/src/pages/Home/SearchPage.tsx` (retire), `web/src/core/constants/food.ts` (`DELIVERY_TIMES` L83-90 — leave constant for inactive versions or delete after grep), `web/src/pages/Home/versions/Home_V0.tsx`/`Home_V2.tsx` (compile check only), `web/src/features/restaurant/restaurantSlice/index.ts`.

## Data/API contracts to verify first
- Real API `deliveryTime` normalisation `"${m}-${m+10} min"` (`restaurantApi.ts` L84-85); mock shape `"20-30 min"` (`unifiedFactory.ts` L73). Both end with the upper bound → "last integer" parsing works. Verify with the S00 `restaurantApi` test.
- `cuisine` casing in seed data (e.g. `Indian`); match case-insensitively.
- `isFeatured` present in API list (`restaurantApi.ts` L106).
- Server accepts `cuisine/search` but this slice does **not** use them.

## Route/URL/state contracts
As in the table above. Public route `/restaurants` unchanged; `/search` becomes a redirect; `?filter=featured` legacy accepted. Browser back returns to the previous filter state.

## Existing abstractions to reuse
Existing reducers (`toggleCuisine`, `setMinRating`, `setDeliveryTime`, `setOpenNowFilter`, `setSortBy`, `clearFilters`, `setCurrentPage`) — compose, don't replace; `selectFilteredRestaurants/Sorted/Paginated` chain; `react-router-dom` v7 `useSearchParams`; `zod` (already a web dependency) optionally for param parsing; `showToast` not needed.

## Tests to add/update
- Flip S00 characterization tests: D-11 (page resets on search), D-12 (`"30-40 min"` matches `time=40` and not `time=30`; `"20-30 min"` matches `time=30`), D-13 (veg control hidden when no data; filter ignored), D-10 (`filterByCuisine('Indian')` sets `filters.cuisines`, leaves `restaurants` intact).
- `useRestaurantUrlState.test.ts`: `parse(serialize(x))` round-trips; invalid `rating=9`, `sort=foo`, `page=-3` ignored; `?filter=featured` → featured; default omitted.
- `Restaurants_V.test.tsx` (MemoryRouter `initialEntries={['/restaurants?cuisine=Indian&sort=name&page=2']}` with a preloaded store of 25 restaurants): shows chips `Indian`, correct sort, page 2 (or clamped), updating search changes URL (`replace`) and resets page; browser-back test via `history`.
- `Home_V` CTA test: "View All Restaurants" navigates to `/restaurants?featured=1`; hero search navigates with `q`.
- Selector tests: clamp, `selectHasVegData`, fetch `condition` skips within 60 s.

## Acceptance criteria
- [ ] Home → "View All Restaurants" shows only featured restaurants; the chip "Featured" is visible and removable; the URL contains `featured=1`.
- [ ] Opening `/restaurants?cuisine=Indian&rating=4&sort=name` in a fresh tab applies all three; refresh and back/forward preserve them.
- [ ] Searching from page 3 returns to page 1 and shows matches (D-11 closed).
- [ ] Delivery-time filter returns restaurants on **API** data (not zero) (D-12 closed).
- [ ] "Pure Veg" control absent with API data; no zero-result trap (D-13).
- [ ] Hero search term appears in listing search box and URL; `/search?q=x` redirects to `/restaurants?q=x`.
- [ ] Navigating Home ↔ listing does not re-show full skeletons when data are fresh (< 60 s); a forced refresh path still exists.
- [ ] No console errors; `npx tsc` count ≤ baseline; unit/component tests green; build exit 0.

## Manual verification
Mock and API modes: apply each filter, copy URL to a new tab, use back/forward, type quickly in search (no history spam: `replace`), clear all, hit invalid params (`?rating=abc&page=999`) — page clamps, no crash.

## Rollback / risk
Risk: URL↔Redux sync loops — keep the guarded two-effect design and test it. Risk: other callers of `selectRestaurantLoading` — keep it, add the new selector. Risk: inactive `RestaurantsV1/V2/V0` still use old selectors; they must compile (`npx tsc` diff) but need not be updated. Revert: slice + hook + page are separable commits.

## Security / authorization notes
URL params are untrusted: never render them with `dangerouslySetInnerHTML`; cap lengths; never send raw URL params to the API in this slice. No auth changes.
