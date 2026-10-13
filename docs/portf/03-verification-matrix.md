# 03 — Verification matrix

Baseline: SHA `f9bc00851afadaf2934188cda27061da005b96e8`, branch `dev/development`, clean tree.

## 1. Verification levels (how to phrase claims)

| Level | Meaning | Audit status |
|---|---|---|
| Source-inspected | Read in code | Done for all findings in [00-audit.md](00-audit.md) |
| Build-verified | `vite build` / `tsc` executed | Done once at baseline (numbers below) |
| Runtime-verified | Observed in a running app/API | **NOT DONE** (no browser, no Mongo) |
| E2E-verified | Scripted user journey executed | **NOT DONE** |

An implementer must never write "verified" without naming the level reached and the command run.

## 2. Matrix — required (R), optional (O), not applicable (–)

| Slice | Unit | Component | Integration (API/Supertest) | Typecheck | Build | Runtime (browser/screenshot) | E2E |
|---|---|---|---|---|---|---|---|
| S00 | R (characterization) | – | – | R | R | R (baseline screenshots, or mark NEEDS VERIFICATION) | – |
| S01 | R | O | **R** (register role, validation, no-log, destructive ops guard) | R | R | R (prod preview: register secured, switcher interactive) | O |
| S02 | – | R | – | R | R | R | O |
| S03 | O | R | – | R | R | **R** (card heights at 5 widths) | – |
| S04 | R | R | – | R | R | R | O |
| S05 | R | R | – | R | R + forbidden-text `findstr` | R (API mode, seeded) | O |
| S06 | R | R | O (pagination shape) | R | R | R | O |
| S07 | O | R | – | R | R | **R** (5 widths, reduced motion, contrast) | O |
| S08 | R (all) | R (all) | R (all backend) | R | R | R | O (`web/e2e.ts`, U-11) |

## 3. Baseline numbers (recorded; compare after every slice)

| Check | Exact command | Baseline result |
|---|---|---|
| Unit tests | `npx vitest run` (cwd `web/`) | exit 1; 6 files failed / 9 passed; 5 tests failed / 33 passed (38). Pre-existing, unrelated: 3 suites fail resolving `./useDeliveryTracking`; failures in `useAdminFleet`, `factorySeed`, `deliveryNotifications` |
| Build | `npx vite build --outDir <scratch> --emptyOutDir` (cwd `web/`) | exit 0, 79.6 s; main chunk `index-*.js` 2,537 kB (740 kB gzip); dev-doc chunks present (`FRAMEWORK_*`, `DEV_RENDERER_GUIDE`, `HOME_FILE_STRUCTURE`, …) |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` (cwd `web/`) | exit 2; **1,244** `error TS` (TS6133 ×566, TS2769 ×391, TS2339 ×73, TS2322 ×39, TS2554 ×36) |
| Grid check | scratch Node SSR script | legacy `item/xs/sm/md` props → "removed" warnings and no width CSS; `size={{…}}` works |
| Backend tests | `npm test` (cwd `API/`) | **NOT RUN** (needs Mongo) |
| Browser / E2E | — | **NOT RUN** |

Notes: do not pass `--incremental false` to `tsc` (TS6379 for composite projects). Do not put build output in a tracked folder. Use `findstr /m /c:"text" <files>` for bundle scans (PowerShell `Select-String` over the 2.5 MB bundles and repo-wide `Get-ChildItem -Recurse` are far too slow; use `git ls-files` for listings).

## 4. Standard commands per slice

```text
cd web
npx vitest run                                  # new tests green; no new failures vs baseline
npx tsc -p tsconfig.app.json --noEmit           # count `error TS` <= 1244, none new in touched files
npx vite build --outDir ..\scratch-dist --emptyOutDir
findstr /m /c:"Sarah Johnson" /c:"FIRST50" /c:"pravatar" /c:"images.unsplash.com" ..\scratch-dist\assets\*.js
cd ..\API
npm test                                         # requires Mongo test DB — mark NOT RUN if unavailable
```

(The scratch directory must be outside tracked paths or git-ignored; delete after use.)

## 5. Slice-specific proof requirements

| Slice | Must prove |
|---|---|
| S00 | Baseline screenshots at 360/768/1280 (Home + listing); characterization tests for restaurantApi & restaurantSlice green; D-01/D-02/D-09/D-15 confirmed in runtime |
| S01 | `POST /auth/register` with `roles:['admin']` yields a customer; validation actually replaces `req.body` (S-01); no token/body/user logging; `/api/dev/*` destructive ops locked to test DB; DevVersionSwitcher and `/dev` explorer remain functional and safely isolated |
| S03 | Cards equal height per row at 320/768/1024/1440; no Grid "removed prop" warnings in touched files |
| S04 | `parse(serialize(x))` round-trip; `"30-40 min"` matches `time=40`; Back restores filters; `/search?q=` redirects |
| S05 | Forbidden-text lint on rendered Home DOM; cuisine counts equal store data; real add-to-cart changes cart state |
| S06 | >200 restaurants reachable or truncation disclosed; "Show more" counts truthful |
| S07 | Screenshots at 5 widths vs S00 baseline; reduced-motion; contrast measured |
| S08 | Every checklist item in SLICE-08 §A-C has a recorded pass/fail/NOT RUN |
