# SLICE-01 — Production safety gate

Self-contained. Repo `FoodHub` (`mugewara185/Zom2`), branch `dev/development`, baseline SHA `f9bc00851afadaf2934188cda27061da005b96e8`. Frontend `web/`, backend `API/`. Evidence: [../00-audit.md](../00-audit.md) §3.2, §4.

| Field | Value |
|---|---|
| Complexity | **M** |
| Backend dependency | **YES — required** (S-01, S-02, S-03 live in `API/`) |
| Verification target | unit (web), integration (API, test DB only), build, runtime |
| Depends on | S00 (test net) — may start in parallel if S00 tests aren't needed |
| Unblocks | S02 (must not deploy a visitor entry before this lands), S08 |

## Goal / user-visible outcome
A production visitor never sees developer artefacts (dev chips, version switcher, stale version overrides), cannot mint privileged roles by registering, and credentials/tokens are never written to server logs.

## Why it matters
A portfolio that invites reviewers must not be self-escalatable to admin and must not leak "Development Mode" labels. The audit found: mass assignment at registration (S-01), plaintext credential logging (S-02/S-03), unconditional dev chips (D-02), persisted dev version overrides honoured in prod (D-22), `dev` role bypassing `ProtectedRoute` (S-04).

## In scope
**Backend (`API/`)**
1. `API/src/shared/middleware/validate.middleware.ts` L7: assign the parsed result — `req.body = await schema.parseAsync(req.body)` — so unknown keys are stripped (zod objects strip by default). Check the other routes using `validateRequest` (`reviews`, `auth`, `orders`, `users`, `delivery`) still pass their tests; if a schema is intentionally partial, use `.passthrough()` explicitly there.
2. `API/src/modules/auth/auth.controller.ts` L44: build the user explicitly: `User.create({ name, email, password, phone, address })`; **never** read `roles`/`status` from the body. Roles are assigned only server-side (default `['user']`).
3. Same file L65/L68: delete `console.log("body", …)` and `console.log('User found:', user)`. L66: escape the email (`email.toLowerCase()` exact match — the schema lowercases emails, `auth.model.ts` L45 — instead of `new RegExp`).
4. `API/src/shared/middleware/auth.middleware.ts` L45, L47: delete the `decoded`/`user` logs.
5. Add tests: `API/src/modules/auth/__tests__/register.security.test.ts` — POST `/api/auth/register` with `roles:["admin","dev"]` and `status:"active"` → created user has `roles:['user']`; login response contains no password; (use the existing integration-test pattern in `API/src/modules/users/__tests__/profile.integration.test.ts`, which needs `MONGO_URI` pointing to a **dedicated test DB**; the dev controller already refuses destructive ops unless DB name matches /test|e2e/).
**Frontend (`web/`)**
6. Remove `HeroCompact.tsx` L77-94 dev chip and `Home_V.tsx` L129-138 placeholder chip (or wrap in `IS_DEV` — default: delete both).
7. `DevContext.tsx` L22-34: when `!IS_DEV`, ignore stored `zom2_dev_versions` (return `{}` and do not persist). Keep dev behaviour unchanged.
8. `MainLayout.tsx` L586: render `<DevVersionSwitcher />` only when `IS_DEV` (`import { IS_DEV } from '@/core/config/app.config'`). Keep the role check inside as defence in depth.
9. `protectedRoute.tsx` L41: change to `if (IS_DEV && (appConfig.dev.bypassAuth || user?.roles?.includes('dev')))` so the `dev` role bypass cannot work in a production build. (Do **not** otherwise change guard semantics.)
10. `routes/index.tsx` L22: wrap the `dev` → `/dev` redirect with `IS_DEV` (avoids prod `/dev` → `*` → `/` loop; verify U-06).
11. Hygiene: `git rm --cached web/.env` and add `web/.env` to `web/.gitignore` (file stays on disk); keep `web/.env.example`. **Ask the user first** (it is tracked; they may rely on it) — record the answer in [../04-open-questions.md](../04-open-questions.md) Q6.

## Out of scope
New demo accounts (S02/Q1), rotating secrets, rate limiting, rewriting auth, fixing plaintext seed passwords, CI changes (note in S08).

## Files to inspect/touch
`API/src/shared/middleware/validate.middleware.ts`, `API/src/modules/auth/{auth.controller,auth.routes,auth.model}.ts`, `API/src/shared/middleware/auth.middleware.ts`, `web/src/features/home/components/hero/HeroCompact.tsx`, `web/src/pages/Home/versions/Home_V.tsx`, `web/src/core/dev/contexts/DevContext.tsx`, `web/src/shared/layout/MainLayout.tsx`, `web/src/features/auth/protectedRoute.tsx`, `web/src/app/routes/index.tsx`, `web/src/core/config/app.config.ts`, `web/.gitignore`.

## Data/API contracts to verify first
- `POST /api/auth/register` body schema `registerSchema` (`auth.controller.ts` L9-15): `name,email,password,phone?,address?`. Confirm `User` model fields `phone`, `address` exist before whitelisting (`auth.model.ts`).
- Response shape `{ success, data:{ token, user:{ id,name,email,roles } } }` must be unchanged (frontend `authSlice` consumes it).
- Run `cd API && npm test` first on a test DB to know the baseline (NOT RUN in the audit).

## Route/URL/state contracts
No URL changes. `/dev/*` remains `IS_DEV`-only and 404 via `staticwebapp.config.json`.

## Existing abstractions to reuse
`IS_DEV`/`IS_PROD` from `app.config.ts`; `validateRequest` (fix, don't replace); zod schemas already defined; `AppError`.

## Tests to add/update
- API: `register.security.test.ts` (above); a unit test for `validateRequest` stripping unknown keys.
- Web: `web/src/features/auth/__tests__/protectedRoute.test.tsx` — with `IS_DEV=false` (mock `app.config`), a user with `roles:['dev']` and `allowedRoles:['admin']` is redirected (not rendered); with a matching role it renders. `web/src/core/dev/contexts/DevContext.test.tsx` — prod ignores stored overrides. `HeroCompact` render test: text `Development Mode` absent.

## Acceptance criteria
- [ ] `POST /api/auth/register` with `roles:["admin"]` yields `roles:['user']` (test DB, automated).
- [ ] `grep -rn "console.log" API/src/modules/auth API/src/shared/middleware/auth.middleware.ts` shows no credential/token/user-doc logs.
- [ ] Production build (`npx vite build`) Home contains neither string "Development Mode" nor "add more components here" (verify with `findstr /m /c:"Development Mode" dist\assets\*.js`).
- [ ] With `localStorage['zom2_dev_versions']='{"Home":"Home_V0"}'` in a production build/preview, the default Home renders.
- [ ] A user with role `dev` cannot reach any guarded route in production preview.
- [ ] Web tests green (new), baseline failures unchanged; tsc error count ≤ baseline.

## Manual verification
`npm run build && npm run preview` (in `web/`), open `/`; inspect UI and `localStorage` override; register a user with devtools-edited payload against a **local test** API and inspect the DB doc.

## Rollback / risk
Backend changes are small and revertable per file. Risk: other routes may rely on unknown body keys passing `validateRequest` (e.g. orders, delivery) — run the whole API suite; if one breaks add `.passthrough()` to that schema only. Existing admin/owner/partner accounts in the DB are unaffected (roles stored in DB).

## Security / authorization notes
This slice *is* the security work. Never test escalation against a production DB. Do not log the exploit payload. After merge, audit existing production users for unexpected `admin/dev/owner/partner` roles (read-only query, owner-run) — record in [../04-open-questions.md](../04-open-questions.md) Q7.
