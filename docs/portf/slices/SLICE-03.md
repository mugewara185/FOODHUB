# SLICE-03 — Layout foundation: Grid v7, uniform restaurant card, SafeImage

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`, MUI **7.3.7**. Evidence: [../00-audit.md](../00-audit.md) D-01, D-15, D-16, D-17.

| Field | Value |
|---|---|
| Complexity | **M** |
| Backend dependency | None |
| Verification target | unit, component, build, runtime |
| Depends on | S00 (D-01 confirmed in a browser) |
| Unblocks | S04, S05, S06, S07 (they all reuse the card and grid) |

## Goal / user-visible outcome
On Home (Featured Restaurants) and `/restaurants`, restaurant cards form a true responsive grid — 1 column (<600 px), 2 (600-899), 3 (≥900) — every card in a row has identical width and height, images are always 16:9 `cover` with a graceful fallback, and nothing shifts when images load.

## Why it matters
Audited root cause of "cards are not uniform": MUI v7 `Grid` ignores legacy `item/xs/sm/md` props (verified by SSR render: no width rules emitted; tsc TS2769 ×391). The card itself also relies on inert Tailwind classes (`RestaurantCard_V.tsx` L104) and un-sized wrapper.

## In scope
1. **Grid migration — only** these surfaces (replace `<Grid item xs={12} sm={6} md={4}>` with `<Grid size={{ xs: 12, sm: 6, md: 4 }}>`; remove `item`; keep `container spacing`):
   - `web/src/features/home/components/FeaturedRestaurantsSection.tsx` L62-95
   - `web/src/pages/restaurantListings/V/Restaurants_V.tsx` L247-257 (cuisine chips: `size={6}`), L853-890 (skeleton), L935-953 (cards)
   - `Restaurants_V` card grid must also equalise heights: each `Grid` child `display:'flex'`, card `height:'100%'`.
   Do **not** codemod the remaining ~370 usages (see Out of scope). Grids in Home sections S05/S07 will be migrated by the slice that edits them.
2. **`RestaurantCard_V.tsx`** (path `web/src/features/restaurant/components/RestaurantCard/RestaurantCard_V.tsx`):
   - Delete the inert `className` wrapper `div` (L104-115); render `SafeImage` directly inside the existing `Box` (L69-75, `aspectRatio:'16 / 9'`) with `position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'`.
   - Image URL helper `withImageParams(src)` in `web/src/shared/utils/imageUrl.ts`: append `?w=…&h=…&fit=crop&q=80` **only** for `images.unsplash.com` URLs without an existing query; return other URLs (local `/assets/...`, data URLs, other CDNs) unchanged.
   - Fixed body geometry: name `noWrap`, 1 meta row (time · fee · min order) with ellipsis, cuisine chips ≤2 on one line (`flexWrap:'nowrap'`, overflow hidden, `+N`), tags row removed from the card or limited to 1 chip with `minHeight` reserved so all cards equal. Choose: **reserve a fixed `minHeight` for the chips block** (simplest, equal heights).
   - Rating: `restaurant.rating > 0 ? toFixed(1) : 'New'` (fixes literal `0`, L137); hide the star row when 0.
   - Navigation semantics: wrap the media+content in `CardActionArea component={RouterLink} to={`/restaurants/${id}`}` (keyboard/middle-click); keep favourite button outside the action area (absolute-positioned sibling) with `aria-label` ("Add/Remove … favourites"). Keep `useFavorites` behaviour (login prompt toast) unchanged.
   - Make `cuisine`, `tags`, `address` null-safe (`?? []`, `address?.split(',')[0] ?? ''`).
3. **`SafeImage.tsx`** (`web/src/shared/components/ui/SafeImage.tsx`): reset `hasError` on `src` change (`useEffect(() => setHasError(false), [src])`); add `loading="lazy"`, `decoding="async"` defaults (overridable); support an optional `fallbackSrc` prop; replace the grey 1×1-ish data URI with a neutral inline-SVG fallback that carries a food icon/`alt`-matching label (still a data URI, no network); fade-in on load (opacity transition) with a neutral `bgcolor` placeholder to avoid flash.
4. Skeleton shape: `Restaurants_V` loading skeleton (L853-890) and Featured skeleton (L63-71 height 300) use a shared `RestaurantCardSkeleton` with the same geometry as the card (16:9 + body) — create `web/src/features/restaurant/components/RestaurantCard/RestaurantCardSkeleton.tsx`, export from `RestaurantCard/index.tsx`.
5. Extract `FilterContent` out of render (L228) into a stable component (props: `filters`, handlers) **or** call it as a function `renderFilterContent()` — either removes remount-per-render (D-15). Behavioural parity only; contract changes belong to S04.

