# SLICE-01 — Security hardening & safe showcase isolation

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`, backend `API/`. Evidence: [../00-audit.md](../00-audit.md) §3.2, §4.

| Field | Value |
|---|---|
| Complexity | **M** |
| Backend dependency | **YES — required** (S-01, S-02, S-03 live in `API/`) |
| Verification target | unit (web), integration (API, test DB only), build, runtime |
| Depends on | S00 (test net) — may start in parallel if S00 tests aren't needed |
| Unblocks | S02 (must not deploy a visitor entry before this lands), S08 |

## Goal / user-visible outcome
The production deployment enforces strict security and data safety boundaries while preserving FoodHub's rich developer showcase capabilities:
1. Public visitors cannot mint privileged roles (e.g. `admin`, `owner`, `partner`) by registering.
2. Sensitive credentials, passwords, and authorization tokens are never leaked to server logs.
3. Destructive backend endpoints (e.g. database purge/seed) are locked to dedicated test databases.
4. Intentional engineering showcase features (component version switching, diagnostic logs, mock/API data toggles, architecture explorer) remain accessible, discoverable, and safely isolated for portfolio evaluators.

## Why it matters
FoodHub is a dual-purpose portfolio laboratory: it showcases both consumer food ordering and full-stack engineering infrastructure. However, reviewers and automated security scanners must not find authentic vulnerabilities: registration mass assignment (S-01), plaintext credential logging (S-02/S-03), unescaped regex search patterns (S-05), or unprotected destructive routes.

Crucially, **showcase features are not vulnerabilities**: client-side version switching (`DevVersionRenderer`), mock data toggles, and read-only component explorers are valuable demonstrations of engineering rigor and should be preserved and celebrated rather than stripped.

## In scope
**Backend (`API/`) — Real Security Hardening**
1. `API/src/shared/middleware/validate.middleware.ts` L7: assign the parsed result — `req.body = await schema.parseAsync(req.body)` — so unknown keys are stripped (Zod objects strip by default). Check the other routes using `validateRequest` (`reviews`, `auth`, `orders`, `users`, `delivery`) still pass their tests; if a schema is intentionally partial, use `.passthrough()` explicitly there.
2. `API/src/modules/auth/auth.controller.ts` L44: build the user explicitly: `User.create({ name, email, password, phone, address })`; **never** read `roles`/`status` from the request body. Roles are assigned strictly server-side (default `['user']`).
3. Same file L65/L68: delete `console.log("body", …)` and `console.log('User found:', user)` to prevent credential leakage in logs. L66: escape email lookup (`email.toLowerCase()` exact match — schema lowercases emails, `auth.model.ts` L45 — instead of unescaped `new RegExp`).
4. `API/src/shared/middleware/auth.middleware.ts` L45, L47: delete the `decoded`/`user` logs that leak bearer tokens and user documents.
5. `API/src/modules/dev/dev.controller.ts` (or equivalent dev endpoints): verify destructive database operations (reset/seed/truncate) refuse execution unless the connected database name matches `/(test|e2e)/i`, protecting non-test databases from accidental reset.
6. Add security tests: `API/src/modules/auth/__tests__/register.security.test.ts` — POST `/api/auth/register` with `roles:["admin","dev"]` and `status:"active"` yields a created user with only `roles:['user']`; login response contains no password field; logs contain no secrets (integration test against dedicated test DB using existing pattern in `API/src/modules/users/__tests__/profile.integration.test.ts`).

**Frontend (`web/`) — Showcase Hygiene & Boundary Preservation**
7. Clean up scratch placeholder chips: Remove the raw scratch chip in `Home_V.tsx` L129-138 ("add more components here"). In `HeroCompact.tsx` L77-94, style the environment/version chip cleanly as an intentional showcase indicator rather than raw debug clutter.
8. `DevContext.tsx` & `DevVersionSwitcher.tsx`: Preserve the component version switcher for evaluators! Ensure `zom2_dev_versions` cleanly persists and swaps active versions in preview/production builds, allowing reviewers to test different versions (e.g., `Hero_V1` vs `Hero_V2`, `RestaurantCard_V1` vs `RestaurantCard_V2`).
9. `protectedRoute.tsx`: Ensure route-level role checks prevent unauthorized access to backend-guarded administrative panels without authentication, while supporting intentional demo role switching / tour previews (S02).
10. `routes/index.tsx`: Keep `/dev/*` showcase routes (Component Explorer, State Inspector, Architecture Docs) accessible or linked via showcase navigation so technical reviewers can explore them directly.
11. Secret hygiene: Verify `web/.env` does not contain production secrets. Consult repository owner on untracking local `.env` files via `.gitignore` (see [../04-open-questions.md](../04-open-questions.md) Q6).

## Out of scope
New demo accounts (handled in S02/Q1), rotating secrets, rate limiting, rewriting auth system, fixing plaintext seed passwords, CI workflow restructuring (deferred to S08).

## Files to inspect/touch
`API/src/shared/middleware/validate.middleware.ts`, `API/src/modules/auth/{auth.controller,auth.routes,auth.model}.ts`, `API/src/shared/middleware/auth.middleware.ts`, `API/src/modules/dev/dev.controller.ts`, `web/src/features/home/components/hero/HeroCompact.tsx`, `web/src/pages/Home/versions/Home_V.tsx`, `web/src/core/dev/contexts/DevContext.tsx`, `web/src/core/dev/renderer/DevVersionSwitcher.tsx`, `web/src/shared/layout/MainLayout.tsx`, `web/src/features/auth/protectedRoute.tsx`, `web/src/app/routes/index.tsx`, `web/src/core/config/app.config.ts`.

## Data/API contracts to verify first
- `POST /api/auth/register` body schema `registerSchema` (`auth.controller.ts` L9-15): `name, email, password, phone?, address?`. Confirm `User` model fields `phone`, `address` exist before whitelisting (`auth.model.ts`).
- Response shape `{ success, data: { token, user: { id, name, email, roles } } }` must remain strictly unchanged (`authSlice` in Redux depends on it).
- Run `cd API && npm test` on a dedicated test DB to confirm baseline.

## Route/URL/state contracts
- `/dev/*` showcase routes (Explorer, Architecture Viewer, Logs) remain accessible for portfolio review.
- Component version state in `localStorage.zom2_dev_versions` correctly applies overrides across swappable components.
- Destructive `/api/dev/*` routes return 403 Forbidden if executed against any non-test database.

## Existing abstractions to reuse
- `IS_DEV` / `IS_PROD` from `app.config.ts`.
- `DevContext` and `DevVersionSwitcher` for dynamic component swap demonstrations.
- `validateRequest` and Zod schemas (enhance with strict parsing, do not rewrite).
- `AppError` and standard API response envelope.

## Tests to add/update
- API: `register.security.test.ts` (role escalation prevention, password absence in response).
- API: Unit test for `validateRequest` ensuring unknown/unwhitelisted keys are stripped from `req.body`.
- Web: Unit tests in `web/src/core/dev/contexts/DevContext.test.tsx` verifying that `zom2_dev_versions` correctly loads and sets component version overrides for showcase reviewers.
- Web: Route protection test ensuring unauthenticated visitors cannot access restricted administrative routes without demo credentials.

## Acceptance criteria
- [ ] `POST /api/auth/register` with `roles: ["admin", "dev"]` stores `roles: ['user']` (automated test on test DB).
- [ ] `grep -rn "console.log" API/src/modules/auth API/src/shared/middleware/auth.middleware.ts` returns no credential, token, or raw user-document logging.
- [ ] Backend destructive operations (`/api/dev/reset`, `/api/dev/seed`) fail with 403 unless the connected database name matches `/(test|e2e)/i`.
- [ ] `DevVersionSwitcher` remains fully functional in production/preview builds, allowing evaluators to switch component versions.
- [ ] Swapping versions via `localStorage.zom2_dev_versions` or `DevVersionSwitcher` successfully updates rendered components without crash.
- [ ] Developer showcase routes (`/dev/*`) remain accessible for technical reviewers to inspect component trees and logs.
- [ ] Web and API test suites pass without regression against the baseline.

## Manual verification
1. Register a new user with a crafted payload containing `{"roles":["admin"]}` against local test API; inspect DB document to confirm role is strictly `['user']`.
2. Inspect server terminal logs during login to confirm no passwords, hashes, or JWT tokens are printed.
3. Open the web application, interact with `DevVersionSwitcher`, and verify component versions change dynamically.
4. Navigate to `/dev` or showcase links to confirm developer tooling and state inspectors function cleanly.

## Rollback / risk
Backend validation changes are localized and revertable per file. Risk: existing API routes relying on undocumented body keys might be affected by schema stripping — run the full API test suite; if an endpoint requires flexible fields, add `.passthrough()` to that specific schema only.

## Security / authorization notes
Maintain strict separation between **real security controls** (authentication, authorization, credential secrecy, database safety) and **portfolio showcase features** (version switching, component explorers, diagnostic logs). Never test escalation against production databases. Record any residual questions in [../04-open-questions.md](../04-open-questions.md).
