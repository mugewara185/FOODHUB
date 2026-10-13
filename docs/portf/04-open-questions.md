# 04 — Open questions, unknowns, blockers

Defaults are baked into the slices so implementation can proceed; answers below only change scope. Status values: `UNKNOWN`, `NEEDS VERIFICATION`, `BLOCKED`, `DECISION`.

## Decisions needed (owner)

| ID | Question | Default used in the plan | Affects |
|---|---|---|---|
| Q1 | Role demo accounts: static tour only, or live demo accounts for owner/partner/admin? | **Static tour only.** Live accounts need their own slice: separate demo DB, rotated credentials, rate limiting, server-enforced read-only actions | S02 |
| Q2 | Keep "Menu highlights" on Home (3 extra `GET /restaurants/:id`) or remove the section? | Keep | S05 |
| Q3 | Add an optional "Free delivery" shelf (only if ≥3 restaurants have `deliveryFee===0`)? | Skip | S05 |
| Q4 | Dish-level search? No API exists. | **Dropped**; `/search` redirects to `/restaurants?q=` (name, cuisine, tags) | S04 |
| Q5 | Promo codes: remove, or relabel as "demo codes"? | **Remove** (needs U-05 before any relabel) | S05 |
| Q6 | Untrack `web/.env` (currently tracked, contains `VITE_DEV_BYPASS_AUTH=true`)? | Ask; recommended yes (`git rm --cached`, add to `.gitignore`, keep `.env.example`) | S01 |
| Q7 | After S01, will the owner audit existing production users for unexpected `admin/dev/owner/partner` roles (read-only, owner-run)? | Recommended yes | S01 |
| Q8 | Add a typecheck/test job to CI and align deploy branches? CI currently deploys `main`/`dev/main`, not `dev/development`, and runs no tests | Propose only, do not change without approval | S08 |
| Q9 | Is a hosted instance live, and what is its URL/branch? README says "not yet live". Screenshots/README demo claims depend on this | Unknown → README states local run only | S08 |

## Unknowns (audit §13 IDs plus new)

| ID | Item | Status |
|---|---|---|
| U-01 | Is a hosted instance live? Which branch deploys? | `UNKNOWN` |
| U-02 | Production DB contents (restaurant count, `isFeatured`, images, reviews, seeded accounts) | `UNKNOWN` |
| U-03 | Browser rendering of D-01 / D-15 / D-16 and card heights | `NEEDS VERIFICATION` (S00) |
| U-04 | S-01 exploitability on a live DB | `NEEDS VERIFICATION` on a **test** DB only |
| U-05 | Backend discount/coupon handling at order creation | `UNKNOWN` |
| U-06 | Whether a `dev`-role `/dev` redirect loops in production | `NEEDS VERIFICATION` |
| U-07 | Whether `public/assets/**` are usable real photographs | `NEEDS VERIFICATION` |
| U-08 | Whether the production bundle ships mock factories/faker/dev docs (chunk names seen; string scan cancelled) | partially observed |
| U-09 | Real `pagination` shape and behaviour of `?page=N` beyond the last page | `NEEDS VERIFICATION` (S06) |
| U-10 | Login redirect-back (`from`) behaviour after a guarded route | `NEEDS VERIFICATION` (S08) |
| U-11 | Contents/health of `web/e2e.ts` | `UNKNOWN` (not read in the audit) |

## Blockers

| ID | Blocker | Honest fallback |
|---|---|---|
| B-01 | No popularity / best-seller / order-count data | S05 "Menu highlights", no badges/counts |
| B-02 | No cross-restaurant recent-reviews endpoint (reviews exist only per restaurant for delivered orders) | Remove testimonials |
| B-03 | Server filters limited to `cuisine/search/city/page/limit` | Client-side batching (S06) |
| B-04 | Role demo accounts need a product/security decision | Static tour (Q1) |

## Conflicts between source goals and the repository (repo wins)

| Goal-doc claim | Repo reality | Resolution |
|---|---|---|
| Home shows real popular dishes / reviews / offers | All fabricated or mock-factory backed | Remove/replace (S05) |
| "Hosted" demo | README: not yet live; CI branches differ | Q9, S08 |
| Server-side batch loading | Backend has page/limit only, with no filters and no limit cap | Client-side default (S06) |
| `docs/ai/project_instruction_0.txt`, `development-working-flow-conversation-format` | Absent | Equivalents: `.agents/workflows/instructions.md`, `AiPrompt/core/core-instructions.md` |
| Remote `FOODHUB.git` | Checkout remote is `Zom2.git`; identical tip `f9bc008` | Treated as the same repo |
