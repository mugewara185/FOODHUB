# FoodHub — AI Handoff Document
> Paste this file into a fresh chat to restore full context.
> Generated: 2026-09-25 | Commit: `0b34297d404b1f68f9c25fcf50423cb0534e2d42` | Branch: `dev/main`

---

## Project Location
```
c:\Aa\vs_Code\mern projects\zom2
```
Corpus: `mugewara185/Zom2`

## Key Documents
| File | Purpose |
|------|---------|
| `docs/uiCompletionPlan.md` | Master plan — single source of truth |
| `docs/prompts/U0.md` | Session prompt: env gate |
| `docs/prompts/U1.md` | Session prompt: admin orders real data |
| `docs/prompts/U2.md` | Session prompt: socket fix + notification |
| `docs/prompts/U3.md` | Session prompt: owner dashboard |
| `docs/prompts/U4.md` | Session prompt: partner history/earnings |
| `docs/prompts/U5.md` | Session prompt: fleet sidebar + risk alerts |
| `docs/prompts/U6.md` | Session prompt: review route fix |
| `docs/prompts/U-Notification.md` | Session prompt: bell refinement |
| `docs/deploymentRunbook.md` | Azure SWA + Render + Atlas deploy steps |
| `docs/handoff.md` | This file |

## Workflow Contract
- **Claude** (or planning AI): produces plans, patches, session prompts. Writes documents only.
- **Gemini** (execution AI on user's Windows machine): reads session prompt, applies code edits, runs verify commands, reports raw output. Never commits.
- **Human**: reviews Gemini's Phase 4 report, commits at session boundaries, deploys when all sessions pass.
- **Chat AI** (reviewing): reads Gemini's raw report and confirms pass/fail before human commits.

## Gemini Discipline Rules (enforce in every session prompt)
1. **Editor tool ONLY** for source writes. No `node -e`, `python -c`, `base64`, here-strings, `Set-Content`, shell redirection to source files.
2. **Do NOT commit.** Leave the working tree dirty for human review.
3. **Raw output only** in reports. No narrative summaries.
4. **Only touch files in the declared scope list** for that session.
5. **STOP conditions must be explicit** — if a condition fires, stop and report; don't work around it.
6. **Report format is enumerated** — every Phase 4 item must be present, in order.

## Session Queue

| ID | Title | Status | Dependencies |
|----|-------|--------|-------------|
| U0 | Env and Data Source Gate | **pending** | none |
| U1 | Admin Orders Real Data | **pending** | U0 |
| U2 | Socket Disambiguation + Notification Fix | **pending** | U0 |
| U3 | Owner Dashboard Real Data | **pending** | U0 |
| U4 | Partner History/Earnings | **pending** | U0, U2 |
| U5 | Fleet Sidebar + Risk Alerts | **pending** | none |
| U6 | Review Route Registration | **pending** | U0 |
| U-Notification | Bell Refinement | **pending** | none (parallel with U1) |

**Next session to run: U0** — gates everything else.

## Plan Patches Applied (resolved)

| Patch | Issue | Resolution |
|-------|-------|-----------|
| 1 — U6 payload | Plan documented wrong payload `{orderId, restaurantId, rating, comment}` | Corrected to `{orderId, restaurantRating, partnerRating, comment}` matching `review.controller.ts:19`. Runtime code (`OrderReview.tsx`, `orderApi.ts`) was already correct. Real bug: missing `/orders/:id/review` route in `routes/index.tsx`. |
| 2 — U2 socket disambiguation | Section 5 listed both `order:status_changed` and `order_status_update` as candidates | Disambiguated: `order_status_update` is bound at `App.tsx:70`. `updateOrderStatusLocally` reducer already updates `items[]` at `orderSlice.ts:274`. Mandatory grep step added to U2 prompt. |
| 3 — P1 items with no session | `/profile`, `/favorites`, `/partner/profile`, `/admin/restaurants/add`, `/admin/profile`, `/admin/ai/investigations/:id` had no session | Added to Section 9 "P1 items dropped from scope" table. Reason: not in demo script; deferred to future polish pass. AI integration deferred — not cost-free. |

## Critical Architecture Facts

| Fact | Source |
|------|--------|
| `VITE_DATA_SOURCE=api` is the master data switch | `app.config.ts:32` |
| Admin orders is a static 2-row mock | `orders.provider.ts:52` |
| `updateOrderStatusLocally` already updates `items[]` | `orderSlice.ts:274-277` |
| `order_status_update` bound to `updateOrderStatusLocally` | `App.tsx:70`, `socket.ts:201` |
| Review payload is correct in code | `OrderReview.tsx:33`, `orderApi.ts:209` |
| `/orders/:id/review` route NOT registered | `routes/index.tsx` — U6 fixes this |
| `/admin/delivery` orphaned (no sidebar link) | `AdminLayout.tsx:59-104` — U5 fixes |
| Admin Layout dead notification Menu | `AdminLayout.tsx:409-447` — U5 removes |
| `VITE_SOCKET_URL` must be set for cross-origin deploy | `socket.ts:33` |
| Redux persist whitelist: `['cart', 'notifications']` | `Store_V.ts:57` |

## File Tree (docs/ additions)
```
docs/
  uiCompletionPlan.md       (master plan, patched)
  deploymentRunbook.md      (new)
  handoff.md                (this file)
  prompts/
    U0.md
    U1.md
    U2.md
    U3.md
    U4.md
    U5.md
    U6.md
    U-Notification.md
```
