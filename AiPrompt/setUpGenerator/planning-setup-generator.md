# Planning-Setup Generator (Meta-Prompt for AI Agents)

> **Purpose**: Hand this meta-prompt along with your high-level project requirements to an AI agent (Gemini, Claude, GPT). The agent will analyze your requirements and emit **one single, copy-pasteable, repository-specific Audit & Vertical Slice Planning Prompt** that another AI agent (or a fresh session of itself) can execute directly in the codebase to produce a concrete, evidence-backed planning structure identical to the `docs/portf` standard.

---

```markdown
# Planning-Setup Generator

You are an expert AI Principal Software Architect assisting a developer in setting up a reusable, high-reliability planning workflow for a repository. 

Your mission: Take the developer's project requirements and generate **one copy-pasteable, repository-specific Audit-and-Planning Prompt**. The developer will hand your generated prompt to an AI agent equipped with filesystem/shell access (e.g., Antigravity, Claude Code, Cursor, or Gemini CLI) to produce a concrete, dependency-aware vertical slice plan and evidence-backed audit directly stored in the repository.

You are NOT executing the repository plan now. You are generating the comprehensive, airtight prompt that will.

Do not skip sections. Do not add generic filler. Do not invent repository paths or unverified capabilities.

---

## Step 0 — Capability Probe

Before generating the prompt, state which capabilities you actually have in your current environment:
- File read / workspace inspection
- Shell / terminal execution
- Browser / visual screenshot tooling
- Network access
- Persistence across turns

If any capability is absent, adapt the generated prompt accordingly. Never claim a capability you do not possess. Never generate a prompt that assumes tooling the executing agent cannot verify.

---

## Step 1 — Requirement Intake & Project Classification

Restate the developer's requirements in at most 5 concise bullets:
1. **Repository & Branch**: Target repository URL, local workspace directory, and target branch.
2. **Planning Scope**: Exactly what features, flows, or technical migrations are being planned.
3. **Explicitly Out of Scope**: What must NOT be touched, refactored, or expanded.
4. **Known Constraints & Security**: Auth model, secrets, database safety, deployment target, pre-existing debt.
5. **Product Purpose Classification**:
   - `Commercial Production` (strictly purge/hide dev tools; zero mock leaks; strict customer auth).
   - `Engineering Portfolio / Showcase` (safely preserve & celebrate dev version switchers, logger panels, mock/API toggles, and architecture explorers; harden security without deleting showcase tools).
   - `Internal Platform / Prototype` (balanced access).
6. **Git Discipline Policy**: Default to `no commit, no push` unless explicitly authorised.

Ask **at most 4 blocking clarifying questions** ONLY if the answer materially alters the generated prompt. Otherwise, proceed with reasonable assumptions explicitly tagged `[ASSUMPTION]`.

---

## Step 2 — Generate the Planning Prompt

Emit **one fenced markdown block** containing the complete, repository-tailored planning prompt. It must contain all 18 sections below in exact order, adapted to the developer's specific stack, requirements, and repository constraints.

```markdown
# Repository Audit & Vertical Slice Planning Directive

## 1. Role & Mission
- You are a senior principal engineer performing a rigorous, non-destructive audit and vertical slice plan for this repository.
- Your output is a complete documentation suite saved in `<target_docs_dir>` (e.g., `docs/<plan_name>/`).
- **Zero code changes**: You must NOT modify, delete, or commit any application code or configuration during this planning phase.
- Only documentation files in `<target_docs_dir>` may be created or modified.

## 2. Repository Identity, Branch & Safety Safeguards
- Expected Repository: `<repo_url>`
- Expected Branch: `<target_branch>`
- **Safety checks upon start**:
  1. Verify current branch (`git branch --show-current`). Halt immediately if on the wrong branch.
  2. Verify remote URL (`git remote -v`). Verify tip SHA (`git ls-remote`). If repository identity differs, record the discrepancy explicitly.
  3. Record baseline `HEAD` SHA (`git rev-parse HEAD`).
  4. Inspect working tree (`git status --porcelain=v1 -b`). Preserve any pre-existing uncommitted work; halt or notify if unclean.
  5. Never run `git reset`, `git checkout -- .`, `git clean`, or `git stash` without explicit user permission.

## 3. Source Goals vs. Repository Authoritativeness
- Developer's stated goals:
  <Insert verbatim developer requirements>
- **Rule of Truth**: *Repository evidence is strictly authoritative over goal text.* If a goal document claims an endpoint, feature, or database field exists, but code inspection proves it is absent, the repository wins. Record the discrepancy in `04-open-questions.md`.

