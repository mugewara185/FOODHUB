# SLICE-06 — Batch loading & listing polish

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`. Evidence: [../00-audit.md](../00-audit.md) D-15, D-19, S-08, §7 (backend contract).

| Field | Value |
|---|---|
| Complexity | **M** |
| Backend dependency | **Optional.** Default path is frontend-only. Server-side paging is a separate, separately approved backend slice (see "Out of scope") |
| Verification target | unit, component, runtime |
| Depends on | S04 (URL↔Redux↔filters contract), transitively S03 (layout) |
| Unblocks | S08 |

## Goal / user-visible outcome
The listing loads restaurants in **batches** ("Show more") instead of numbered pages, never silently truncates the catalogue, and handles loading/empty/error states without layout breakage (no clipped pager, no inner scroll trap, filters stay visible on error).

## Why it matters
Today the list is fetched once with `limit=200` (`web/src/services/api/restaurantApi.ts` L159) and paged client-side at 10 per page. If the DB has more than 200 restaurants the rest are silently invisible. The pager is clipped by container sizing (`Restaurants_V.tsx` L462-471, D-15), an API error replaces the whole page including the filters (L444-455), and there is no "loaded X of Y" truthfulness.

> **Do not conflate** client-side incremental rendering (a UI slice of an already-fetched array) with server pagination (`page`/`limit` on `GET /api/restaurants`). This slice's default is the former, plus a loop that makes the fetch complete. Wording in the UI must say "Showing X of Y", never "page loaded from server" unless server paging is actually used.

## Confirmed backend contract (from the audit, source-inspected, not runtime-verified)
- `GET /api/restaurants` supports only `city` (regex), `cuisine` (single), `search` (`$text` on name/cuisine/city), `page`, `limit` (default 10, **no cap** — S-08). Sorted by rating desc. Returns `{ restaurants, pagination: { total, page, limit, pages } }`.
- **No** server-side featured/open/rating/time/price filter. Therefore in server-paging mode only `cuisine` and `q` could be server-side; every other filter would be wrong across pages. This is why server paging is not the default.

## In scope
1. **Complete fetch** — `restaurantApi.getAll()` (L158-161): request `limit=100`, read `pagination.pages`, fetch remaining pages sequentially or in parallel with a **hard cap** (e.g. ≤ 10 pages = 1000 restaurants), concatenate. Store `serverTotal` (= `pagination.total`) and `isTruncated` (= fetched < total) in `restaurantSlice_V.ts`. If `isTruncated`, the listing shows a truthful note ("Showing the first N of M restaurants"). Keep the `normalizeRestaurant` path unchanged. Mock-mode simulator ignores page/limit (audit §4) — loop must terminate when `pages` is undefined/1.
2. **Incremental rendering** — replace numbered `Pagination` (L964-985) with a `Show more` button:
   - State: `pagination.visibleCount` (initial `BATCH_SIZE = 12`; increment by `BATCH_SIZE`). `selectVisibleRestaurants = sorted.slice(0, visibleCount)`.
   - Any filter/search/sort change resets `visibleCount` to `BATCH_SIZE` (same rule as old page reset).
   - **URL**: drop the `page` param from the S04 contract (parse tolerates and ignores legacy `page=`). Batch depth is *not* in the URL. Update the S04 contract table accordingly in the change notes.
   - Label: `Showing {visible} of {filteredTotal}` inside an element with `aria-live="polite"`; button disabled/hidden when `visible >= filteredTotal`.
   - Keyboard focus: after "Show more" focus moves to the first newly appended card (or stays on the button, but the new cards must be reachable next in tab order). Scroll position is **not** changed programmatically.
3. **Layout/polish** (fixes D-15): remove fixed/`overflow` height constraints at L462-471 so the pager/button is never clipped; no nested scroll container; footer visible at 320-1440.
4. **States**:
   - Initial load: skeleton cards using the S03 card geometry (replace L853-890 variant if it differs).
   - Error: inline `Alert` with **Retry** (`fetchRestaurants({force:true})`) **above** the results area; filters remain usable and results already in store remain visible (replaces L444-455 behaviour).
   - Empty: when filters yield zero results show "No restaurants match" + active-filter chips + `Clear filters` button; distinguish from "catalogue is empty" (store length 0 after success → "No restaurants yet").
5. **Server-side `limit` cap** note: do **not** change backend here; record S-08 in the PR notes (cap belongs to S01's backend change or a follow-up).

## Out of scope
Backend changes (limit cap, new filter params, server-side sort). Infinite scroll with `IntersectionObserver` (explicit button is more accessible and testable). Server-driven paging — if later required, create a new slice that: (a) caps `limit` (≤100) on the API; (b) adds the missing filter params to the backend with tests; (c) moves every filter to the server; (d) re-adds `page` to the URL contract. Do not mix client filters with server paging.

## Files to inspect/touch
`web/src/services/api/restaurantApi.ts`, `web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts` (state, selectors L254-352), `web/src/pages/restaurantListings/V/Restaurants_V.tsx`, `web/src/features/restaurant/hooks/useRestaurantUrlState.ts` (from S04: remove `page`), `web/src/shared/components/ui` (reuse skeleton helpers if any).

## Data/API contracts to verify first
- Real `pagination` shape on a live/seeded API (NEEDS VERIFICATION U-09: not runtime-verified; verify with a seeded API run or Supertest).
- Behaviour of `/restaurants?limit=100&page=2` when only one page exists (empty array vs 404).
- Mock-mode simulator response shape for `/restaurants?limit=100` (ignores params → single response).

## Route/URL/state contracts
`/restaurants?...` as in S04 minus `page`. State: `serverTotal: number | null`, `isTruncated: boolean`, `pagination.visibleCount: number`. `setCurrentPage` stays exported for inactive variants but is unused by the active listing.

## Existing abstractions to reuse
S04 `useRestaurantUrlState`, `selectFilteredRestaurants/Sorted` chain, `fetchRestaurants({force})`, S03 card/grid, MUI `Alert`/`Skeleton`/`Button`.

## Tests to add/update
- `restaurantApi.getAll` (mock axios): `pages=3` → 3 requests, merged list, `serverTotal` set; `pages` undefined → 1 request; cap respected when `pages=50`; partial failure on page 2 → rejects or returns partial with `isTruncated=true` (**pick one and document**; recommended: reject so the UI error+Retry appears).
- Slice tests: `visibleCount` starts 12; `showMore` +12; filter/search/sort change resets; selector never exceeds filtered length.
- `Restaurants_V.test.tsx` (store with 30 restaurants): 12 cards → click Show more → 24 → 30, button disappears, `Showing 30 of 30`; filter change returns to 12; error state keeps filter panel; empty-filter state shows Clear.
- Update S04 URL tests: `page=` ignored.

## Acceptance criteria
- [ ] 250 mock/seeded restaurants are all reachable (no silent 200 cut-off); when capped, the UI says so.
- [ ] "Show more" works by mouse and keyboard; count text is announced (`aria-live`).
- [ ] Pager/button never clipped at 320, 768, 1440 px (screenshots vs S00 baseline).
- [ ] API failure: filters remain, Retry works, no blank page.
- [ ] URL has no `page`; legacy `?page=3` does not throw.
- [ ] tsc error count ≤ baseline; unit tests green; build exit 0.

## Manual verification
Seed ≥ 30 restaurants (or run mock mode); scroll, Show more to the end; apply/clear filters; throttle/stop API and reload; view at 320 px.

## Rollback / risk
Revert `Restaurants_V.tsx` and slice changes; `getAll` loop is backwards-compatible. Risk: N sequential requests on a Render cold start — limit to the page cap and fetch pages 2..N in parallel after page 1. Risk: sorted/filter result jumping when `visibleCount` changes — selectors are pure over the same array so order is stable.

## Security / authorization notes
Public read-only endpoint; the page cap avoids a client-induced amplification loop. If server paging is later added, cap `limit` server-side (S-08) and never trust the client-supplied `limit`.
