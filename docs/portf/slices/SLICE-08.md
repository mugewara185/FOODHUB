# SLICE-08 — Regression & portfolio acceptance

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Evidence: [../00-audit.md](../00-audit.md) §2 (baseline numbers), S-01…S-09, [../03-verification-matrix.md](../03-verification-matrix.md).

| Field | Value |
|---|---|
| Complexity | **M** |
| Backend dependency | No new backend work; **runs** backend tests/preview and requires S01's backend fix to be in place |
| Verification target | unit, build, runtime, E2E (optional) |
| Depends on | S01–S07 |
| Unblocks | Portfolio publication |

## Goal / user-visible outcome
Prove (with executed commands, not assumptions) that the finished product matches the claims in the README: a visitor can go Home → tour → filtered listing → restaurant → add to cart → login redirect on any viewport, no fabricated content ships, intentional developer showcase features function smoothly and safely, and no security regression was introduced. Update the docs/CI so what is written is true.

## Why it matters
Baseline: 5 failing unit tests of 38, 1,244 tsc errors, a 2.5 MB main chunk, README that says "not yet live", and CI that deploys different branches and runs no tests. Without a final pass, earlier slices cannot be trusted together.

## In scope

### A. Baseline-delta checks (record command + exact output in the PR notes)
| Check | Command (from `web/`) | Baseline (SHA `f9bc008`) | Target |
|---|---|---|---|
| Unit tests | `npx vitest run` | 6 files failed / 9 passed; 5 tests failed / 33 passed (38) | no new failures; the 5 pre-existing failures either fixed or listed as known with reasons; new tests all green |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 2, **1,244** `error TS` | ≤ 1,244 and **0 new errors in files touched** by S00-S07 |
| Build | `npx vite build --outDir <scratch> --emptyOutDir` | exit 0, 79.6 s, main chunk 2,537 kB | exit 0; main chunk ≤ baseline |
| Backend tests | `npm test` in `API/` | NOT RUN (needs Mongo) | green incl. S01 register-role/validation tests (requires `MONGO_URI` test DB or mongodb-memory-server) |

> Do **not** use `tsc --incremental false` (TS6379 on composite projects). Build to a scratch `--outDir`; never leave `dist/` tracked changes.

### B. Visitor journey (runtime; Playwright if S08 opts in, otherwise manual checklist with screenshots)
1. `/` → Home renders; no console errors; polished showcase presentation.
2. Home → "Take the tour" (`/tour`, S02) renders role walkthroughs and engineering showcase highlights without login.
3. Home → cuisine card → `/restaurants?cuisine=X` shows only X, chip visible, URL shareable (open in a new tab → same state).
4. Search `?q=` and the hero search both land on the listing with results; browser Back restores previous filters.
5. "Show more" reaches the end; counts truthful (S06).
6. Open `/restaurants/:id` → add item → cart reflects it → `/checkout` while logged out → redirected to `/login` and returns after login (check the existing `from`/redirect behaviour; NEEDS VERIFICATION U-10).
7. Menu highlight Add on Home → same cart; adding from a second restaurant asks for confirmation.
8. Component Version Switcher (`DevVersionSwitcher`): toggling component versions updates UI seamlessly.
9. Repeat 1-4 at 320 / 768 / 1440 px.

### C. Security boundary checklist (each item has an explicit pass/fail line in the PR notes)
- [ ] `POST /api/auth/register` with `roles:['admin']` (and `role`, `isAdmin`, `walletBalance` if present in the model) **cannot** create a privileged user (S-01) — Supertest/curl against a local API.
- [ ] Login/register request bodies and user documents, and bearer tokens, are not logged (`grep -n "console.log" API/src/modules/auth API/src/shared/middleware` shows none of body/user/token) (S-02/S-03).
- [ ] Login regex injection: email `.*` does not match another account (S-05).
- [ ] Showcase safety: `DevVersionSwitcher` functions smoothly and safely allows evaluators to test component versions; `/dev` routes render read-only component explorers and architecture documentation without exposing mutating admin APIs.
- [ ] Client bypass protection: unauthenticated visitors cannot bypass backend role guards to perform administrative mutations; `web/.env` decision (Q6) applied.
- [ ] Destructive backend endpoints: `/api/dev/*` operations (reset/seed) return 403 on non-test DBs and cannot accidentally wipe database collections.
- [ ] Forbidden-content scan of the production bundle for default consumer routes: `Sarah Johnson`, `FIRST50`, `pravatar`, `images.unsplash.com`, `Quick Commerce`, `2500+`.
- [ ] Role route trees: a `customer` token cannot open owner/admin pages (manual: log in as customer, visit `/admin`, `/owner`).

