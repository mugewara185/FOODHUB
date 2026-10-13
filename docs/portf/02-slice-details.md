# 02 — Slice details (index)

Each slice is a **self-contained** document in [`slices/`](slices/). A fresh agent can implement a slice by reading only that file plus [00-audit.md](00-audit.md) for evidence IDs (D-xx defects, S-xx security findings, U-xx unknowns, B-xx blockers).

| ID | Doc | Outcome | Size | Depends on | Backend change |
|---|---|---|---|---|---|
| S00 | [SLICE-00](slices/SLICE-00.md) | Baseline screenshots + characterization tests that pin today's defects, so later slices flip them deliberately | S | — | no |
| S01 | [SLICE-01](slices/SLICE-01.md) | Production safety gate: privilege-escalation fix on register, no credential/token logging, dev routes/chips/overrides gated, dev docs not shipped | M | S00 | **yes (required)** |
| S02 | [SLICE-02](slices/SLICE-02.md) | Honest "Explore FoodHub" entry and static `/tour` of customer + role features with real public deep links | M | S01 | no |
| S03 | [SLICE-03](slices/SLICE-03.md) | MUI v7 `Grid` (`size`) fix, uniform restaurant card, `SafeImage` reset | M | S00 | no |
| S04 | [SLICE-04](slices/SLICE-04.md) | URL ↔ Redux ↔ filters/search contract; `/search` redirect; fixes D-10…D-13 | L | S03 | no |
| S05 | [SLICE-05](slices/SLICE-05.md) | Home truthfulness: fabricated sections removed/rebuilt from real data; real add-to-cart | L | S03, S04 | no |
| S06 | [SLICE-06](slices/SLICE-06.md) | Complete fetch, client-side "Show more" batching, polished listing states | M | S04 | optional (separate slice) |
| S07 | [SLICE-07](slices/SLICE-07.md) | Home visual redesign, consistent sections, restrained motion, responsive 320-1440, cleanup | L | S03, S05 | no |
| S08 | [SLICE-08](slices/SLICE-08.md) | Regression + security boundary + journey checks; README/runbook/CI truthfulness | M | S01-S07 | no (verifies S01) |

Required sections in every slice doc: goal, why, dependencies, in/out of scope, files, contracts to verify, route/URL/state contracts, reuse, tests, acceptance criteria, manual verification, verification level, rollback/risk, size, backend flag, security notes.

Dependency graph and ordering rationale: [01-vertical-slice-plan.md](01-vertical-slice-plan.md).
