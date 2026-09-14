# Resume Prompt for Gemini

Copy and paste this entire block into your Gemini conversation to resume work.

---

```
You are resuming the FoodHub AI Platform implementation. The previous Claude session built the core AI architecture. Your job is to continue from where it stopped.

## MANDATORY FIRST STEPS (do NOT skip)

1. Read these files IN ORDER before writing any code:
   - docs/ai/_flowContext/00_README.md
   - docs/ai/_flowContext/01_CURRENT_STATE.md    (audit — know what is done/broken)
   - docs/ai/_flowContext/02_ARCHITECTURE_AS_BUILT.md
   - docs/ai/_flowContext/03_WHAT_WORKS_TODAY.md
   - docs/ai/_flowContext/04_GAPS_AND_NEXT_TASKS.md
   - docs/ai/_flowContext/05_DATA_AND_MCP_TRUTH.md

2. Verify current state by running (in this order):
   cd "c:\Aa\vs_Code\mern projects\zom2\mcp" && npm run build
   cd "c:\Aa\vs_Code\mern projects\zom2\API" && npx tsc --noEmit
   cd "c:\Aa\vs_Code\mern projects\zom2\web" && npx tsc --noEmit
   cd "c:\Aa\vs_Code\mern projects\zom2\API" && npx ts-node src/modules/ai/__tests__/smoke.test.ts
   cd "c:\Aa\vs_Code\mern projects\zom2\API" && npx ts-node src/modules/ai/__tests__/mcp.integration.test.ts

   If smoke test or MCP integration test fail, fix that FIRST before any other work.
   Expected: all 5 pass.

3. Read the top task from docs/ai/_flowContext/04_GAPS_AND_NEXT_TASKS.md.
   The current top task is: "Fix 3 Frontend Type Mismatches" (Task 1).

## PRIME DIRECTIVE

- Do NOT redesign the existing architecture. It works. Extend, don't replace.
- Do NOT modify any seeding/factory files (unifiedFactory.ts, factorySeed.ts, seed generators, mock data counts, seed UI).
- Do NOT create new MongoDB collections for AI features.
- Do NOT create a second MCP server.
- The AI Agent MUST NOT query MongoDB directly.
- All provider credentials stay server-side only.

## ARCHITECTURE REMINDER

```
Admin UI (/admin/ai)
  → POST /api/admin/ai/chat [JWT, admin only]
  → AIController (API/src/modules/ai/ai.controller.ts)
  → AIAgent (API/src/modules/ai/agent/ai.agent.ts)
  → MCPClient (API/src/modules/ai/mcp/mcp.client.ts) [stdio JSON-RPC]
  → mcp/dist/index.js [child process]
  → 9 MCP tools → AnalyticsService (mock Q4 2024 data)
  → Evidence → AIProvider (mock or real LLM)
  → AIResponse → AIInsightCard in Admin UI
```

## KNOWN BUGS TO FIX (Task 1 — do this first)

BUG 1 — AIInsight type mismatch:
  File: web/src/features/admin/ai/adminAiApi.ts
  Backend sends: insight.entity.name
  Frontend expects: insight.entityName (undefined → blank display)
  Fix: Change AIInsight interface to match backend shape

BUG 2 — Confidence scale:
  File: web/src/pages/admin/ai/components/AIInsightCard.tsx line 49
  Backend sends: confidence 0.85 (0-1 scale)
  Frontend passes to LinearProgress which expects 0-100
  Fix: value={insight.confidence * 100}

BUG 3 — ToolCallRecord field name:
  File: web/src/features/admin/ai/adminAiApi.ts + ToolExecutionPanel.tsx
  Backend sends: toolCalls[].toolName
  Frontend renders: tool.name (undefined → blank tool names)
  Fix: Change ToolCallRecord interface to use toolName

## AFTER EACH TASK

1. Run: cd API && npx tsc --noEmit && npx ts-node src/modules/ai/__tests__/smoke.test.ts
2. Run: cd web && npx tsc --noEmit
3. Update docs/ai/IMPLEMENTATION_STATUS.md to reflect new status.
4. Update docs/ai/_flowContext/07_RUNTIME_VERIFICATION_LOG.md with what you ran.

## TASK PRIORITY ORDER

Task 1: Fix 3 frontend type mismatches (S — 30-60 min)
Task 2: Wire InvestigationPage to chat flow (S — 20-30 min)
Task 3: HTTP integration test with real MongoDB + curl (S — 30 min)
Task 4: Fix hardcoded execution time in InvestigationPage (XS — 2 min)
Task 5: Feature flag enforcement middleware (S — 30 min)
Task 6: Add real LLM provider (M — requires API key, see 06_PROVIDER_SWAP_GUIDE.md)
Task 7: Connect MCP to real MongoDB (L — see 05_DATA_AND_MCP_TRUTH.md)

## WHAT CURRENTLY WORKS (do not break)

- Backend AI types, agent, mock provider, MCP client: fully functional
- 9 MCP tools: all callable via real stdio MCP process
- API routes: POST /api/admin/ai/chat and POST /api/admin/ai/investigations registered
- Frontend routes: /admin/ai and /admin/ai/investigations/:id registered
- Redux store: adminAi reducer registered
- AdminLayout: "AI Insights" nav item present
- All packages: tsc compiles cleanly

The repo is at: c:\Aa\vs_Code\mern projects\zom2
```