### D. Optional E2E
`web/e2e.ts` exists in the repo (contents **not reviewed** in the audit — U-11). The implementer should read it first; reuse/extend it if it is a working Playwright/Cypress script, otherwise perform checklist B manually. Do not add a new test framework without approval.

### E. Documentation & CI truthfulness
- README (`README.md` L518-546 "Portfolio demo / deployment"): remove "not yet live" unless a URL is live; replace the mock-mode claim ("renders entirely from factory data") with the truth; add the verified demo script (B) and the security checklist results; link the screenshots captured in S07.
- Deployment runbook: fix env names to what the code reads — `MONGO_URI` (not `MONGODB_URI`), `CLIENT_URL` (not `CORS_ORIGIN`) (S-09); state the deploy branch. `FINAL_REPORT.md` §6 claim (TopDishes uses `SafeImage`) corrected or the file annotated.
- CI (`.github/workflows/azure-static-web-apps.yml`): **note, then propose** — it triggers on `main`/`dev/main`, not `dev/development`, and runs no tests. Add a `typecheck`/`test` job **only with owner approval** (Q8) and only for the new/fixed tests (a red baseline would block all deploys). Do not change deploy credentials or secrets.
- Remove the stray tracked file `web/src/App.test.ts    (create)` only with explicit confirmation (accidental artefact; listed in audit §1).

## Out of scope
New features, live-demo accounts (Q1), backend refactors beyond S01, fixing the 1,244 pre-existing tsc errors wholesale, fixing the 5 unrelated failing tests (`useDeliveryTracking` import, `useAdminFleet`, `factorySeed`, `deliveryNotifications`) unless trivially related.

## Files to inspect/touch
`README.md`, deployment runbook doc (locate with `git ls-files | findstr /i "deploy runbook"`), `FINAL_REPORT.md`, `.github/workflows/azure-static-web-apps.yml` (proposal only), `web/e2e.ts`, `web/package.json` (scripts), `API/package.json`, `docs/portf/*` (record results in `03-verification-matrix.md`).

## Data/API contracts to verify first
Real login redirect-back behaviour (`ProtectedRoute` `from` state); which env var names the API actually reads (`API/src/config` or `process.env.*`); the local test-DB strategy for the API.

## Route/URL/state contracts
No changes. This slice asserts the contracts from S02, S04, S05, S06.

## Existing abstractions to reuse
Existing vitest setup; S00 characterization tests (flipped in S04); S00 screenshot baselines; `npx vite preview` for production-mode checks.

## Tests to add/update
- Journey tests (E2E or component-level using a memory router + real store) covering B.2-B.7.
- Backend: S01's tests re-run; add a regression test per S-01/S-05 if missing.
- A repo script or documented command set for the bundle scans in C (a short `docs/portf/` note is enough; do not add runtime code).

## Acceptance criteria
- [ ] A, B, C all executed and recorded with real outputs; any item that could not be executed is labelled **NOT RUN** with the reason.
- [ ] Zero critical (S-01) findings open; any High left open is listed in README "Known limitations".
- [ ] README/runbook/CI notes match actual behaviour.
- [ ] `git status` clean except intended changes; no secrets committed; no commit/push unless the owner asked.

## Manual verification
Fresh clone, `npm ci` in `web/` and `API/`, run API (seeded) + web, execute checklist B at the three widths, then `npx vite build` + `npx vite preview` and run checklist C.

## Rollback / risk
Docs-only changes revert trivially. Risk: enabling CI tests turns the pipeline red because of the pre-existing 5 failures — gate the job to new tests or fix the failures first. Risk: runtime checks need Mongo; if unavailable mark backend items NOT RUN rather than inferring.

## Security / authorization notes
This slice is the verification of S-01…S-09. Never paste real tokens, connection strings or `.env` contents into reports; redact. Do not weaken CORS or auth to make E2E pass.
