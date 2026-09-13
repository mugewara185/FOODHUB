# FoodHub AI Architecture

## Overview

The FoodHub AI Platform is a server-side AI architecture that enables Admins to ask natural language questions about restaurant performance, orders, and platform health. The AI uses the existing FoodHub MCP server to retrieve real analytical data before generating structured insights.

## Architecture

```
Admin UI (React)
      │  HTTP POST /api/admin/ai/chat
      ▼
Admin AI API (Express)
  auth middleware: protect + authorize('admin')
  AIController: validates, builds AIExecutionContext
      │
      ▼
AI Agent / Orchestrator
  - Parses question intent
  - Plans which MCP tools to call
  - Collects structured evidence
  - Calls AI Provider
  - Returns normalized AIResponse
      │
      ├──────────────────────────► AI Provider
      │                            (MockAIProvider / future: Claude/OpenAI)
      │                            - Parses evidence
      │                            - Returns AIInsight
      ▼
MCP Client (stdio JSON-RPC)
  - Spawns mcp/dist/index.js as child process
  - Communicates via JSON-RPC 2.0 over stdio
  - Handles request/response correlation
  - Timeout: AI_TIMEOUT (default 30s)
      │
      ▼
FoodHub MCP Server (existing)
  9 tools, 3 resources, 2 prompts
      │
      ▼
MCP Analytics Service (in mcp/)
  - In-memory mock data (Q4 2024)
  - Future: swap to real MongoDB via API
      │
      ▼
Structured Evidence
      │
      ▼
AI Agent → AI Provider → AIInsight
      │
      ▼
Admin UI → AIInsightCard, ToolExecutionPanel
```

## Components

### Backend (`API/src/modules/ai/`)

| File | Purpose |
|------|---------|
| `types/ai.types.ts` | Core contracts: AIRequest, AIResponse, AIInsight, AIEvidence, AIExecutionContext |
| `providers/ai.provider.interface.ts` | AIProvider interface |
| `providers/mock.provider.ts` | MockAIProvider — parses evidence, builds structured insights |
| `providers/provider.factory.ts` | Creates provider based on AI_PROVIDER env var |
| `mcp/mcp.client.ts` | MCP stdio client — spawns MCP process, JSON-RPC communication |
| `agent/ai.agent.ts` | Central orchestrator — tool planning, execution, evidence collection |
| `ai.controller.ts` | HTTP handlers — validation, context, error normalization |
| `ai.routes.ts` | Express routes — POST /chat, POST /investigations |
| `observability/ai.logger.ts` | Structured event logger for AI execution |

### MCP Server (`mcp/src/tools/`)

| Tool | Purpose |
|------|---------|
| `get_analytics_summary` | Platform-wide KPI snapshot |
| `get_metrics` | Specific metric values |
| `compare_periods` | Period-over-period comparison |
| `get_breakdown` | Dimensional breakdown (city/cuisine/restaurant) |
| `get_top_entities` | Ranked restaurants or users |
| `analyze_trend` | Time-series trend analysis |
| `get_restaurant_performance` ✨ | Restaurant-specific performance snapshot |
| `get_cancellation_metrics` ✨ | Cancellation rate analysis |
| `analyze_restaurant_performance` ✨ | Comprehensive restaurant analysis |

### Frontend (`web/src/features/admin/ai/`)

| File | Purpose |
|------|---------|
| `adminAiSlice.ts` | Redux state for conversations and investigations |
| `adminAiApi.ts` | API client for POST /api/admin/ai/chat |
| `pages/admin/ai/AdminAIPage.tsx` | Main AI chat interface |
| `pages/admin/ai/InvestigationPage.tsx` | Investigation detail view |
| `pages/admin/ai/components/AIInsightCard.tsx` | Structured insight renderer |
| `pages/admin/ai/components/ToolExecutionPanel.tsx` | Tool call status panel |

## API Endpoints

```
POST /api/admin/ai/chat
  Auth: Bearer JWT (admin role required)
  Body: { messages: AIMessage[], conversationId?: string, context?: { entityName?, entityType?, entityId? } }
  Response: { success: true, data: AIResponse }

POST /api/admin/ai/investigations
  Auth: Bearer JWT (admin role required)
  Body: { query: string, entityName?: string, entityType?: string, entityId?: string }
  Response: { success: true, data: AIResponse }
```

## Configuration

```env
# AI Core
AI_ENABLED=true
AI_PROVIDER=mock          # mock | claude | openai
AI_MODEL=mock-v1
AI_API_KEY=               # Required for claude/openai
AI_ENDPOINT=              # Optional custom endpoint
AI_TIMEOUT=30000          # ms

# Feature Flags
AI_COPILOT_ENABLED=true
AI_INVESTIGATIONS_ENABLED=true

# MCP
MCP_SERVER_PATH=          # Optional: path to mcp/dist/index.js (auto-resolved if empty)
```

## Data Flow (Golden Path)

**Question: "Why is Spice Garden underperforming?"**

1. Admin submits question from `/admin/ai`
2. `AIController` validates, creates `requestId` + `traceId`, calls `AIAgent`
3. `AIAgent.execute()` detects "Spice Garden" → plans 3 tool calls
4. `MCPClient.callTool('analyze_restaurant_performance', { restaurantName: 'Spice Garden' })`
5. MCP server's `AnalyticsService` computes performance score, rank, issues
6. `MCPClient.callTool('get_restaurant_performance', ...)` → revenue, rating, rank
7. `MCPClient.callTool('get_cancellation_metrics', ...)` → cancellation rate
8. Evidence collected: `AIEvidence[]` with structured tool results
9. `MockAIProvider.generate({ evidence })` → parses evidence, builds `AIInsight`
10. `AIInsight` includes: severity, metrics, likelyCauses, recommendations
11. `AIResponse` returned with message + structured insight
12. Admin UI renders `AIInsightCard` with metrics, causes, recommendations

## Observability Events

Every execution emits structured DCF events:

```
ai:request:start      { requestId, traceId, userId }
ai:context:created    { requestId, traceId, entityName, entityType }
mcp:request:start     { requestId, traceId }
mcp:tool:start        { requestId, traceId, toolCallId, toolName }
mcp:tool:complete     { requestId, traceId, toolCallId, toolName, durationMs }
mcp:tool:error        { requestId, traceId, toolCallId, toolName, error }
ai:provider:start     { requestId, traceId, provider, model }
ai:provider:complete  { requestId, traceId, provider, model, durationMs }
ai:provider:error     { requestId, traceId, provider, error }
ai:response:complete  { requestId, traceId, durationMs }
ai:response:error     { requestId, traceId, durationMs, error }
```

## Security

- JWT authentication on all `/api/admin/ai/*` routes
- Role authorization: `admin` role required (server-side only)
- Provider credentials are server-side only — never exposed to browser
- No sensitive data in AI execution context
- AI logger never logs: API keys, JWTs, passwords, PII
- MCP tool arguments are validated via Zod schemas in MCP server