## Out of scope
Repo-wide Grid codemod (377 usages; `tsc` TS2769 ×391 remain elsewhere — record the count reduction only); URL/filter contract (S04); Home section content/visual redesign (S05/S07); batch loading (S06); changing card information design beyond uniformity.

## Files to inspect/touch
Touch: files listed above + new `shared/utils/imageUrl.ts`, `RestaurantCardSkeleton.tsx`, tests. Inspect: `web/src/core/types/index.ts` L70-90 (`Restaurant`), `web/src/features/auth/hooks/useFavorites.ts`, `web/src/pages/Home/SearchPage.tsx` (also uses the card via `RestaurantCard` index default export → must not break), `web/src/features/restaurant/components/RestaurantCard/{RestaurantCard.tsx,Restaurants_Card.tsx}` (other variants, not default).

## Data/API contracts to verify first
`Restaurant` fields used by the card: `id,name,image,rating,cuisine[],address,deliveryTime(string),deliveryFee,minOrder,tags[]`. API normaliser guarantees `cuisine`, `tags`, `address` (`restaurantApi.ts` L91-111) but the mock/other callers may not — hence null-safety. Image provenance: API `imageUrl||image` (Unsplash in seed data; local `/assets/restaurants/*.jpg` exist in `web/public`).

## Route/URL/state contracts
Card link → `/restaurants/:id` (unchanged). No state changes.

## Existing components/abstractions to reuse
`SafeImage`, `useFavorites`, MUI `Card/CardActionArea`, theme tokens, `RestaurantCard/index.tsx` default export. Keep `React.memo`.

## Tests to add/update
- `imageUrl.test.ts`: unsplash without query → params appended; unsplash with query → unchanged; `/assets/x.jpg` unchanged; `data:` unchanged; empty → `undefined`.
- `SafeImage.test.tsx`: broken src → fallback; changing `src` after an error → tries the new src (D-17 regression); `loading="lazy"` present.
- `RestaurantCard.test.tsx`: rating 0 → no literal "0", shows "New"; 3 cuisines → 2 chips + `+1`; missing `tags` doesn't throw; link `href="/restaurants/<id>"`; favourite click does not navigate (use MemoryRouter).
- `RestaurantGrid` layout test (jsdom can't compute CSS media queries): assert Grid children render with the MUI `MuiGrid-grid-xs-12 MuiGrid-grid-sm-6 MuiGrid-grid-md-4` classes (same evidence method as the audit SSR check) and **no** console warning "prop has been removed" (spy `console.error`/`console.warn`).

## Acceptance criteria
- [ ] No MUI "`item`/`xs`/`sm`/`md` prop has been removed" warnings from Home featured grid or `/restaurants` page in the browser console.
- [ ] At 360/768/1280 px, cards render 1/2/3 per row with equal widths; row heights equal (measure with devtools or screenshot; cards in a row share the same bottom edge).
- [ ] Every card image is 16:9 cover; with a deliberately broken URL the fallback shows without layout shift.
- [ ] Rating `0` shows "New", not "0".
- [ ] Keyboard: Tab reaches a card, Enter opens the restaurant; Tab reaches favourite button separately.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` TS2769 count decreases by ≥ the number of Grid lines migrated and total count ≤ baseline.
- [ ] Unit tests green; baseline failing set unchanged; `npx vite build` exit 0.
- [ ] Screenshots before (S00) vs after attached to the change notes.

## Manual verification
Run mock mode (`localStorage.DEV_DATA_SOURCE='mock'` in dev) and API mode if a backend is available; check Home and `/restaurants`; throttle network, block `images.unsplash.com` in devtools to see fallback; resize.

## Rollback / risk
Pure presentation; revert per file. Risk: `CardActionArea` changes ripple/hover — keep existing hover lift. Risk: other callers pass `isFavorite`/`onToggleFavorite` props — keep them. Risk: a leftover legacy `Grid item` next to a migrated one in the same container — migrate whole containers.

## Security / authorization notes
None. Do not widen `img-src` or add third-party image proxies.
