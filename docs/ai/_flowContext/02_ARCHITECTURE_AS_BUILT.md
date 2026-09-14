# Architecture As-Built

Every arrow in the system. Status: ✅ exists + verified | ⚠️ exists, not end-to-end tested | ❌ missing | 🐛 has bug

---

## Layer Table

| Layer | File(s) | Status | Notes |
|-------|---------|--------|-------|
| **Frontend Route** | `web/src/app/routes/index.tsx` lines 144–145 | ✅ verified | `/admin/ai` and `/admin/ai/investigations/:id` registered in ProtectedRoute allowedRoles=['admin'] |
| **Frontend Nav** | `web/src/shared/layout/AdminLayout.tsx` line 101 | ✅ verified | `{ text: 'AI Insights', icon: <SmartToy />, path: '/admin/ai' }` |
| **Frontend Redux Slice** | `web/src/features/admin/ai/adminAiSlice.ts` | ✅ compiles | `adminAi` reducer with conversations, isLoading, error, currentInvestigation |
| **Frontend Redux Store** | `web/src/app/store/V/Store_V.ts` line 25, 44 | ✅ verified | `adminAiReducer` imported and added to `rootReducer.adminAi` |
| **Frontend API Client** | `web/src/features/admin/ai/adminAiApi.ts` | 🐛 compiles with bugs | `sendAIMessage()` posts to `${API_BASE}/admin/ai/chat`. **AIInsight type mismatch** (entityName vs entity.name). **ToolCallRecord field name mismatch** (name vs toolName). |
| **Frontend Chat Page** | `web/src/pages/admin/ai/AdminAIPage.tsx` | ⚠️ compiles, not browser-tested | Uses `useDispatch`, calls `sendAIMessage`, dispatches to Redux. DCF logger integrated. |
| **Frontend Insight Card** | `web/src/pages/admin/ai/components/AIInsightCard.tsx` | 🐛 compiles | **Confidence scale bug**: renders `insight.confidence` directly into LinearProgress expecting 0–100, but backend sends 0–1. `insight.entityName` undefined from real responses. |
| **Frontend Tool Panel** | `web/src/pages/admin/ai/components/ToolExecutionPanel.tsx` | 🐛 compiles | Renders `tool.name` but backend sends `tool.toolName`. Will show blank tool names. |
| **Frontend Investigation** | `web/src/pages/admin/ai/InvestigationPage.tsx` | ⚠️ compiles, not usable | Reads from `state.adminAi.currentInvestigation` which is never dispatched from chat flow. Always shows "not found". |
| **HTTP API Route** | `API/src/app.ts` line 43 | ✅ verified | `app.use('/api/admin/ai', aiRoutes)` registered |
| **HTTP API Router** | `API/src/modules/ai/ai.routes.ts` | ✅ verified | `protect + authorize('admin') + POST /chat + POST /investigations` |
| **HTTP API Controller** | `API/src/modules/ai/ai.controller.ts` | ✅ verified by smoke | Validates messages[], builds AIExecutionContext, calls AIAgent, returns `{ success: true, data: AIResponse }` |
| **AI Execution Context** | Built in `ai.controller.ts` | ✅ verified | requestId, traceId = `crypto.randomUUID()`. userId/role from `req.user.id` / `req.user.roles[0]`. Entity from `req.body.context`. |
| **AI Types** | `API/src/modules/ai/types/ai.types.ts` | ✅ verified | All core interfaces + AIError class. `AIMetric.status` includes 'info'. |
| **AI Provider Interface** | `API/src/modules/ai/providers/ai.provider.interface.ts` | ✅ verified | `AIProvider.generate(AIProviderGenerateInput): Promise<AIResponse>` |
| **Provider Factory** | `API/src/modules/ai/providers/provider.factory.ts` | ✅ verified | Returns MockAIProvider by default. Claude/OpenAI: throw "not yet implemented". |
| **Mock Provider** | `API/src/modules/ai/providers/mock.provider.ts` | ✅ verified by smoke | Parses evidence from 3 MCP tools. Builds `AIInsight` with metrics, severity, causes, recommendations. 200ms simulated latency. |
| **AI Agent** | `API/src/modules/ai/agent/ai.agent.ts` | ✅ verified by smoke | Detects restaurant name (20 known restaurants). Plans tool calls. Calls MCPClient. Collects evidence. Calls provider. Returns AIResponse. |
| **Tool Planning Logic** | Inside `ai.agent.ts` — `planToolCalls()` | ✅ verified | Restaurant → 3 tools (analyze_restaurant_performance, get_restaurant_performance, get_cancellation_metrics). Cancel → 2 tools. Trend → 2 tools. Default → 2 tools. |
| **MCP Client** | `API/src/modules/ai/mcp/mcp.client.ts` | ✅ verified by integration | stdio JSON-RPC 2.0. Spawns `node [MCP_SERVER_PATH]`. Readline-based response parsing. Request timeout from `AI_TIMEOUT` env. |
| **MCP Server Path Resolution** | `mcp.client.ts` line 26 | ⚠️ works in dev | `process.env.MCP_SERVER_PATH || path.join(process.cwd(), '..', 'mcp', 'dist', 'index.js')`. Correct when cwd=`API/`. Breaks if API started from wrong dir. |
| **MCP Server** | `mcp/src/index.ts` + `mcp/src/server.ts` | ✅ verified | Spawned as child process. 9 tools registered. stdio transport. |
| **MCP Tool: get_analytics_summary** | `mcp/src/tools/get-analytics-summary.tool.ts` | ✅ original, verified | Returns platform KPIs |
| **MCP Tool: get_metrics** | `mcp/src/tools/get-metrics.tool.ts` | ✅ original, verified | Specific metric values |
| **MCP Tool: compare_periods** | `mcp/src/tools/compare-periods.tool.ts` | ✅ original | Not currently called by AIAgent |
| **MCP Tool: get_breakdown** | `mcp/src/tools/get-breakdown.tool.ts` | ✅ original | Not currently called by AIAgent |
| **MCP Tool: get_top_entities** | `mcp/src/tools/get-top-entities.tool.ts` | ✅ original, verified | Called in integration test |
| **MCP Tool: analyze_trend** | `mcp/src/tools/analyze-trend.tool.ts` | ✅ original | Called by AIAgent only for trend questions |
| **MCP Tool: get_restaurant_performance** | `mcp/src/tools/get-restaurant-performance.tool.ts` | ✅ new, verified | Returns restaurant rank, revenue, rating, benchmarks |
| **MCP Tool: get_cancellation_metrics** | `mcp/src/tools/get-cancellation-metrics.tool.ts` | ✅ new, verified | Restaurant cancellation rate is heuristic estimate, not from raw orders |
| **MCP Tool: analyze_restaurant_performance** | `mcp/src/tools/analyze-restaurant-performance.tool.ts` | ✅ new, verified | Returns performanceScore, rank, issues[], recommendations[] |
| **MCP Analytics Service** | `mcp/src/services/analytics.service.ts` | ✅ existing, unchanged | Uses MOCK_ORDERS, MOCK_RESTAURANTS, MOCK_USERS from `mcp/src/data/`. Q4 2024. |
| **Backend AI Logger** | `API/src/modules/ai/observability/ai.logger.ts` | ✅ verified | Structured JSON events. Sanitizes apiKey/password/token. 11 event types. |
| **Frontend DCF Logger** | `web/src/core/dev/logger/Logger.ts` | ✅ existing, unchanged | Used in AdminAIPage: `logger.info('AI', ...)` and `logger.error('AI', ...)` |
| **Env Config** | `API/src/config/env.ts` | ✅ verified | `config.ai.*` block added. No required AI env vars (all have defaults). |
| **Env File** | `API/.env` | ✅ verified | AI vars appended. `MCP_SERVER_PATH=` empty (auto-resolved from cwd). |

