# Gaps and Next Tasks

Prioritized by: (1) unblocks the most, (2) cheapest, (3) highest demo value.

---

## Task 1 — Fix 3 Frontend Type Mismatches (HIGHEST PRIORITY)

**Why it matters:** These are silent runtime display bugs. Without this fix, the Admin UI shows blank entity names, a near-empty confidence bar, and empty tool names. The UI appears broken to anyone who opens a browser.

**Files involved:**
- `web/src/features/admin/ai/adminAiApi.ts` — fix `AIInsight` and `ToolCallRecord` interfaces
- `web/src/pages/admin/ai/components/AIInsightCard.tsx` — fix confidence scale and entity name rendering

**Effort:** S (30–60 minutes)

**Blockers:** None

**Acceptance criteria (runtime-verifiable):**
1. Open browser at `/admin/ai`
2. Ask "Why is Spice Garden underperforming?"
3. Entity name shows "Spice Garden" (not blank)
4. Confidence bar shows ~85% (not a tiny sliver)
5. Tool execution panel shows "analyze_restaurant_performance()" (not blank)

**Credentials needed:** None (mock provider, mock MCP data)

**Exact changes:**

In `adminAiApi.ts`, replace:
```typescript
export interface AIInsight {
  severity: 'critical' | 'warning' | 'info';
  entityName: string;           // ← WRONG: backend sends entity.name
  finding: string;
  confidence: number;           // ← backend sends 0-1, not 0-100
  // ...
}

export interface ToolCallRecord {
  name: string;                 // ← WRONG: backend sends toolName
  status: 'success' | 'error' | 'running';
  durationMs?: number;
}
```

With:
```typescript
export interface AIInsight {
  severity: 'critical' | 'warning' | 'info';
  entity?: { type: string; id?: string; name: string };
  finding: string;
  confidence: number;           // 0-1 scale
  // ...
}

export interface ToolCallRecord {
  toolName: string;             // matches backend
  toolCallId: string;
  status: 'success' | 'error' | 'timeout' | 'unavailable';
  durationMs: number;
  error?: string;
}
```

In `AIInsightCard.tsx`, fix:
```tsx
// Line 41: was insight.entityName
{insight.entity?.name}

// Line 49: was value={insight.confidence}
value={insight.confidence * 100}
```

In `ToolExecutionPanel.tsx`, fix:
```tsx
// Line 40: was tool.name
{tool.toolName}()
```

---

## Task 2 — Wire InvestigationPage to Chat Flow

**Why it matters:** `/admin/ai/investigations/:id` always shows "not found" because `currentInvestigation` is never dispatched from the chat flow. The route exists but is a dead end.

**Files involved:**
- `web/src/pages/admin/ai/AdminAIPage.tsx` — dispatch `setCurrentInvestigation` after successful response
- `web/src/features/admin/ai/adminAiSlice.ts` — verify `setCurrentInvestigation` action exists (it does)

**Effort:** S (20–30 minutes)

**Blockers:** Task 1 should be done first (so entity name is visible in the investigation page)

**Acceptance criteria:**
1. Chat with "Why is Spice Garden underperforming?"
2. Click a link/button to view investigation (need to add a "View Investigation" button in AdminAIPage)
3. Navigate to `/admin/ai/investigations/some-id`
4. Page shows the question, AIInsightCard with metrics, tool list

**Credentials needed:** None

**Exact change in AdminAIPage.tsx, inside `addAssistantMessage` dispatch:**
```typescript
// After dispatch(addAssistantMessage(response)):
if (response.insight) {
  dispatch(setCurrentInvestigation({
    id: response.requestId,
    question: userText,
    status: 'complete',
    toolsUsed: response.toolCalls.map(t => t.toolName),
    insight: response.insight,
    response,
    createdAt: new Date().toISOString(),
  }));
}
```

Also add a "View Investigation" link in the assistant message bubble.

---

## Task 3 — End-to-End HTTP Test Against Running API

**Why it matters:** The full path (HTTP → AIController → AIAgent → MCPClient → MCP process → response) has never been tested as a single running system. This is the critical verification that makes the demo real.

**Files involved:** No code changes needed. Just running the system.

**Effort:** S (30 minutes to set up and verify)

**Blockers:** MongoDB must be running. `mcp/dist/index.js` must exist.

