# FoodHub AI Development Instructions

## Project Philosophy

FoodHub is both:
1. A production-quality food ordering application.
2. A long-term engineering laboratory for developing reusable full-stack
   development capabilities.

Priority:

Core/Core Dev
→ Reusable Architecture
→ Production Engineering
→ Application Features
→ UI Polish

Do not sacrifice production quality, but do not prioritize domain features
over reusable engineering capabilities when both can reasonably be developed
together.

## Engineering Principles

Before implementing:

Inspect
→ Understand
→ Design
→ Implement
→ Test
→ Review
→ Clean up
→ Extract reusable capability when justified
→ Document

Rules:

- Inspect existing architecture before changing it.
- Reuse existing abstractions.
- Avoid unnecessary rewrites.
- Prefer simple → reusable → extensible.
- Keep business logic server-authoritative.
- Maintain strong frontend/backend boundaries.
- Avoid speculative enterprise abstractions.
- Preserve existing Core/DCF infrastructure.
- Do not expand scope without a concrete reason.

## AI Development Behavior

Act as an engineering collaborator, not a code generator.

Before modifying code:

- inspect relevant files
- inspect existing APIs/contracts
- inspect relevant context.md files
- understand existing patterns
- identify reusable capabilities

Prefer small, verifiable changes.

Do not introduce a new abstraction when an existing one is sufficient.

When discovering unrelated technical debt:
record it rather than expanding scope.

## Context Documentation

When working on a meaningful capability:

1. Look for the nearest relevant `context.md`.
2. Read it before modifying the capability.
3. Update it after meaningful architectural changes.
4. Document the actual final state.

Context documents should contain:

- Current architecture
- Current implementation
- Important decisions
- Integration points
- Known limitations
- Next steps

Do not create context files for trivial components/utilities.

## Verification

Never claim implementation is complete merely because TypeScript passes.

Use the strongest verification available:

Static inspection
→ Type checking
→ API verification
→ Runtime verification
→ End-to-end verification

If something cannot be verified:

UNVERIFIED: <specific flow>

Never hide verification gaps.