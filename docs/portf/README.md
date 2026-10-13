# FoodHub — Portfolio audit & vertical slice plan

Planning/documentation only. **No application code was changed; nothing was committed or pushed.**

- Repository: `https://github.com/mugewara185/FOODHUB.git` (local checkout remote: `Zom2.git`, identical tip), branch `dev/development`
- Baseline SHA: `f9bc00851afadaf2934188cda27061da005b96e8` (clean tree at audit time)
- Goals covered: (1) Home page — lively, engaging, production-quality; (2) portfolio readiness. The repository is authoritative over the goal documents.

## Index

| File | Purpose |
|---|---|
| [00-audit.md](00-audit.md) | Evidence: defects D-01…D-22, security findings S-01…S-09, data-source map, backend contract, unknowns |
| [01-vertical-slice-plan.md](01-vertical-slice-plan.md) | Slice order, dependency graph, layout/acceptance targets, pre-made decisions |
| [02-slice-details.md](02-slice-details.md) | Index to the self-contained slice docs |
| [slices/SLICE-00.md](slices/SLICE-00.md) … [SLICE-08.md](slices/SLICE-08.md) | One implementation brief per slice |
| [03-verification-matrix.md](03-verification-matrix.md) | Required checks per slice, baseline numbers, exact commands |
| [04-open-questions.md](04-open-questions.md) | Owner decisions, unknowns, blockers |

## Portfolio Product Philosophy & Showcase Goals

FoodHub is primarily an **engineering portfolio and demonstration platform**, not an unrestricted commercial venture. Its primary audience includes technical recruiters, engineering leaders, and fellow developers.

The application has a deliberate dual mission:
1. **A polished, usable, production-quality food-ordering experience** that proves full-stack craftsmanship.
2. **A showcase of modern full-stack engineering capabilities**, including architectural patterns, developer tooling, observability (structured logging), mock/API switching, component version switching (`DevVersionRenderer`), and robust state management.

### Key Architectural Guidelines
- **Development features are intentional showcase capabilities.** Features like the Dev Version Switcher, runtime logger controls, mock data simulator toggles, and developer documentation are core portfolio assets. They must **not** be purged, hidden, or disabled merely to imitate a commercial production deployment.
- **Showcase Visibility vs. Security & Safety**:
  - **Showcase Visibility**: Visitors, recruiters, and developers should easily discover and interact with the application's technical capabilities. The Home page should present the product professionally while offering an intentional, elegant way to explore architecture and developer tools.
  - **Authorization & Access Control**: Users cannot perform unauthorized actions or self-assign privileged roles (e.g. S-01 registration escalation).
  - **Secret Protection**: Private API keys, database credentials, and production secrets must remain strictly protected and uncommitted.
  - **Operational Safety**: Dangerous or destructive server-side operations (e.g. resetting production databases) must be protected, while read-only development exploration tools remain open for review.
- **Never solve a security or visual polish problem by indiscriminately deleting developer UI.** Future implementation slices must evaluate development features against this showcase goal.

## Slice order

`S00 → S01 → S02` · `S00 → S03 → S04 → S05` · `S04 → S06` · `S03 + S05 → S07` · `S01 + S02 + S06 + S07 → S08`

| ID | Title | Size | Outcome |
|---|---|---|---|
| S00 | Baseline capture & safety net | S | Pinned evidence, characterization tests, baseline screenshots |
| S01 | Production safety gate (**backend change required**) | M | Hardened security boundaries (no role escalation, no credential logs, safe dev endpoints) while preserving showcase dev tooling |
| S02 | Visitor showcase & guided tour | M | Structured guided tour of customer flow and engineering architecture |
| S03 | Layout foundation: Grid v7, card, SafeImage | M | Responsive grid layout, uniform card geometry, robust image fallback |
| S04 | Listing contract: URL ↔ Redux ↔ filters/search | L | Shareable URL filter state, search correctness, filter integrity |
| S05 | Home truthfulness | L | Data provenance: real API data or honest fallbacks; real add-to-cart |
| S06 | Batch loading & listing polish | M | Client-side "Show more" batches, truthful counts, resilient state handling |
| S07 | Home visual redesign & responsive polish | L | Lively responsive Home on real data; elegant showcase discoverability |
| S08 | Regression & portfolio acceptance | M | Full visitor journey, responsiveness, and security verification |

## How to use

1. Read this README, then [00-audit.md](00-audit.md) §1-§3 and §13.
2. Implement **one slice at a time, in dependency order**. Open only that slice file; it lists goal, scope, files, contracts to verify first, tests, acceptance, rollback and security notes.
3. Before relying on any contract, verify it (each slice has a "contracts to verify first" section). Do not invent endpoints, fields, reviews, discounts or metrics.
4. After each slice, run the commands in [03-verification-matrix.md](03-verification-matrix.md) and compare with the baseline. State the verification level reached; never claim runtime/E2E results that were not executed.
5. Record decisions in [04-open-questions.md](04-open-questions.md).

## Recommended first slice

**S00** (low risk; creates the baseline and characterization tests). **S01** is the first user-impacting slice and a **security blocker**: the audit found, from source inspection only, that registration can likely mint `admin` (S-01) — verify on a test DB, never on production.

## Hard rules for the implementer

- No fake Add to Cart; no hard-coded testimonials/stats/promos presented as real.
- Strictly enforce authorization, credential safety, and secret protection; preserve and showcase development tooling (version switcher, logger observability, mock simulator) safely without exposing destructive operations or leaking credentials.
- No new UI framework; keep Redux and the existing API architecture.
- Preserve unrelated working-tree changes; don't commit or push unless asked.

## Baseline snapshot

Unit tests 33 pass / 5 fail (pre-existing); `tsc` 1,244 errors (pre-existing); build exit 0 with a 2,537 kB main chunk; backend tests, browser and E2E **not run**. Details: [03-verification-matrix.md](03-verification-matrix.md).
