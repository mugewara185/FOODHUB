# FoodHub AI Platform — End-to-End Implementation Plan

## Architecture Audit Summary

### What Exists
- **MCP Server** (`mcp/`): Fully functional stdio MCP server with 6 analytics tools, 3 resources, 2 prompts. Uses mock data via `AnalyticsService`. No HTTP/SSE transport yet.
- **MCP Client**: Does NOT exist yet. The README explicitly calls this "future work".
- **Backend API** (`API/`): Express + Mongoose, auth middleware (`protect` + `authorize`), roles: `user|admin|owner|partner|dev`, existing `AnalyticsService` (real MongoDB).
- **Frontend** (`web/`): React + Redux, existing admin routes at `/admin/*`, DCF Logger (`logger`) with traceId support, `startTrace()`, `LogEntry` types.
- **AI Code**: None exists yet.

### Key Design Decisions
1. **MCP Transport**: Current MCP server uses stdio only. For backend integration, we will spawn the MCP process and communicate via stdio (using `@modelcontextprotocol/sdk/client/stdio.js`).
2. **AI Provider**: No API keys in `.env`. We implement a `MockAIProvider` that exercises the full orchestration path (Agent → Provider interface → Mock → normalized response). This is correct per spec.
3. **DCF Logger**: The frontend logger is browser-only. Backend AI logging uses Winston-style console logging with structured events. The frontend AI UI will use the existing `logger` instance for client-side events.
4. **Redux**: We add an `aiSlice` to the existing store rather than creating parallel state.
5. **No new MongoDB collections**: AI investigations use in-memory/response state only.

---

## Proposed Changes

### CP1 — AI Contracts + Provider Abstraction (Backend)

#### [NEW] `API/src/modules/ai/types/ai.types.ts`
Core contracts: `AIRequest`, `AIResponse`, `AIExecutionContext`, `AIInsight`, `AIEvidence`, `ToolCallRecord`

#### [NEW] `API/src/modules/ai/providers/ai.provider.interface.ts`
Abstract `AIProvider` interface with `generate()`, `stream()`, `capabilities()`

#### [NEW] `API/src/modules/ai/providers/mock.provider.ts`
`MockAIProvider` — exercises the full interface, returns deterministic structured `AIInsight` grounded in tool results

#### [NEW] `API/src/modules/ai/providers/provider.factory.ts`
Reads `AI_PROVIDER` env var, returns correct provider instance

---

### CP2 — AI Agent / Orchestrator (Backend)

#### [NEW] `API/src/modules/ai/agent/ai.agent.ts`
Central orchestrator:
1. Establish `AIExecutionContext` (requestId, traceId, conversationId, userId, role)
2. Call MCP Client `listTools()`
3. For each required tool: call `MCPClient.callTool()`
4. Collect structured evidence
5. Call `AIProvider.generate()` with evidence-grounded context
6. Normalize response to `AIInsight`
7. Emit DCF-structured log events throughout

#### [NEW] `API/src/modules/ai/observability/ai.logger.ts`
Backend structured event logger for AI execution events. Uses `console.log` with structured JSON (reuses concept of DCF Logger but server-side).

---

### CP3 — MCP Client (Backend)

#### [NEW] `API/src/modules/ai/mcp/mcp.client.ts`
Spawns the existing `mcp/` process via stdio and communicates using `@modelcontextprotocol/sdk/client`. Implements:
- `listTools()` → returns list of available MCP tools
- `callTool(name, args)` → invokes tool, returns structured result
- `listResources()`, `readResource()` (stub initially)
- Connection lifecycle management

> **Note**: The MCP SDK `@modelcontextprotocol/sdk` must be added to `API/package.json`.

---

### CP4 — MCP Analytical Tools (existing MCP server)

Add restaurant-specific tools to the existing MCP server:

#### [MODIFY] `mcp/src/tools/index.ts`
Register 4 new tools

#### [NEW] `mcp/src/tools/get-restaurant-performance.tool.ts`
`get_restaurant_performance(restaurantName, from?, to?)` → calls AnalyticsService, returns performance snapshot

#### [NEW] `mcp/src/tools/get-cancellation-metrics.tool.ts`
`get_cancellation_metrics(restaurantName?, from?, to?)` → cancellation rate, count, reasons breakdown

#### [NEW] `mcp/src/tools/analyze-restaurant-performance.tool.ts`
`analyze_restaurant_performance(restaurantName)` → orchestrated multi-tool analysis → structured `AIInsight`-compatible JSON