**Acceptance criteria:**
```powershell
# Start MongoDB
mongod

# Start API
cd API && npm run dev

# In another terminal — use curl or Postman
# First: login to get a JWT
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"password123"}'

# Then: call the AI endpoint
curl -X POST http://localhost:5000/api/admin/ai/chat `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <JWT_FROM_LOGIN>" `
  -d '{"messages":[{"role":"user","content":"Why is Spice Garden underperforming?"}]}'
```

Expected response: JSON with `success: true, data: { message, insight: {...}, toolCalls: [...] }`.

**If this fails:** Check that `mcp/dist/index.js` exists and that `MCP_SERVER_PATH` env resolves correctly when API is started from `API/` directory.

---

## Task 4 — Fix InvestigationPage Hardcoded Execution Time

**Why it matters:** Line 90 shows `"~ 4.5s"` always. Should show real `executionMetadata.durationMs`.

**Files involved:**
- `web/src/pages/admin/ai/InvestigationPage.tsx` line 90

**Effort:** XS (2 minutes)

**Blockers:** Task 2 (need investigation to be populated first to verify)

**Acceptance criteria:** Investigation page shows actual execution time from `response.executionMetadata.durationMs`.

---

## Task 5 — Add Feature Flag Enforcement

**Why it matters:** `AI_ENABLED`, `AI_COPILOT_ENABLED`, `AI_INVESTIGATIONS_ENABLED` are read into `config.ai` but nothing checks them. Routes always respond even if `AI_ENABLED=false`.

**Files involved:**
- `API/src/modules/ai/ai.routes.ts` — add feature flag middleware

**Effort:** S (30 minutes)

**Blockers:** None

**Acceptance criteria:**
1. Set `AI_ENABLED=false` in `.env`
2. `POST /api/admin/ai/chat` returns 503 with `{ message: "AI features are currently disabled" }`

**No credentials needed**

---

## Task 6 — Add Real LLM Provider (Claude)

**Why it matters:** Replaces deterministic mock responses with actual LLM reasoning. Required for a production-quality demo.

**Files involved:**
- `API/src/modules/ai/providers/claude.provider.ts` [NEW]
- `API/src/modules/ai/providers/provider.factory.ts` — register new provider
- `API/.env` — add `AI_PROVIDER=claude` + `AI_API_KEY=sk-ant-...`

**Effort:** M (2–4 hours)

**Blockers:** Real Anthropic API key required. Read `06_PROVIDER_SWAP_GUIDE.md` first.

**Acceptance criteria:**
1. Set `AI_PROVIDER=claude` in `.env`
2. Ask "Why is Spice Garden underperforming?"
3. Response `executionMetadata.provider = "claude"` (not "mock")
4. Response is natural language, not deterministic — varies between calls

---

## Task 7 — Connect MCP Analytics to Real MongoDB

**Why it matters:** MCP currently reads from in-memory mock data. To use real FoodHub orders/restaurants/users, MCP's AnalyticsService must read from MongoDB.

**Files involved:**
- `mcp/src/services/analytics.service.ts` — replace mock imports with real data source
- `mcp/src/data/` — mock data files (can be kept as fallback)

**Effort:** L (4–8 hours, requires careful Mongoose/schema alignment)

**Blockers:** Real MongoDB with seeded FoodHub data required. See `05_DATA_AND_MCP_TRUTH.md` for exact migration path.

**Credentials needed:** MongoDB URI with data

**Acceptance criteria:**
1. `get_analytics_summary` returns data matching live MongoDB counts
2. `get_restaurant_performance` for a real restaurant returns real revenue numbers
3. `mcp.integration.test.ts` still passes after migration

---

## Task 8 — Add AI Navigation to AdminLayout

**Status:** DONE — `AI Insights` nav item added at `AdminLayout.tsx` line 101. No action needed.

---

## Dependency Order

```
Task 1 (type fixes) → must be first
  → Task 2 (wire investigation page)
  → Task 3 (HTTP integration test) — can run in parallel with Task 2
    → Task 4 (fix hardcoded time) — needs Task 2+3 to be observable
    → Task 5 (feature flags) — independent, can run anytime
    → Task 6 (real LLM) — needs Task 3 verified first
    → Task 7 (real MongoDB) — long task, independent of UI fixes
```
