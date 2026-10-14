# Reusable Planning-Setup Generator System

> Inspired by and evolved from the battle-tested **FoodHub Portfolio Planning Setup** (`docs/portf/`).

This directory contains the complete framework for generating evidence-backed, dependency-aware vertical slice planning suites in any software repository.

---

## What is the `portf` Setup?

The planning setup established in [`docs/portf/`](../../docs/portf/README.md) solved the biggest failure mode of AI coding agents: **hallucinated, unstructured, all-at-once code rewrites that break existing features, increase technical debt, and fail silently**.

Instead of vague task lists, this setup generates a modular, self-contained, evidence-grounded planning suite inside the repository:

```
docs/<plan-name>/
├── README.md                  # Executive summary, product philosophy, slice roadmap
├── 00-audit.md                # Ground-truth evidence: baseline SHA, defects, contracts, debt
├── 01-vertical-slice-plan.md  # Slices ordered by user-visible outcome, Mermaid graph, rules
├── 02-slice-details.md        # Master index to individual slice briefs
├── 03-verification-matrix.md  # Verification levels, test/build baselines, command recipes
├── 04-open-questions.md       # Owner decisions (with defaults), unknowns, honest fallbacks
├── PROGRESS.md                # Live execution tracker across all slices
├── baseline/                  # Baseline screenshots & runtime observations
└── slices/                    # Self-contained implementation briefs
    ├── SLICE-00.md            # Baseline capture & safety net
    ├── SLICE-01.md            # Security / Core infrastructure gate
    ├── SLICE-02.md            # ...
    └── SLICE-XX.md            # Final regression & acceptance
```

---

## Two Ways to Use This System

We provide two complementary tools depending on your workflow:

| Tool | File | When to Use |
|---|---|---|
| **Meta-Prompt Generator** | [`planning-setup-generator.md`](planning-setup-generator.md) | Use when interacting with an AI in a conversational window (Claude, Gemini, ChatGPT). You give it your high-level project goals, and it outputs a customized, repository-tailored planning prompt. |
| **Direct Audit & Planner** | [`direct-audit-planner.md`](direct-audit-planner.md) | Use when working directly in an agentic coding environment with shell/file tools (Antigravity, Cursor, Claude Code, Gemini CLI). Paste it in, list your goals, and the agent directly writes the docs in your repo. |

---

## 7 Core Evolutions & Refinements Over Basic Planning

Through deep analysis of real-world repository audits, this setup introduces 7 critical refinements:

### 1. Pre-Existing Debt Baseline Ceiling
- **The Problem**: Real repositories rarely have 0 errors. FoodHub had 1,244 TypeScript errors and 5 failing unit tests before the audit even began. Naive AI agents panic, try to fix all 1,200 errors, or claim "build failed".
- **The Refinement**: Phase 1 captures exact baseline metrics (failing test count $F_0$, type error count $T_0$, bundle size $B_0$). Each slice enforces a **debt ceiling rule**: errors must never exceed $T_0$, and touched files must have 0 new errors.

### 2. Product Purpose Classification (Showcase vs. Commercial)
- **The Problem**: Security-focused AI agents often delete developer features (like component version switchers, mock toggles, or diagnostic logs) under the mistaken belief that all apps are strict commercial SaaS.
- **The Refinement**: Slices classify the application:
  - In a **Portfolio / Showcase**, intentional developer tooling is preserved and highlighted for recruiters and engineers.
  - Slices distinguish **Showcase Visibility** (discoverable architecture) from **Security & Safety** (eliminating role escalation, hiding secrets, guarding destructive database operations).

### 3. Strict Evidence Discipline (`[S]`, `[B]`, `[R]`, `[E2E]`)
- **The Problem**: Agents frequently write "verified that cards render properly" without ever opening a browser or running a test.
- **The Refinement**: Every finding and verification status is graded:
  - `[S]` Source-inspected (cites file & line numbers).
  - `[B]` Build-observed (compiler or linter output).
  - `[R]` Runtime-verified (process output or SSR check).
  - `[E2E]` End-to-End verified (browser automation).
  - Unexecuted checks are explicitly tagged `NOT RUN` or `NEEDS VERIFICATION`.

### 4. Anti-Hallucination UI & Honest De-Scoping Matrix
- **The Problem**: Frontend code frequently contains fabricated stats ("10,000+ orders"), fake customer reviews, or fake CTAs that only fire alert toasts without modifying state.
- **The Refinement**: The audit explicitly inventories all UI text and actions. Unbacked features are mapped to an **Honest De-Scoping Decision**:
  - Wire to a real backend endpoint.
  - Derive a truthful alternative from existing APIs (e.g. "Menu Highlights" instead of "Best Sellers").
  - Truthfully label as simulated/demo in the UI.
  - Cleanly delete the feature.

### 5. Self-Contained Slice Briefs (`SLICE-XX.md`)
- **The Problem**: Slices that say "implement what we talked about earlier" break when handed to a fresh AI agent in a new context turn.
- **The Refinement**: Every slice brief has its own complete header, contracts, files to inspect vs touch, test scenarios, and responsive acceptance criteria (360px, 768px, 1280px). An agent can execute `SLICE-03.md` with zero memory of previous chats.

### 6. Shell & Tooling Safety
- **The Problem**: Recursive file searches or heavy string scans over compiled bundles can crash or freeze AI agents.
- **The Refinement**: Prescribes shell-aware, non-destructive commands (`git ls-files`, `findstr /m` on Windows, `grep -l` on Unix), scratch output isolation outside tracked folders, and awareness of composite TypeScript project flags (e.g. avoiding `--incremental false` TS6379).

### 7. Zero Code Alteration Guarantee
- During the entire audit and planning phase, the agent is strictly prohibited from modifying application code. Only documentation under the target directory is generated.

---

## How to Execute Slices (Implementation Phase)

Once the planning suite is generated in `docs/<plan-name>/`:

1. **Review**: Inspect `00-audit.md` and approve any open decisions in `04-open-questions.md`.
2. **Execute First Slice**: Provide `slices/SLICE-00.md` to an agent. Instruct it:
   > *"Implement SLICE-00 only. Read its preconditions, touch only the listed files, fulfill the acceptance criteria, and run the commands in 03-verification-matrix.md."*
3. **Verify & Update Progress**:
   - Compare test and typecheck results against baseline numbers.
   - Update `PROGRESS.md` with commit SHAs and verified levels.
4. **Proceed Sequentially**: Move to the next slice in the dependency chain (e.g. S01, then S02/S03).