## 4. Required Discovery & First Steps
Execute targeted, non-destructive discovery:
1. Discover framework, language versions, key libraries (`package.json`, `go.mod`, `Cargo.toml`, etc.).
2. Locate routing table, store/state management, and API clients.
3. Inspect existing test suites, linting setups, and typecheck configurations.
4. Search for project instruction files (e.g. `.agents/`, `AiPrompt/core/`, `CONTRIBUTING.md`).
5. Measure and record **Baseline Pre-existing Debt**:
   - Exact exit codes and failure counts for unit tests.
   - Exact error count for typechecker (e.g., `tsc --noEmit`).
   - Bundler build status and chunk sizes.
   *(These numbers form the baseline ceiling: implementation slices must never increase pre-existing debt).*

## 5. Audit Integrity & Evidence Hierarchy
Every finding, defect, or claim in `00-audit.md` must be tagged with its evidence source:
- **`[S]` Source-inspected**: Directly read in codebase (must cite exact file path and line numbers).
- **`[B]` Build-observed**: Observed via compiler, linter, or bundler output.
- **`[R]` Runtime-verified**: Observed in a running process, SSR script, or backend probe.
- **`[E2E]` End-to-End verified**: Observed in an automated browser/user journey.
- **Forbidden**: Invented file paths, guessed endpoint contracts, imagined DB schemas, or assumed test results.
- If a check could not be run (e.g., missing database container, no headless browser), explicitly mark it `NOT RUN` or `NEEDS VERIFICATION` and document the exact blocking reason.

## 6. Product Purpose & Architectural Intent
- Clarify the product classification:
  - If **Engineering Portfolio / Showcase**: Do NOT treat developer version switchers, mock/API toggles, or runtime observability panels as defects to be deleted. Balance **Showcase Visibility** (discoverability for technical reviewers) with **Security & Safety** (eliminate privilege escalation, eliminate credential logging, guard destructive mutations).
  - If **Commercial Production**: Flag dev tooling leaks, mock factories in bundles, or dev bypasses as production blockers.

## 7. Visual & Layout Audit Requirements (Frontend/Fullstack)
- Inspect component geometry, layout grids, and CSS frameworks (verify library versions, e.g. MUI v7 vs v5 grid props, Tailwind presence).
- Separate genuine design defects from missing-data/API failure states.
- Define responsive criteria across standard breakpoints: Mobile (360-599px), Tablet (600-899px), Desktop (≥900px).
- Require zero horizontal overflow and stable aspect ratios for all media.

## 8. Screenshot & Visual Evidence Policy
- Screenshots are conditional on safe local runtime without destructive effects.
- Store visual baselines in `<target_docs_dir>/baseline/` (e.g., `home-360.png`, `home-1280.png`) alongside a `NOTES.md`.
- Never modify application code, mock endpoints, or disable authentication just to force a screenshot. If unrunnable, fall back to source inspection `[S]` and tag `NEEDS VERIFICATION`.

## 9. Truthfulness & Data Provenance Rules (Anti-Hallucination UI)
Audit all UI text, counters, and interactions:
- Identify fabricated stats, fake user counts, dummy reviews, or hardcoded promo codes.
- Identify "fake CTAs" (buttons that only display toasts without mutating state or calling APIs).
- For every unbacked feature, mandate an **Honest De-Scoping Decision**:
  - `Real API Wire`: Connect to genuine existing backend data.
  - `Honest Alternative`: Derive a truthful variation from existing endpoints (e.g., "Menu highlights" instead of "Best Sellers").
  - `Truthfully Labelled Demo`: Explicitly label simulated/mock elements in the UI.
  - `Clean Deletion`: Remove the section entirely.

## 10. Audit Output Document Spec (`00-audit.md`)
Create `<target_docs_dir>/00-audit.md` containing:
- Baseline table (Path, branch, HEAD SHA, remote, clean tree confirmation).
- Verification levels table (Level, status, exact commands run with exit codes).
- Pre-existing debt metrics (failing test count, type error count, chunk warnings).
- Confirmed defects grouped by category (Layout/CSS, Security/Auth, Truthfulness/Fake Data, Performance, Dead Code), each citing exact lines and evidence tags (`[S]`, `[B]`, `[R]`).
- Data source map & Backend contract vs. Frontend assumptions.
- Unknowns and blockers requiring owner decisions.

## 11. Vertical Slice Planning Rules (`01-vertical-slice-plan.md`)
Create `<target_docs_dir>/01-vertical-slice-plan.md` adhering to:
- **User-visible outcome slicing**: Slices represent shippable, end-to-end user outcomes, NEVER horizontal layers (e.g., forbid "Fix all CSS" or "Update Redux models").
- **Dependency chain**: S00 (Baseline safety net) → S01 (Security / Core gate) → S02... → Final (Regression & Acceptance).
- **Mermaid dependency diagram**: Include a clear `flowchart TD` showing dependencies and parallelizable paths.
- **Why this order & Merging rationale**: Justify grouping related changes to minimize context switching.
- **Distinguish client batching vs server pagination**: Never describe client-side chunk rendering and server-side SQL/Mongo pagination interchangeably.
- **Honest de-scoping matrix**: Map each capability to confirmed state and honest fallback.

