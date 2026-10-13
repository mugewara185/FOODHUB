# SLICE-00 — Baseline capture & safety net

Self-contained. Context: repo `FoodHub` (GitHub `mugewara185/Zom2`, same repo as `FOODHUB`), branch `dev/development`, audit baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend in `web/` (React 19, Vite, MUI 7.3.7, Redux Toolkit), backend in `API/` (Express/Mongo). Evidence for every claim: [../00-audit.md](../00-audit.md).

| Field | Value |
|---|---|
| Complexity | **S** |
| Backend dependency | None |
| Verification target | unit (characterization), build, runtime (screenshots) |
| Depends on | nothing |
| Unblocks | S01, S03 (and everything via the test net) |

## Goal / user-visible outcome
No user-facing change. Produces (a) pinned evidence of the *current* Home/listing look and behaviour, (b) characterization tests for the restaurant slice so later slices change behaviour deliberately, (c) confirmation (or refutation) of audit findings D-01, D-15, D-16 in a real browser.

## Why it matters
The audit was source- and SSR-level only; no browser run happened. Slices S03/S04 assume D-01 (Grid) is the card-uniformity root cause — S00 proves it. The restaurant slice has **zero tests** today.

## In scope
1. Record `git rev-parse HEAD`, `git status`; if HEAD ≠ baseline SHA, list `git diff --stat f9bc008..HEAD -- web API` in `docs/portf/baseline/NOTES.md`.
2. Run and record: `cd web; npx vitest run` (expected baseline: 6 files failed / 9 passed; 5 tests failed / 33 passed), `npx vite build --outDir <tmp> --emptyOutDir` (expected exit 0), `npx tsc -p tsconfig.app.json --noEmit` (expected exit 2, ~1,244 errors). Save counts.
3. Capture screenshots **only if** the app runs safely: `cd web; npm run dev` with `.env` (`VITE_DATA_SOURCE=api` needs backend; use `localStorage.DEV_DATA_SOURCE='mock'` or `VITE_DATA_SOURCE=mock` via CLI env — do not edit `.env`). Pages: `/` and `/restaurants` at 360, 768, 1280 px. Store in `docs/portf/baseline/` (PNG). Browser tooling missing → write `NEEDS VERIFICATION` in NOTES.md.
4. In the browser, confirm: (i) grid columns on `/restaurants` and Home featured; (ii) devtools shows MUI "prop has been removed" warnings; (iii) dev chips visible on Home; (iv) listing pager clipping on a 700 px-tall window; (v) `?cuisine=Indian` and `?filter=featured` have no effect.
5. Add **characterization tests** (new files only, no source edits): `web/src/features/restaurant/restaurantSlice/__tests__/restaurantSlice.test.ts` covering current behaviour of: `toggleCuisine` resets page; `setSearchQuery` does **not** reset page (mark with `it.fails` or a `// KNOWN-DEFECT D-11` comment so S04 flips it); `selectFilteredRestaurants` for search/cuisine/rating; `deliveryTime` strict equality (`D-12`); `isVeg` truthiness (`D-13`); `selectPaginatedRestaurants`/`selectTotalPages` for 25 items @10/page; `filterByCuisine('all')` with empty mock array (D-10).
6. Add `web/src/services/api/restaurantApi.test.ts`: `normalizeRestaurant` (deliveryTime `30` → `"30-40 min"`, missing `deliveryFee` → 0, `imageUrl`/`image` fallback, `isVeg` undefined).

## Out of scope
Any source/config change; fixing failing baseline tests; screenshots through code edits.

## Files to inspect / touch
Inspect: `web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts`, `web/src/services/api/restaurantApi.ts`, `web/src/core/types/index.ts` (L70-90 `Restaurant`), `web/src/test/setup.ts`, `web/vite.config.ts` (jsdom, `@mui/icons-material` mocked only when `NODE_ENV==='test'`).
Create: `docs/portf/baseline/NOTES.md`, `docs/portf/baseline/*.png`, the two test files above.

## Data/API contracts to verify first
`GET /api/restaurants` envelope `{ success, data:{ restaurants, pagination } }` (`API/src/modules/restaurants/restaurant.controller.ts` L6-41). `restaurantApi.getAll` uses `?limit=200` (L159).

## Route/URL/state contracts
None changed. Current (defective) contract is *documented* by the tests.

## Existing components/abstractions to reuse
Redux Toolkit store factory pattern used in `features/auth/authSlice.test.ts` and `features/orders/__tests__/orderSliceState.test.ts` (copy their store-setup style). `vitest` + `@testing-library/react` already installed.

## Tests to add/update
As in scope item 5/6. Mock `restaurantApi` with `vi.mock` for thunk tests (`fetchRestaurants` fulfilled sets `featuredRestaurants = isFeatured`).

## Acceptance criteria
- [ ] `docs/portf/baseline/NOTES.md` lists SHA, git status, the three command results with exit codes and counts.
- [ ] New tests pass (`npx vitest run web/src/features/restaurant web/src/services/api/restaurantApi.test.ts` → all green), and the overall failing set is unchanged (same 6 files / 5 tests).
- [ ] D-01, D-15, D-16, D-09 each marked CONFIRMED / REFUTED with a screenshot or note; if D-01 is refuted, update `00-audit.md` before starting S03.
- [ ] `git diff --name-only` shows only `docs/portf/**` and the new test files.

## Manual verification
`npm run dev` → open `/` and `/restaurants`; resize; take screenshots; check console warnings; try URLs with params.

## Rollback / risk
Delete the added files. Risk: running dev server in `api` mode without a backend shows error states — use mock mode and say so in NOTES.md.

## Security / authorization notes
Do not run the app with `VITE_DEV_BYPASS_AUTH=true` for screenshots of public pages (not needed). Do not call `/api/dev/*`. Do not test S-01 here (that is S01 on a test DB).
