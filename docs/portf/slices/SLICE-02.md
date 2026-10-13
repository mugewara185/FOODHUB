# SLICE-02 — Visitor showcase & guided tour

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`. Evidence: [../00-audit.md](../00-audit.md) §9 (routes/roles), §4 (security).

| Field | Value |
|---|---|
| Complexity | **M** |
| Backend dependency | **No** for the default scope. Live role demo accounts are **BLOCKED on a decision** ([../04-open-questions.md](../04-open-questions.md) Q1) and excluded here |
| Verification target | component, build, runtime |
| Depends on | **SLICE-01 merged** (no visitor entry may ship while registration can mint roles / dev UI leaks) |
| Unblocks | S08 (journey) |

## Goal / user-visible outcome
A first-time visitor lands on Home, sees an honest "Take the tour" entry, and opens `/tour`: a guided page that explains FoodHub's four experiences (customer, owner, delivery partner, admin) with **real, working deep links only where a public/authenticated-customer route exists**, and clearly-labelled *recorded* media for the rest. No credentials are shown, no auto-login, nothing pretends to be live that is not.

## Why it matters
The app has no visitor/demo concept (audit §9) and each role has its own mutually exclusive route tree (`routes/index.tsx` L24-37: `user.role[0]`), so a single login cannot "tour" every role. The honest, safe way to show owner/partner/admin experiences without weakening auth is recorded walkthroughs; the customer journey can be live.

## In scope
1. Typed content config `web/src/features/tour/tourSteps.ts`:
   ```ts
   export type TourStep = { id: string; role: 'customer'|'owner'|'partner'|'admin'; title: string; summary: string;
     mode: 'live'|'recorded'; cta?: { label: string; to: string }; media?: { src: string; alt: string; kind: 'image'|'video' } };
   ```
   Customer steps (`mode:'live'`, public routes verified in `UserRoutes.tsx` L36-54): browse `/restaurants`; search `/search`? **No** — `/search` is mock-driven (D-18) until S04/S05 fix it; include only after S04. Restaurant detail: link to `/restaurants` (do not hard-code an id). Sign up `/signup` (creates a `user` role account — true after S01). Cart/checkout/orders/tracking: describe, link `/login` (guarded routes redirect there).
   Owner/partner/admin steps: `mode:'recorded'`, `media` optional. **Only include a step if its media file exists** under `web/public/tour/`. Capturing media is a manual task (record against a local seeded env; blur/replace any personal data). If no media exist yet, render role cards as text-only with the label "Walkthrough media coming soon" **removed** — i.e. omit the role until media exists, or describe only features verified in README "Portfolio Demo" and `OwnerRoutes`/`AdminRoutes` (owner: queue/active real; menu/analytics/etc. are `ComingSoon` — **do not claim them**).
2. Page `web/src/pages/Tour/index.tsx` (MUI only, existing theme): stepper/cards grouped by role, each with Live/Recorded chip, one primary CTA, `SafeImage` for media.
3. Route: add `<Route path="tour" element={<Tour />} />` inside the public block of `web/src/app/routes/domain/UserRoutes.tsx` (after L46). Only the `UserRoutes` tree renders it (owner/admin/partner sessions don't see it — intentional).
4. Entry points: (a) Home hero secondary button "Take the tour" → `/tour` in `HeroCompact.tsx` (additive; S07 will restyle it — keep it a standalone `<Button component={RouterLink} to="/tour">`), (b) drawer item in `MainLayout.tsx` `menuItems` (L546-554) "Tour".
5. Accessibility/SEO basics: one `<h1>`, landmarks, link text meaningful, media with alt.

## Out of scope
Demo role accounts or any credential display/auto-login (Q1); a "visitor mode" auth state; simulators in production; a guided overlay/coach-mark library (new dependency); `/dev` anything.

## Files to inspect/touch
Touch: new `web/src/features/tour/tourSteps.ts`, `web/src/features/tour/tourSteps.test.ts`, `web/src/pages/Tour/index.tsx`, `web/src/pages/Tour/Tour.test.tsx`, `web/src/app/routes/domain/UserRoutes.tsx`, `web/src/shared/layout/MainLayout.tsx` (menu), `web/src/features/home/components/hero/HeroCompact.tsx`, optional `web/public/tour/*`.
Inspect: `web/src/app/routes/index.tsx`, `web/src/features/auth/protectedRoute.tsx`, `README.md` L518-536 (demo script), `web/src/shared/components/ui/SafeImage.tsx`.

## Data/API contracts to verify first
None (static). Confirm each `cta.to` against registered routes (test below). Confirm `/signup` creates a `user` role only (S01 acceptance).

## Route/URL/state contracts
New public route `/tour`. No Redux state. Links are plain `react-router-dom` links; guarded targets rely on existing `ProtectedRoute` redirect (`/login`, `state.from`).

## Existing abstractions to reuse
`MainLayout`, `SafeImage`, MUI theme, `RouterLink`, `appConfig` (not needed). Pattern for static config: other `*_V` feature folders.

## Tests to add/update
- `tourSteps.test.ts`: every `cta.to` ∈ allow-list `['/restaurants','/signup','/login','/']`; every `recorded` step with `media` points to a path that exists under `public/tour` (use `fs.existsSync` in the test); no step text contains "demo account", "password", "admin@", "credentials".
- `Tour.test.tsx` (MemoryRouter): renders h1, one Live/Recorded chip per step, CTA hrefs correct.
- Route test: `/tour` renders without auth.

## Acceptance criteria
- [ ] `/tour` loads logged-out in `npm run preview` with no console errors and no network calls other than static assets.
- [ ] Every CTA lands on a real page (manual click-through + automated link test).
- [ ] No credentials, tokens or demo logins appear anywhere in the page or bundle (`findstr /m /i /c:"devdev" dist\assets\*.js` gives no match from this slice).
- [ ] Recorded steps are visibly labelled "Recorded"; live steps only link to routes that work for a visitor.
- [ ] Owner/admin/partner claims match actual implemented pages (not `ComingSoon`).
- [ ] Home hero and drawer contain the entry point; mobile (360 px) layout has no horizontal scroll.
- [ ] tsc error count ≤ baseline; unit tests green.

## Manual verification
Visitor window: Home → "Take the tour" → each CTA → back. Repeat at 360/768/1280. Log in as a customer: `/tour` still opens. Log in as owner/admin (if you have local accounts): confirm they do not get `/tour` (route tree differs) and are not broken.

## Rollback / risk
Remove the route + links; page is self-contained. Risk: merge conflict with S07 in `HeroCompact` — keep the edit minimal. Risk: tempting to add "try as admin" → forbidden here.

## Security / authorization notes
No auth changes. Do not add a guest role/token, do not publish credentials, do not enable `VITE_DEV_BYPASS_AUTH`, do not expose `/dev`. If Q1 is later approved, it needs its own slice with: dedicated demo accounts in a separate demo DB, rotated credentials, rate limiting, server-enforced read-only behaviour for destructive actions (not client flags).