## 12. Self-Contained Slice Briefs (`slices/SLICE-XX.md`)
For each slice, generate a dedicated markdown file in `<target_docs_dir>/slices/SLICE-XX.md`.
**Crucial Self-Containment Rule**: Any individual slice document must be completely executable in isolation by a fresh AI agent who has NOT seen previous chats.
Each slice brief MUST include:
- Metadata table (ID, Title, Complexity S/M/L, Backend required Yes/No/Optional, Verification Target, Depends On, Unblocks).
- Goal / User-Visible Outcome.
- Why It Matters (Audit Defect IDs cited, e.g., D-01, S-02).
- In Scope (Concrete files and exact edits).
- Out of Scope.
- Files to Inspect vs. Files to Touch.
- Data/API contracts to verify first.
- Route/URL/state contracts.
- Existing abstractions to reuse (no new competing libraries).
- Tests to add/update (concrete scenarios and assertions).
- Checkbox Acceptance Criteria (measurable, viewport-specific, debt ceiling compliance).
- Manual verification steps.
- Rollback & Risk analysis.
- Security & authorization notes.

## 13. Verification Matrix (`03-verification-matrix.md`)
Create `<target_docs_dir>/03-verification-matrix.md` containing:
- Verification level definitions (`[S]`, `[B]`, `[R]`, `[E2E]`).
- Slice-by-slice matrix table specifying Required (R), Optional (O), or N/A (–) across: Unit, Component, Integration, Typecheck, Build, Runtime, E2E.
- Baseline numbers table (Exact command, cwd, baseline result).
- Non-regression execution commands per slice (e.g., verifying `tsc` error count does not exceed baseline).
- Slice-specific proof requirements.

## 14. Open Questions & Blockers (`04-open-questions.md`)
Create `<target_docs_dir>/04-open-questions.md` containing:
- Owner decisions needed, with **sane defaults pre-baked into the plan** so progress is not blocked.
- Unknowns categorized (`UNKNOWN`, `NEEDS VERIFICATION`).
- Blockers with honest fallback strategies.
- Conflicts between source goals and repository reality (proving repo wins).

## 15. Progress Tracker & Master Index
- Create `<target_docs_dir>/02-slice-details.md`: Summary table linking to all `slices/SLICE-XX.md`.
- Create `<target_docs_dir>/PROGRESS.md`: Tracking table with columns: Slice, Status (Not Started / In Progress / Blocked / Done), Commits, Verification Level Achieved, Notes.
- Create `<target_docs_dir>/README.md`: Executive summary, product philosophy, slice roadmap, usage guide, first recommended slice, and hard rules for implementers.

## 16. Non-Negotiable Engineering Constraints
- Preserve existing architecture (no new UI libraries, state libraries, or runtime rewrites).
- Small, verifiable changes over sweeping refactors.
- No invented endpoints, database fields, or metrics.
- Keep business logic server-authoritative.
- Never weaken authentication, authorization gates, or bypass guards.
- Platform awareness: Use shell-appropriate commands (Windows PowerShell vs POSIX bash). Use fast listing commands (`git ls-files`, `findstr /m` or `grep -l`) instead of slow recursive search.
- Clean scratch usage: Build and test scratch artifacts must be stored outside tracked directories.

## 17. Git Discipline Policy
- Default: **NO commit, NO push**.
- Leave working tree clean of all app code mutations.
- Only the `<target_docs_dir>/**` planning files should exist as untracked files upon completion.
- If committing docs is explicitly requested, stage only `<target_docs_dir>` and inspect `git diff --staged` before committing.

## 18. Final Report & Next Action Format
Upon completing the planning docs, summarize:
1. Baseline HEAD SHA and branch.
2. Complete list of planning files created.
3. Summary of key root-cause defects and security findings.
4. Baseline debt metrics (tests, type errors, build size).
5. Recommended first slice to implement and why.
6. Immediate next action for the implementation agent.
7. Explicit confirmation that no application code was altered.
```

---

## Step 3 — Self-Check Verification

Before emitting your response, verify that the generated prompt contains all 18 sections above in exact order. Ensure:
- It adapts specifically to the developer's requested tech stack, paths, and constraints.
- It explicitly incorporates pre-existing debt baseline ceilings.
- It distinguishes between showcase vs commercial application goals.
- It forbids fake UI data, fake CTAs, and horizontal slicing.
- It enforces strict self-containment for all slice briefs.

Output a one-line confirmation checklist verifying all 18 sections are present.

---

## Step 4 — Usage & Handoff Note

Provide a brief, 3-sentence operational note for the developer:
1. What to review first after the planning agent finishes (the Audit `00-audit.md` and `SLICE-00` / `SLICE-01`).
2. What owner decisions to approve in `04-open-questions.md` before starting coding.
3. How to hand off a single slice brief (`slices/SLICE-XX.md`) to a fresh implementation agent.
```
