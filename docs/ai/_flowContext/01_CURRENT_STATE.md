# Current State — Honest Completion Audit

**Date:** 2026-09-14  
**Auditor:** Antigravity (Claude), post-session review  

---

## Overall Completion: **72%**

### Reasoning

The AI architecture skeleton exists and the critical execution path is runtime-verified. However, the frontend has never been opened in a browser, there is a known type mismatch between frontend and backend `AIInsight`, the MCP uses mock data (acceptable per spec), and the API server has not been tested against real MongoDB + real MCP in a single running environment.

---

## Per-CP Breakdown

| CP | Phase | Status | % | Notes |
|----|-------|--------|---|-------|
| CP0 | Repository Audit | ✅ COMPLETE | 100% | Full codebase audited, architecture documented |
| CP1 | AI Contracts + Provider | ✅ COMPLETE + VERIFIED | 100% | Types, interface, MockAIProvider, factory all pass compilation and smoke test |
| CP2 | AI Agent | ✅ COMPLETE + VERIFIED | 100% | Tool planning logic, evidence collection, logger — all verified by smoke test |
| CP3 | MCP Client | ✅ COMPLETE + VERIFIED | 100% | Real MCP connection verified: 9 tools listed, 3 called, `mcp.integration.test.ts` passes |
| CP4 | New MCP Tools | ✅ COMPLETE + VERIFIED | 95% | 3 new tools built and callable. Minor: cancellation rate for restaurants is estimated (not computed from raw orders) |
| CP5 | Golden Path | ✅ COMPLETE + VERIFIED | 100% | Smoke test passes 2/2. API route registered and guarded. Controller validated. |
| CP6 | DCF Logger / Correlation | ✅ COMPLETE + VERIFIED | 90% | Backend `AILogger` emits all 11 event types with requestId+traceId. Frontend logger integrated in `AdminAIPage`. Analytics events (analytics:query:*) declared in type but not emitted (no analytics queries in AI path — correct). |
| CP7 | Admin AI UI | ⚠️ IMPLEMENTED, NOT BROWSER-TESTED | 55% | All files created, `tsc --noEmit` exits 0. **Known type mismatch** (see below). No browser test done. `InvestigationPage` has hardcoded "~4.5s" execution time. |
| CP8 | Tests + Documentation | ✅ COMPLETE | 90% | smoke.test.ts and mcp.integration.test.ts both pass. 4 docs files written. No Jest-based unit tests (no Jest installed in API). |

---

## What Is Genuinely Complete and Runtime-Verified

1. **`AIAgent.execute()`** — tool planning, MCP calls, evidence collection, provider invocation, response normalization. Verified by smoke test.
2. **`MCPClient`** — stdio JSON-RPC 2.0 connect/listTools/callTool/disconnect against real `mcp/dist/index.js`. Verified by integration test.
3. **9 MCP tools** (6 original + 3 new) — all listed and callable. Verified by integration test.
4. **`MockAIProvider`** — parses real evidence from tools, builds structured `AIInsight`. Verified by smoke test.
5. **API typecheck** — `tsc --noEmit` exits 0.
6. **MCP build** — `npm run build` exits 0, produces 87.96KB bundle.
7. **Web typecheck** — `tsc --noEmit` exits 0.
8. **AI routes registered** — `POST /api/admin/ai/chat` and `POST /api/admin/ai/investigations` are in `app.ts`, guarded by `protect + authorize('admin')`.
9. **Redux store** — `adminAi` reducer registered in `Store_V.ts`.
10. **Frontend routes** — `/admin/ai` and `/admin/ai/investigations/:id` are in `index.tsx`.
11. **AdminLayout sidebar** — "AI Insights" nav item added at line 101.
12. **DCF Logger** — frontend `logger.info/error` calls added in `AdminAIPage`.

---

## What Is Implemented But NOT Runtime-Verified

1. **Admin AI UI in browser** — `AdminAIPage`, `AIInsightCard`, `ToolExecutionPanel`, `InvestigationPage` compile clean but have never been opened in a real browser.
2. **API server integration** — `POST /api/admin/ai/chat` works at the controller + agent level (verified by smoke test without HTTP), but has not been tested against a running `npm run dev` API server with MongoDB connected + MCP process spawned.
3. **MCP_SERVER_PATH auto-resolve** — when `MCP_SERVER_PATH` is empty, MCPClient uses `path.join(process.cwd(), '..', 'mcp', 'dist', 'index.js')`. This is correct when API is started from `API/` directory but could fail if started from a different cwd.