---

## DCF Correlation ID Flow

```
HTTP Request arrives at AIController
  → requestId = crypto.randomUUID()     [per request]
  → traceId   = crypto.randomUUID()     [per AI execution]
  → conversationId = from req.body      [optional, client-supplied]
    ↓ passed into AIExecutionContext
AIAgent.execute(request, context)
  → logs [ai:request:start] { requestId, traceId, userId }
  → for each tool call:
      → toolCallId = crypto.randomUUID() [per MCP tool invocation]
      → logs [mcp:tool:start]  { requestId, traceId, toolCallId, toolName }
      → logs [mcp:tool:complete] { requestId, traceId, toolCallId, durationMs }
  → logs [ai:provider:start]  { requestId, traceId, provider }
  → logs [ai:provider:complete] { requestId, traceId, durationMs }
  → logs [ai:response:complete] { requestId, traceId, durationMs }
AIResponse returned with:
  → .requestId (correlation)
  → .traceId   (correlation)
  → .toolCalls[].toolCallId (per-tool correlation)
Frontend (AdminAIPage):
  → logger.info('AI', '...', { event: 'ai:request:start', data: { question } })
  → logger.info('AI', '...', { event: 'ai:response:complete', data: { toolCount } })
  (Note: frontend has no requestId/traceId — these are server-side only)
```

---

## What Does NOT Exist (Architecture Gaps)

1. **Admin UI → InvestigationPage connection**: Chat flow never dispatches `setCurrentInvestigation`. The investigation page is a dead route.
2. **Feature flag enforcement at route level**: `AI_COPILOT_ENABLED` / `AI_INVESTIGATIONS_ENABLED` are in config but no middleware checks them.
3. **Real AI provider**: Claude/OpenAI providers stub.
4. **MCP ↔ MongoDB connection**: MCP AnalyticsService reads in-memory mock, not MongoDB.
5. **HTTP `/api/admin/ai` → MCP full-stack test**: The complete path with running MongoDB + running API + spawned MCP has not been tested in a single session.
