# SLICE-07 — Home visual redesign & responsive polish

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`. Evidence: [../00-audit.md](../00-audit.md) D-01, D-02, D-14, §7; layout targets in [../01-vertical-slice-plan.md](../01-vertical-slice-plan.md) §3.

| Field | Value |
|---|---|
| Complexity | **L** |
| Backend dependency | **No** |
| Verification target | component, build, **runtime (screenshots required)** |
| Depends on | S03 (Grid v7, card, SafeImage), S05 (truthful sections) |
| Unblocks | S08 |

## Goal / user-visible outcome
A visually lively, consistent, production-quality Home page built **only on truthful content from S05**: image-led hero, uniform cards, shared section rhythm, restrained motion, correct at 320 / 360 / 768 / 1024 / 1440 px, with deliberate loading / empty / error states.

## Why it matters
The audited page mixes an off-brand purple gradient final CTA (`Home_V.tsx` L188-225), Unsplash hot-linked hero images (`HeroCompact.tsx` L49, L289), duplicated headings, inconsistent paddings and legacy Grid props that ignore widths (D-01, fixed in S03). Visual polish before content truth (S05) would polish fiction; after S03/S05 it is safe.

## Design direction (decisions baked in)
- **Real photography first.** Hero background/imagery uses real data: highest-rated or featured restaurant `bannerImage`/`image` via `SafeImage`. No third-party stock hot-links (`images.unsplash.com`). If no restaurant image is available, use a **local** brand gradient from the existing MUI theme palette (no purple one-off).
- **One card geometry** everywhere (S03 `RestaurantCard`); fixed aspect-ratio media, 2-line clamped name, 1-line cuisines.
- **Shared `SectionHeader`** (title, optional subtitle, optional "View all" link) and **`SectionContainer`** (consistent vertical padding `{xs:5, md:8}`, max width = layout container). All Home sections use them.
- **≤ 6 sections:** Hero → Featured → Fastest delivery → Browse by cuisine → Menu highlights → How it works (+ compact final CTA). Hide empty ones (S05 rules).
- **Motion (restrained):** reveal-on-scroll **once** (`whileInView`, `viewport={{once:true}}`), translateY ≤ 12 px, opacity only otherwise; card hover lift ≤ 4 px; every animation disabled under `prefers-reduced-motion` (use `useReducedMotion` from framer-motion, already a dependency). No parallax, no infinite loops.
- **Theme only:** MUI `sx` + theme tokens. No Tailwind (not installed — D-16), no new UI framework, no new dependency.
- **A11y:** one `<h1>` (hero), sequential `h2` per section, images have meaningful `alt` (restaurant name) or `alt=""` when decorative, contrast ≥ 4.5:1 on text over images (use a scrim), focus rings preserved, hit targets ≥ 44 px.
- **Performance:** hero image `loading="eager"` + `fetchPriority="high"`, all below-the-fold images `loading="lazy"`; set explicit width/height or aspect-ratio to avoid CLS; Cloudinary/Unsplash width params only via a helper that checks for existing query strings (the `?w=` concat bug in `RestaurantCard_V.tsx` L106 is fixed in S03).

## In scope
1. New shared components in `web/src/features/home/components/shared/`: `SectionHeader.tsx`, `SectionContainer.tsx`, `useRevealOnce` (or small `Reveal` wrapper honouring reduced motion).
2. Rework `hero/HeroCompact.tsx`: real-image hero + scrim, search field (navigates `/restaurants?q=` per S04), 1-2 primary CTAs (`Browse restaurants` → `/restaurants`; `Take the tour` → `/tour` if S02 shipped, otherwise omit), truthful metrics line from S05 (restaurant count/cuisine count, skeleton while loading, hidden if 0).
3. Apply `SectionHeader`/`SectionContainer` to all S05 sections; unify spacing/grids to the S03 pattern (`size={{ xs:12, sm:6, md:4, lg:3 }}` or the values chosen in S03).
4. Final CTA: replace gradient with a theme-token surface; copy from S05.
5. Loading skeletons / empty / error per section matching final geometry (no layout shift when data arrives).
6. **Cleanup** (only after confirming zero imports via `git grep`): delete deprecated fabricated components (`StatsSection`, `PromoSection`, `QuickDeliverySection`, `TestimonialsSection`, `TopDishesSection`, `CuisinesSection`, legacy `Hero*` variants not used), `HomeContainer.tsx`, inactive `Home_V0/V1/V2` variants, plus `DevVersionRenderer` wiring for Home if no longer needed. If any import remains, **keep the file** and record it in the change notes (do not break the build to delete). Leave `pages/restaurantListings` inactive variants untouched (out of scope).
7. Update `docs/` developer notes only if they describe deleted files (do not delete `docs/portf`).

## Out of scope
New content/claims, backend changes, theme overhaul, dark mode, i18n, listing page redesign, new routes, Lottie/video assets, new fonts.

## Files to inspect/touch
`web/src/pages/Home/versions/Home_V.tsx`, `web/src/features/home/components/**`, `web/src/features/home/utils/animations.ts`, `web/src/features/restaurant/components/RestaurantCard/RestaurantCard_V.tsx` (only if a visual defect remains after S03), `web/src/shared/components/ui/SafeImage.tsx`, `web/src/core/theme` (read-only: use tokens), `web/src/pages/Home/index.tsx` (`DevVersionRenderer`).

## Data/API contracts to verify first
- Which restaurant fields carry usable images (`image`, `bannerImage`, `coverImage`) in the real API vs. seed data — NEEDS VERIFICATION U-02/U-07 (seed images may be empty strings → hero must have a no-image fallback).
- Number of restaurants in seed data (empty-catalogue layout must still look intentional).

## Route/URL/state contracts
Unchanged: `/` renders Home; CTAs target routes listed in S05. No query-string changes.

## Existing abstractions to reuse
S03 card/grid, `SafeImage`, MUI theme tokens, framer-motion variants (`features/home/utils/animations.ts`), `useHideGlobalSearch`, S05 selectors and sections.

## Tests to add/update
- Component: `SectionHeader` renders title/subtitle/link; `Reveal` renders children immediately when reduced-motion is on (mock `matchMedia`).
- `Home_V.test.tsx` (extend S05): exactly one `h1`; heading order; no element with text matching the S05 forbidden list; empty store → empty/loading layout without throw; error store → Retry visible.
- Snapshot-free: assert structural invariants, not pixel output.
- Build check: `Home_V` chunk contains no `images.unsplash.com` (`findstr /m /c:"images.unsplash.com" web\dist\assets\Home*.js`; the inactive/deleted versions must also be gone or acknowledged).

## Acceptance criteria
- [ ] At 320, 360, 768, 1024, 1440 px: no horizontal scroll, no overlapping/clipped text, cards equal height per row, images do not stretch (screenshots **required**; compare to S00 baselines; if the app cannot run, mark the slice's visual criteria `NEEDS VERIFICATION`, not passed).
- [ ] `prefers-reduced-motion: reduce` disables all transitions/reveals.
- [ ] Hero text contrast ≥ 4.5:1 over image (measure with devtools/Lighthouse; record value).
- [ ] No `images.unsplash.com` / `pravatar` on Home; no purple gradient token.
- [ ] Lighthouse (if runnable) mobile: record Performance/Accessibility numbers in the PR notes — do not claim targets that were not measured.
- [ ] tsc error count ≤ baseline (expect a reduction); unit tests green; build exit 0; main chunk size not larger than baseline 2,537 kB (removal of dead sections should shrink it).

## Manual verification
Run in API mode with seeded data and in mock mode; go through the five viewport widths; throttle network to "Slow 4G" and confirm skeletons → content without layout shift; tab through the page with the keyboard; toggle OS reduced-motion.

## Rollback / risk
Section-by-section: each section is its own commit-sized change (hero, then each section). Revert a section by restoring its previous component; deletions (item 6) are a **separate final commit** so they can be reverted alone. Risk: hero image hurts LCP → keep size-constrained and eager; risk: seed data lacks images → fallback verified.

## Security / authorization notes
No auth changes. Never hot-link third-party image hosts with user data; never use `dangerouslySetInnerHTML`; ensure the dev chips/`DevVersionSwitcher` stay gated (S01) and are not reintroduced by the deleted-variant cleanup.