---

## What Is Stubbed

1. **Claude provider** — `provider.factory.ts` throws `'Claude provider not yet implemented'` if `AI_PROVIDER=claude`.
2. **OpenAI provider** — same pattern.
3. **`InvestigationPage` execution time** — hardcoded `"~ 4.5s"` on line 90. Should read from `AIResponse.executionMetadata.durationMs`.
4. **Cancellation rate for specific restaurants** — `get_cancellation_metrics.tool.ts` estimates per-restaurant cancellation by multiplying platform rate by `(5 / restaurant.rating)`. This is a heuristic, not computed from order-level data. Fine for demo, must be flagged.
5. **`listResources()`** in MCPClient — calls `resources/list` but result is not used by anything currently.
6. **Notification hook** — mentioned in IMPLEMENTATION_STATUS but not wired.

---

## What Is Missing Entirely

1. **Real LLM provider** — no Claude/OpenAI implementation.
2. **MongoDB persistence for conversations** — conversations are Redux-only (per spec, no new collections).
3. **Investigation creation from UI** — `POST /api/admin/ai/investigations` exists on the backend but `AdminAIPage` only calls `/chat`. `InvestigationPage` reads from `state.adminAi.currentInvestigation` which is never set from the chat flow — the investigation page will always show "not found" unless `setCurrentInvestigation` is dispatched.
4. **AI_COPILOT_ENABLED / AI_INVESTIGATIONS_ENABLED feature flag enforcement** — env vars are read and stored in `config.ai`, but no middleware or route guard actually checks them. Routes are always active when API is running.
5. **Error handling for MCP connection failure in production** — if `mcp/dist/index.js` is missing, the MCPClient will fail inside the first tool call and the agent will continue with empty evidence. The provider will return a degraded response but the error won't propagate clearly to the user.

---

## Known Bugs

### BUG 1 — CRITICAL — Type Mismatch: AIInsight.entity vs entityName

**Severity:** Will cause runtime display bug in browser.

**Backend** (`AI/src/modules/ai/types/ai.types.ts`):
```typescript
export interface AIInsight {
  entity?: {
    type: string;
    id?: string;
    name: string;
  };
  // ...
}
```

**Frontend** (`web/src/features/admin/ai/adminAiApi.ts`):
```typescript
export interface AIInsight {
  entityName: string;  // REQUIRED string
  // ...
}
```

**Symptom:** When the backend returns an `AIResponse` with `insight.entity.name = "Spice Garden"`, the frontend tries to render `insight.entityName` which will be `undefined`. The `AIInsightCard` shows an empty entity name header.

**Fix:** Change `adminAiApi.ts` `AIInsight.entityName` to `entity?: { type: string; name: string }` and update `AIInsightCard` to read `insight.entity?.name`.

### BUG 2 — Minor — Confidence scale mismatch

**Backend** sends `confidence: 0.85` (0–1 scale).  
**Frontend** `AIInsightCard` line 49 uses `value={insight.confidence}` in a `LinearProgress` which expects 0–100.  
`LinearProgress` will show a nearly-empty bar for a "0.85" value instead of "85%".  

**Fix:** Change `AIInsightCard` line 49 to `value={insight.confidence * 100}` or `value={insight.confidence > 1 ? insight.confidence : insight.confidence * 100}`.

### BUG 3 — Minor — ToolCallRecord field name mismatch

**Backend** `ToolCallRecord` has `{ toolName, ... }`.  
**Frontend** `ToolCallRecord` in `adminAiApi.ts` has `{ name, ... }`.  
`ToolExecutionPanel` renders `tool.name` — this will be `undefined` from real API responses.

**Fix:** Align either frontend or backend `ToolCallRecord.toolName → name`.

---

## Compilation Status

| Package | Command | Exit Code | Notes |
|---------|---------|-----------|-------|
| `API/` | `npx tsc --noEmit` | 0 ✅ | Last verified 2026-09-13 |
| `mcp/` | `npm run build` | 0 ✅ | Last verified 2026-09-13, 87.96KB |
| `web/` | `npx tsc --noEmit` | 0 ✅ | Last verified 2026-09-13 |

---

## Single Biggest Risk

**The frontend type mismatches (Bugs 1, 2, 3) will cause the UI to silently render incorrect data.** An admin would see an empty entity name, a near-empty confidence bar, and blank tool names. These are silent failures — no error thrown, just wrong display. Gemini must fix these three bugs before declaring the UI complete.

The fix is 5–10 lines across 2 files and is the highest-ROI first task.
