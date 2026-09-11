---
description: Core Development Philosophy
---

## Core Development Philosophy

This project is not intended to be a one-time food-ordering application or merely a portfolio UI implementation.

The primary objective is to use the application as a **long-term full-stack engineering laboratory** for developing reusable, production-grade development patterns, infrastructure, utilities, architectural techniques, and developer tooling that can be consistently applied to future applications, including enterprise and real-world business applications.

### Priority Hierarchy

Always prioritize development in this order:

1. **Core / Core Dev**
2. **Reusable architecture and developer capabilities**
3. **Production-grade engineering practices**
4. **Application/domain functionality**
5. **UI polish and domain-specific extras**

The application itself should look and behave like a credible production-level application, but domain functionality must never unnecessarily take priority over building reusable engineering capabilities.

### Core / Core Dev

Whenever implementing a feature, actively distinguish between:

* **Application-specific functionality**
* **Reusable development capability**

Prefer extracting reusable capabilities when doing so provides genuine long-term value.

Examples include:

* API client architecture
* authentication/session infrastructure
* authorization/RBAC
* request/response handling
* DTOs and normalization
* validation
* error handling
* logging
* configuration management
* environment management
* data factories
* database seeding
* mock/API switching
* reusable Redux patterns
* async state management
* caching
* pagination
* filtering/sorting
* file handling
* notifications
* audit logging
* analytics infrastructure
* MCP tooling
* observability
* testing infrastructure
* reusable service-layer patterns
* developer utilities
* feature flags
* permission systems
* background jobs
* event-driven patterns
* rate limiting
* security utilities
* API contracts
* reusable frontend/backend integration patterns

These should be designed so they can eventually be reused or adapted for a different application domain.

### Production-Level Application

Although Core/Core Dev has priority, the resulting FoodHub application should still feel like a **real production application**.

Avoid intentionally building toy implementations merely because the project is being used for experimentation.

Where practical:

* use strong typing
* validate boundaries
* separate concerns
* keep business logic server-authoritative
* handle failure states
* design for maintainability
* use appropriate security practices
* avoid unnecessary coupling
* preserve extensibility
* document important architectural decisions
* avoid premature over-engineering

### Do Not Over-Engineer

Reusable does NOT automatically mean building an enterprise abstraction for every small feature.

Before introducing an abstraction, evaluate:

1. Is this genuinely reusable?
2. Does it solve a recurring engineering problem?
3. Will another application reasonably benefit from it?
4. Does the abstraction reduce coupling or improve consistency?
5. Is its complexity justified?

Prefer:

**simple → reusable → extensible**

rather than:

**complex → generic → speculative**

Build abstractions from real requirements encountered during FoodHub development rather than inventing hypothetical enterprise infrastructure.

### Learning Objective

Treat every significant implementation as an opportunity to learn a transferable engineering concept.

When appropriate, explain:

* why the architecture was chosen
* what problem it solves
* what alternatives exist
* what trade-offs were made
* where the pattern can be reused
* what would need to change at larger scale

Do not merely provide code that "works."

The goal is to understand and develop the engineering capability behind the code.

### AI-Assisted Development

Claude and Gemini should be treated as **engineering collaborators**, not one-time code generators.

Use them strategically for:

* repository analysis
* architectural exploration
* implementation
* code review
* debugging
* testing
* refactoring
* security review
* scalability analysis
* documentation
* identifying reusable patterns

Prompts should encourage them to inspect the existing architecture before introducing new patterns.

Avoid asking AI to rewrite large portions of the project without understanding the existing design.

Prefer small, verifiable vertical slices.

### Implementation Strategy

Prefer this development cycle:

Inspect
→ Understand
→ Design
→ Implement
→ Test
→ Review
→ Refine
→ Extract reusable capability
→ Document

Do not optimize for the number of features completed.

Optimize for the **quality, reusability, and engineering depth of the capabilities developed**.

### Architecture Evolution

The architecture is expected to evolve.

Do not force the entire project into a predetermined "perfect architecture" prematurely.

Instead:

* establish a clean baseline
* identify recurring patterns
* extract reusable infrastructure
* strengthen boundaries
* improve abstractions as real requirements emerge

Technical debt should be identified explicitly rather than silently ignored.

### Interview / Portfolio Quality

The final project should demonstrate that the developer can:

* build a real full-stack application
* design maintainable architecture
* reason about frontend/backend boundaries
* build reusable developer infrastructure
* handle real-world edge cases
* integrate external systems
* work with APIs and databases
* implement authentication and authorization
* build analytics/MCP capabilities
* make architectural trade-offs
* explain why the system was designed the way it was

The project should therefore demonstrate **engineering capability**, not merely feature count.

### Guiding Principle

**FoodHub is the application domain, but the real product being developed is the developer's reusable full-stack engineering toolkit and architectural expertise.**

Every major implementation should therefore ask:

> "Is this merely solving FoodHub's immediate problem, or are we also developing a capability that can make the next application significantly easier, cleaner, safer, and more scalable to build?"

When both are possible, prefer the solution that accomplishes the application requirement while building the reusable capability.
