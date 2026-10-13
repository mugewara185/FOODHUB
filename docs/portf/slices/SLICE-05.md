# SLICE-05 — Home truthfulness: data provenance & truthful CTAs

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`. Evidence: [../00-audit.md](../00-audit.md) D-03…D-08, D-18, §6, §7, §11.

| Field | Value |
|---|---|
| Complexity | **L** |
| Backend dependency | **No.** Popularity (B-01) and cross-restaurant reviews (B-02) are **BLOCKED** → honest fallbacks below, no new endpoints |
| Verification target | unit, component, runtime |
| Depends on | S03 (card/grid), S04 (real `/restaurants?…` URLs, fetch dedupe) |
| Unblocks | S07 (visual redesign works on truthful content) |

## Goal / user-visible outcome
Every number, offer, dish, review and button on Home is either real data from the API or removed. Every CTA lands somewhere meaningful or performs a real action (real add-to-cart, real filtered listing).

## Why it matters
The audited Home shows invented stats (2500+ restaurants, 50K+ users), hard-coded testimonials with stock avatars, promo codes that "apply" nothing, invented quick-delivery partners and discounts, "most ordered" dishes from a mock factory with a fake Add-to-Cart toast, and dead cuisine cards. For a portfolio, these destroy credibility on first inspection.

## Decisions baked in (override only via [../04-open-questions.md](../04-open-questions.md))
| Section | Disposition |
|---|---|
| Stats (`StatsSection`, `Home_V.tsx` L106-112, `HeroCompact` defaults) | **Remove** the section. Hero shows only real figures: restaurant count (`selectAllRestaurants().length`) and distinct cuisine count. While loading: skeleton, never `0`. |
| Promo (`PromoSection`) | **Remove** (no promo endpoint; codes don't apply — D-05). |
| Quick Commerce (`QuickDeliverySection`) | **Remove**. Replace with **"Delivers fastest"**: top 3 restaurants by the lower number of `deliveryTime` (API minutes) rendered with the shared `RestaurantCard` — wording shows the real estimate (card already shows `deliveryTime`). No "15 minutes or less" claim. Optional "Free delivery" shelf only if ≥3 restaurants have `deliveryFee===0` (Q3). |
| Popular Dishes (`TopDishesSection`) | **Replace** with **"Menu highlights"** (not "most ordered"): up to 2 *available* menu items from each of the top 3 featured restaurants, loaded via the real `GET /restaurants/:id` (`restaurantApi.getById`, ≤3 requests, parallel). No badges (TRENDING/BESTSELLER), no order counts, no rating stars (API rating is 0). If fewer than 1 item loads, hide the section. If Q2 says "no menus on Home", remove the section. |
| Browse by Cuisine (`CuisinesSection`) | **Rebuild from data**: distinct cuisines from loaded restaurants with real counts and a cover image taken from the highest-rated restaurant of that cuisine (via `SafeImage`). Cards are real links to `/restaurants?cuisine=<name>`. Remove the duplicate heading in `Home_V.tsx` L167-172. Limit to top 6 by count. |
| How It Works (`HowItWorksSection` L25-47) | Keep component, **rewrite copy** to claims the app supports: "Browse restaurants" → "Pick your dishes" → "Checkout and track your order". Remove "Set your location… near you" (no location feature, `/location` route missing) and "20-40 minutes". |
| Testimonials | **Remove** (hard-coded fiction; B-02). |
| Featured Restaurants | **Keep**. Subtitle "Restaurants highlighted on FoodHub" (not "top-rated near you"). CTA → `/restaurants?featured=1` (S04). |
| Final CTA | Keep, copy "Hungry? Browse all restaurants" (remove "Join thousands…"); target `/restaurants`. |
| Dev placeholders | Already removed in S01 (verify). |

## In scope
1. **Selectors/state** (extend `restaurantSlice_V.ts`, no new store): `selectCuisineSummary` (memoised: `{name,count,coverImage}[]`), `selectFastestRestaurants(n)`, `menuHighlights` state `{status:AsyncStatus; items:{restaurantId,restaurantName,item:FoodItem}[]}` with thunk `fetchMenuHighlights` (uses `featuredRestaurants` top 3 by rating, `Promise.allSettled` over `restaurantApi.getById`; tolerate partial failure; filter `isAvailable`).
2. **Components** (in `web/src/features/home/components/`): `CuisineGridSection` (new, replaces use of `CuisinesSection`), `MenuHighlightsSection` (new, replaces `TopDishesSection`), `FastestDeliverySection` (new); edit `HowItWorksSection.tsx` copy, `FeaturedRestaurantsSection.tsx` copy; migrate the Grid usages in every file you touch to `size={{…}}` (S03 pattern).
3. **`Home_V.tsx`**: compose Hero → Featured → Fastest → Cuisines → Menu highlights → How it works → Final CTA; delete `stats`, imports of Stats/Promo/QuickDelivery/Testimonials/TopDishes/HowItWorksSection1, the `Divider`/`Chip` "Explore" block (L140-142), unused imports (tsc TS6133 list for the file: Grid, Paper, InputBase, IconButton, Stack, Alert, Skeleton, DeliveryDining, Star, motion, store, RestaurantCard…).
4. **Menu-highlight Add button = real cart action**: copy the exact payload used by the working add path (`web/src/pages/RestaurantDetails/versions/RestaurantDetailsV0.tsx` L133-170 `handleAddToCart` → `addToCart({...})`, type `CartItem` in `web/src/core/types/index.ts`). Show the toast **after** dispatch. Because the cart reducer silently clears a different restaurant's cart (`cartSlice_V.ts` L59-65), first check `selectCartRestaurant`; if it differs and the cart is non-empty, show a confirm dialog ("Replace your cart with items from X?") — MUI `Dialog`, no new dependency. Secondary action: "View menu" → `/restaurants/:id`.
5. **Resilience states** per section: loading skeleton using card geometry, empty state (hide sections that would be empty, keep Featured's explicit empty alert), inline error `Alert` with **Retry** (`dispatch(fetchRestaurants({ force: true }))`), replacing the toast-only error (`Home_V.tsx` L80-89).
6. **Copy lint test** (below) so fabricated claims cannot silently return.
7. `QuickDeliverySection`, `TopDishesSection`, `StatsSection`, `PromoSection`, `TestimonialsSection`, `CuisinesSection` remain on disk (inactive `Home_V0/V1/V2` and `HomeContainer.tsx` import them) but add a `/** @deprecated fabricated content — see docs/portf */` header; deletion is S07/S08 cleanup once the inactive versions are removed.

## Out of scope
New backend endpoints (popularity, recent reviews, promos); redesign/visual polish (S07); batch loading (S06); promo/coupon system; location feature; deleting inactive Home versions.

## Files to inspect/touch
Touch: `web/src/pages/Home/versions/Home_V.tsx`, `web/src/features/home/components/{FeaturedRestaurantsSection,HowItWorksSection}.tsx`, new `CuisineGridSection.tsx`, `MenuHighlightsSection.tsx`, `FastestDeliverySection.tsx`, `web/src/features/home/components/hero/HeroCompact.tsx` (stats prop only), `restaurantSlice_V.ts`, `restaurantApi.ts` (no change expected; reuse `getById`), tests.
Inspect: `web/src/features/cart/cartSlice/V/cartSlice_V.ts` (L53-88, L190-207 selectors), `RestaurantDetailsV0.tsx` L133-170, `RestaurantDetail_V.tsx` (active details page), `web/src/core/types/index.ts` (`FoodItem` L115-130, `CartItem`), `web/src/features/ui/uiSlice` (`showToast`).

## Data/API contracts to verify first
- `GET /api/restaurants/:id` returns embedded `menu[]` with `{_id?, name, description, price, category, imageUrl?, isAvailable}` (`restaurant.model.ts` L3-10, L40-47); `normalizeMenuItems` (`restaurantApi.ts` L118-141) fabricates `isVeg:false, isBestSeller:false, rating:0` — **do not display those fields**.
- Menu item `image` may be `''` → `SafeImage` fallback.
- Cart payload fields and the single-restaurant rule (above).
- `GET /restaurants` list excludes `menu` (`select('-menu')`), hence the per-restaurant fetch.

## Route/URL/state contracts
CTA targets: `/restaurants?featured=1`, `/restaurants?cuisine=<name>` (S04 contract), `/restaurants/:id`, `/restaurants`, `/tour` (S02 if present). No new routes.

## Existing components/abstractions to reuse
`RestaurantCard_V`, `SafeImage`, `FeaturedRestaurantsSection`, `showToast`, `fetchRestaurants` (S04 `force`), cart slice + selectors, `restaurantApi.getById`, `useHideGlobalSearch`, framer-motion variants in `features/home/utils/animations.ts`.

## Tests to add/update
- `selectors.home.test.ts`: `selectCuisineSummary` counts & cover choice; `selectFastestRestaurants` ordering using API strings (`"20-30 min"` < `"30-40 min"`).
- `Home_V.test.tsx` (store with 4 restaurants, mocked `restaurantApi.getById`): renders Featured, Cuisines (links with `href="/restaurants?cuisine=Indian"`), Menu highlights; **forbidden-text lint**: none of `/2500\+|50K\+|100K\+|10k|FIRST50|MEGA40|FREEDELIVERY|Sarah Johnson|Rajesh Kumar|pravatar|Development Mode|add more components|thousands of|MOST ORDERED|Quick Commerce|15 minutes or less|TRENDING|BESTSELLER/i` appears in the DOM.
- Add-to-cart test: clicking Add dispatches `addToCart` with the real `restaurantId`/`foodItemId` (cart state updated) and the toast appears only afterwards; different-restaurant add opens the confirm dialog and does not clear on cancel.
- Error test: rejected `fetchRestaurants` → inline error + Retry re-dispatches.
- Hero stats test: shows loading skeleton then real count; never renders "0 Restaurants" while loading.

## Acceptance criteria
- [ ] Rendered Home DOM passes the forbidden-text lint; every `<a>`/button has a real `href`/handler (assert no `onClick`-less buttons in test).
- [ ] Cuisine cards navigate to a listing already filtered (S04) and counts equal the data in the store.
- [ ] Menu highlights show only items returned by the API for the named restaurant; Add changes cart state; replacing another restaurant's cart requires confirmation.
- [ ] With the backend offline: Featured shows an error + Retry (no blank page), other sections hide gracefully.
- [ ] Production build: `findstr /m /c:"Sarah Johnson" web\dist\assets\Home_V-*.js` → no match (inactive versions' chunks may still contain it — acceptable until cleanup; note in change notes).
- [ ] No reference to `core/data/factories` from the default Home path (`npx vite build` + inspect `Home_V` chunk imports, or grep imports reachable from `Home_V.tsx`).
- [ ] tsc error count ≤ baseline (expected reduction in `Home_V.tsx`, `FeaturedRestaurantsSection.tsx`); tests green; build exit 0.

## Manual verification
API mode with seeded data: confirm each section's numbers against the DB (`GET /api/restaurants?limit=200` in the browser network tab); click every CTA; add a menu highlight to the cart, open `/cart` (logged out → login redirect; logged in → item present); stop the API and reload.

## Rollback / risk
Component additions are isolated; reverting `Home_V.tsx` restores the old page (but re-introduces fabricated content). Risk: `/restaurants/:id` ×3 extra requests on Home — limited, parallel, and skipped when `featuredRestaurants` is empty; add a short in-memory cache (reuse the S04 `lastFetchedAt` idea) if Render cold-start latency is a problem. Risk: empty seeded DB → most sections hide; Home must still look intentional (S07 handles the empty-catalogue layout).

## Security / authorization notes
No auth change; cart is client state. Never render restaurant/menu text with `dangerouslySetInnerHTML`. Do not reintroduce stock/hot-linked avatars (privacy/tracking). Real review text (future) is user-generated: escape by default (React does).
