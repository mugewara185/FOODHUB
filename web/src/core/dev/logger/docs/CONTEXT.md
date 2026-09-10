# Developer Observability Foundation: Context & Architecture

This document explains the architecture, design decisions, and core philosophy behind the `core/dev/logger` observability foundation.

## 1. Philosophy and Goals
The logger is designed to be an **application execution timeline and troubleshooting system**. Instead of printing formatted strings, it records structured events to answer the question: *"What happened immediately before this problem?"*

**Core Requirements:**
- **Structured Data:** Every log is an object with a timestamp, trace ID, category, event name, and optional payload.
- **Stable Identity:** Logging must never cause infinite render loops.
- **Scannability:** The Logger UI provides pause/play, filtering, and detail views to quickly find root causes.
- **Fail-safe:** The logger must never crash the application (e.g., handling localStorage quotas safely).

## 2. Architecture Overview
The observability foundation is divided into three layers:

### A. Core Engine (`Logger.ts` & `types.ts`)
A singleton class `Logger` manages the in-memory array of `LogEntry` objects (bounded rolling buffer of 1000 items). It acts as the central pub-sub broker, persisting to localStorage and optionally outputting to the browser console.

### B. React Integration (`LoggerContext.tsx`)
A Context Provider that subscribes to the singleton. 
**Critical Fix:** To prevent the notorious "infinite render loop" bug (where a component depends on `useLogger` and causes effects to re-trigger on every state change), the context exclusively exports stable arrow function references.

### C. Helper Utilities (`logUtils.ts`)
Domain-agnostic helpers that attach structured `event` labels to standard actions. 
- `logAPI`: Observes request/response lifecycles (`REQUEST`, `RESPONSE`, `ERROR`).
- `logRedux`: Observes store changes (`ACTION`, `STATE_UPDATE`).
- `logComponent`: Observes component lifecycles (`MOUNT`, `UNMOUNT`, `RENDER`).
- `logError`: Normalizes error payloads (capturing stack traces and component stacks).

## 3. Key Design Decisions

### Trace / Correlation Support
To trace an entire logical flow (e.g., `Authentication Restoration`), the logger uses `startTrace()`. This returns a localized `TraceLogger` that automatically binds a unique `traceId` to every subsequent log within that flow. This groups related API calls, state changes, and logic checks together in the UI.

### Opt-in Render Logging
React StrictMode causes double renders, which is correct behavior but noisy in logs. `logComponent.render()` calls are gated behind the `renderLoggingEnabled` config flag (default `false`). This prevents massive render volume from burying critical logs, while allowing explicit opt-in when debugging re-render cascades.

### Console Control Override
Developers often run the application with multiple DevTools open. The logger includes a `consoleLoggingEnabled` flag (toggled via the UI) that mutes the browser console output, while *continuing* to capture events internally for the `LogPanel` timeline.

### Persistent Bounded Storage
Logs are persisted to `localStorage` (`zom2_logs`) to survive page reloads (crucial for debugging auth/redirects). To prevent `QuotaExceededError`, the logger maintains a rolling buffer of 500 logs max for persistence, wrapping `setItem` in a `try/catch` block for graceful degradation.

### External Instrumentation
- **Redux Middleware:** Automatically intercepts dispatch and next-state to log actions (respecting deep-object truncations).
- **React Error Boundary:** Intercepts React crashes (via `componentDidCatch`) and writes them directly to the timeline with the component stack layout.
- **React Router:** Hooks into route-guards (`ProtectedRoute`) to emit `AUTH_REDIRECT` events, showing exactly *why* a user was sent to `/login`.