---

### CP5 — Admin AI API (Backend)

#### [NEW] `API/src/modules/ai/ai.routes.ts`
```
POST /api/admin/ai/chat
POST /api/admin/ai/investigations
```
Protected by existing `protect` + `authorize('admin')` middleware

#### [NEW] `API/src/modules/ai/ai.controller.ts`
- Validates DTO with Zod
- Generates requestId (uuid)
- Calls `AIAgent.execute()`
- Returns normalized `AIResponse`
- Normalizes errors to safe messages

#### [MODIFY] `API/src/app.ts`
Register `/api/admin/ai` routes

#### [MODIFY] `API/.env` + `API/.env.example`
Add: `AI_ENABLED`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `AI_ENDPOINT`, `AI_TIMEOUT`, `MCP_SERVER_PATH`

#### [MODIFY] `API/src/config/env.ts`
Expose AI config properties

---

### CP6 — DCF Logger Integration (Backend + Frontend)

#### [NEW] `API/src/modules/ai/observability/ai.events.ts`
Typed event constants: `ai:request:start`, `ai:provider:complete`, `mcp:tool:start`, etc.

#### [MODIFY] `API/src/modules/ai/agent/ai.agent.ts`
Emit structured events at each orchestration step

---

### CP7 — Admin AI UI (Frontend)

#### [NEW] `web/src/features/admin/ai/adminAiSlice.ts`
Redux slice: `conversations[]`, `currentInvestigation`, loading/error state

#### [NEW] `web/src/features/admin/ai/adminAiApi.ts`
`POST /api/admin/ai/chat` via fetch with auth token

#### [NEW] `web/src/pages/admin/ai/AdminAIPage.tsx`
Chat interface: message input, history, loading, error, tool execution status panel

#### [NEW] `web/src/pages/admin/ai/InvestigationPage.tsx`
Investigation detail: question, tools used, evidence metrics, finding, confidence, causes, recommendations

#### [NEW] `web/src/pages/admin/ai/components/AIInsightCard.tsx`
Renders structured `AIInsight` with metrics, evidence, severity badge

#### [NEW] `web/src/pages/admin/ai/components/ToolExecutionPanel.tsx`
Shows which MCP tools were called and their status

#### [MODIFY] `web/src/app/routes/index.tsx`
Add `/admin/ai` and `/admin/ai/investigations/:id` routes

#### [MODIFY] shared AdminLayout navigation
Add "AI Insights" nav item

---

### CP8 — Tests + Documentation

#### [NEW] `API/src/modules/ai/__tests__/ai.agent.test.ts`
Test: agent orchestration with mock MCP client and mock provider

#### [NEW] `API/src/modules/ai/__tests__/ai.controller.test.ts`
Test: validation, auth, error normalization

#### [NEW] `docs/ai/AI_ARCHITECTURE.md`
#### [NEW] `docs/ai/AI_OBSERVABILITY.md`
#### [NEW] `docs/ai/AI_TOOL_REGISTRY.md`
#### [NEW] `docs/ai/IMPLEMENTATION_STATUS.md`

---

## Verification Plan

### Automated Tests
- `cd API && npx ts-node src/modules/ai/__tests__/smoke.test.ts`

### Manual Verification (Golden Path)
1. Start MCP server: `cd mcp && npm run build`
2. Start API: `cd API && npm run dev`
3. Start Web: `cd web && npm run dev`
4. Login as admin → navigate to `/admin/ai`
5. Submit: "Why is Spice Garden underperforming?"
6. Verify: tool calls appear in panel, metrics render, insight displays

### Compilation
- `cd API && tsc --noEmit`
- `cd mcp && npm run typecheck`
- `cd web && npx tsc --noEmit`

---

## Open Questions

> [!NOTE]
> The MCP server currently uses **stdio transport only**. The backend MCP client will spawn the MCP process as a child process and communicate via stdio. This is the standard pattern from the MCP SDK and matches the existing architecture.

> [!IMPORTANT]
> `@modelcontextprotocol/sdk` must be added to `API/package.json`. The MCP SDK is already a dependency of `mcp/package.json`.

> [!NOTE]
> No real AI provider credentials exist. The `MockAIProvider` will be used for all verification. The golden path still executes: Agent → MCP Client → MCP Server → AnalyticsService (mock data) → MockProvider → structured AIInsight → Admin UI.
