- Maps to spec sections: §30 (image fallback), §32 (search duplication)
- Goal: Reusable image fallback mechanism, and remove duplicate search controls on pages that already have their own prominent search.

- In scope:
  Part A — Image fallback:
  1. Create/reuse a small reusable image fallback mechanism for:
     - restaurant cards
     - food item cards
     - restaurant details
     - partner avatars
  2. It must handle: undefined, null, empty string, invalid URL, image load error.
  3. Do NOT duplicate onError handlers across dozens of components.
  4. Use an existing placeholder/fallback asset if one exists.
  5. The mechanism should be a single component or hook (e.g. `<SafeImage>`) used everywhere, not copy-pasted onError handlers.

  Part B — Search dedup:
  1. Inspect the active Home, Restaurants, Restaurant Details, and MainLayout/AppBar.
  2. If the active page already has a prominent search control serving the same purpose as the global AppBar search, hide/collapse the global search on that page.
  3. Do NOT scatter large pathname-specific if/else blocks through the layout. If a small page capability/context mechanism is useful, introduce one — but keep it simple.

- Out of scope (do NOT touch):
  - Favorites (§31) — S5b
  - Logger UI (§29) — S5c
  - FloatingTrigger (§29) — S5c
  - Any delivery, notification, or auth code
  - Any new state architecture
  - Image optimization, lazy loading, responsive srcset, CDN
  - Any new library

- Verification:
  - `cd API && npx tsc --noEmit` -> passes (should be unaffected)
  - `cd web && npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -iE "image|search|MainLayout|card"` -> must be clean for touched files
  - Runtime proof:
    - Image fallback: a headless test mounting `<SafeImage src={undefined} />` asserts the fallback renders. Also test `src=""` and `src="not-a-url"`.
    - Search dedup: cannot be runtime-verified headless. Note this explicitly and describe the manual check.

- Acceptance:
  1. One reusable image component/hook exists. No duplicated onError across the codebase.
  2. It handles undefined, null, empty string, invalid URL, and load error.
  3. Restaurant cards, food cards, restaurant details, and avatars all use it.
  4. No page has both a prominent local search AND the global AppBar search visible at the same time.
  5. No favorites, logger, or FloatingTrigger code was touched.

- Files you expect to touch:
  `web/src/shared/components/ui/SafeImage.tsx` (New: Reusable image component)
  `web/src/shared/components/ui/__tests__/SafeImage.test.tsx` (New: Headless test)
  `web/src/shared/layout/MainLayout.tsx` (Global AppBar Search hiding logic)
  `web/src/pages/Home/*` (Home pages to verify local search existence)
  `web/src/features/restaurant/components/*` (Restaurant and food cards using the image component)
  `web/src/features/deliveryPartner/Profile.tsx` (or similar avatar locations)
