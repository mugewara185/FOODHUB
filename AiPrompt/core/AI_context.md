# FoodHub — AI Engineering Context

## 1. Project Purpose

FoodHub is a production-oriented MERN application.

The application domain is food ordering, but the deeper objective is:

> Build reusable full-stack engineering capabilities and a reusable
> developer/core framework that can be carried into future applications.

FoodHub is therefore both:
1. A real application
2. An engineering laboratory

---

## 2. Development Priority

Always prioritize:

1. Core / Core Dev
2. Reusable architecture
3. Production engineering
4. Application functionality
5. UI polish

Do not sacrifice reusable engineering quality merely to finish
domain features faster.

---

## 3. DCF / Core Dev

DCF = Dev Core Foundation.

It is the reusable developer infrastructure being developed alongside
FoodHub.

Examples:

- Structured logger
- Execution tracing
- Runtime registry
- Data factories
- Dev console
- Dynamic component/version rendering
- Debugging utilities
- State inspection
- API utilities
- Developer documentation
- Future observability capabilities

DCF should eventually be extractable and usable by another application.

IMPORTANT:

Do not create abstractions merely because they sound reusable.
Extract patterns when real application requirements demonstrate
their usefulness.

---

## 4. Current Architecture

### Frontend

web/
├── src/
│   ├── app/
│   ├── core/
│   │   ├── dev/
│   │   └── shared/
│   ├── data/
│   ├── features/
│   ├── pages/
│   ├── services/
│   └── ...

Technology:

- React
- TypeScript
- Vite
- Redux Toolkit
- Redux Persist
- MUI
- Tailwind
- React Router

### Backend

api/

- Node.js
- Express
- TypeScript
- MongoDB / Cosmos Mongo
- Zod
- Mongoose

### MCP

mcp/

Used primarily for analytics/admin capabilities.

---

## 5. Architecture Rules

Before implementing anything:

Inspect existing architecture.

Then:

Understand
→ Design
→ Implement
→ Test
→ Review
→ Refine
→ Extract reusable capability
→ Document

Do not blindly introduce a new architecture.

Prefer existing patterns when they are good enough.

---

## 6. AI Development Rules

Claude/Gemini are engineering collaborators, NOT code generators.

Before modifying code:

1. Inspect relevant files.
2. Understand existing patterns.
3. Identify reusable vs FoodHub-specific logic.
4. Explain important architectural decisions.
5. Implement a small vertical slice.
6. Run TypeScript/build/tests.
7. Report changed files and remaining issues.

Never rewrite large portions of the repository without necessity.

---

## 7. Learning Objective

For significant implementations explain:

- Why this architecture?
- What problem does it solve?
- What alternatives exist?
- What trade-offs exist?
- Which part is reusable?
- How could this pattern be extracted for another application?

The objective is to develop engineering understanding,
not merely produce working code.

---

## 8. Customer Domain Status

[Keep this section updated.]

Current goal:

Complete the customer application flow end-to-end.

Then move primarily to:

Admin + MCP + Core Dev.

Owner/Partner domains are intentionally NOT required
for the current milestone.

---

## 9. Important Existing Patterns

### Authentication

Redux is the runtime source of truth.

Auth restoration uses:

local storage token
→ /auth/me
→ Redux
→ ProtectedRoute

Authentication bootstrap uses an initialization state to prevent
route-guard race conditions.

Never log authentication tokens.

### API

Current API implementations exist under:

web/src/services/api/

Some older Axios/API abstractions are commented out and should
not automatically be revived without evaluating the current architecture.

### Redux

Redux Toolkit is used for application state.

Domain-specific slices generally belong under:

features/<domain>/...

Some older/incomplete patterns may exist and should be evaluated
before reuse.

---

## 10. Observability / Logger

DCF logger is a developer observability system.

Use structured events/traces rather than random console.log statements.

Good logging answers:

"What happened immediately before this problem?"

Never log:

- JWTs
- passwords
- sensitive credentials
- unnecessary PII

When adding logging, explain why the event is useful.

---

## 11. Current Development Principle

The application should look production-grade.

But application completeness must not cause us to neglect
Core/DCF development.

Whenever a recurring engineering problem appears, ask:

> "Is this just a FoodHub problem, or are we discovering a reusable
> capability for future applications?"

If genuinely reusable, consider extracting it into Core/DCF.

---

## 12. Before Starting Any Task

Read this file first.

Then inspect the relevant implementation files.

Do NOT assume the architecture from this document is newer than
the actual source code.

Source code is authoritative for implementation details.

This document describes architectural intent and project direction.