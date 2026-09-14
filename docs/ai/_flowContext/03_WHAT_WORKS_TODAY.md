# What Works Today

Step-by-step reproduction guide. These are the exact commands and outputs observed.

---

## Prerequisites

- Node.js v22.13.0 (confirmed in environment)
- MongoDB running locally at `mongodb://localhost:27017` (needed for API startup; NOT needed for smoke/MCP tests)
- All three packages have their `node_modules` installed (`npm install` in each)
- MCP is built: `mcp/dist/index.js` exists (87.96KB)

---

## Step 1: Verify MCP Build

```powershell
cd "c:\Aa\vs_Code\mern projects\zom2\mcp"
npm run build
```

**Expected output:**
```
> foodhub-mcp-server@1.0.0 build
> tsup src/index.ts --format cjs --out-dir dist

CLI Building entry: src/index.ts
CJS dist\index.js 87.96 KB
CJS ⚡️ Build success in ~250ms
```

**If it fails:** Check `mcp/src/tools/index.ts` and `mcp/src/server.ts` — the 3 new tool registrations must be present.

---

## Step 2: Typecheck All Packages

```powershell
# API
cd "c:\Aa\vs_Code\mern projects\zom2\API"
npx tsc --noEmit
# Expected: no output, exit 0

# Web
cd "c:\Aa\vs_Code\mern projects\zom2\web"
npx tsc --noEmit
# Expected: no output, exit 0
```

---

## Step 3: Run Smoke Test (no MongoDB, no MCP process, mocked)

```powershell
cd "c:\Aa\vs_Code\mern projects\zom2\API"
npx ts-node src/modules/ai/__tests__/smoke.test.ts
```

**Expected output (trimmed):**
```
━━━ FoodHub AI Architecture Smoke Tests ━━━

[SMOKE TEST] Starting: Golden Path — "Why is Spice Garden underperforming?"
{"event":"ai:request:start","requestId":"test-req-001","traceId":"test-trace-001","userId":"admin-user-1","status":"start",...}
{"event":"ai:context:created",...,"entityName":"Spice Garden","entityType":"restaurant",...}
{"event":"mcp:request:start",...}
{"event":"mcp:tool:start",...,"toolName":"analyze_restaurant_performance",...}
{"event":"mcp:tool:complete",...,"durationMs":1,...}
{"event":"mcp:tool:start",...,"toolName":"get_restaurant_performance",...}
{"event":"mcp:tool:complete",...,"durationMs":0,...}
{"event":"mcp:tool:start",...,"toolName":"get_cancellation_metrics",...}
{"event":"mcp:tool:complete",...,"durationMs":0,...}
{"event":"ai:provider:start",...,"provider":"mock","model":"mock-v1",...}
{"event":"ai:provider:complete",...,"durationMs":42,...}
{"event":"ai:response:complete",...,"durationMs":245,...}
[SMOKE TEST] PASS: Golden path executed successfully
[SMOKE TEST] Message: Spice Garden Q4 2024 — Revenue: ₹2,400 | Rank: #15/20 | Rating: 3.8/5 | Cancellation: 33.0%...
[SMOKE TEST] Tool calls: analyze_restaurant_performance, get_restaurant_performance, get_cancellation_metrics
[SMOKE TEST] Metrics: Performance Score=32, Platform Rank=#15 of 20, Revenue (Q4 2024)=2400, Revenue Share=4.0%, Rating=3.8, Cancellation Rate=33.0%
[SMOKE TEST] Severity: critical

[SMOKE TEST] PASS: Platform summary query executed

━━━ Results: 2 passed, 0 failed ━━━
```

**If either test fails:** The backend AI core is broken. Check the AIAgent, MockAIProvider, and AILogger for compilation regressions.

---

## Step 4: Run MCP Integration Test (real MCP process spawned)

```powershell
cd "c:\Aa\vs_Code\mern projects\zom2\API"
npx ts-node src/modules/ai/__tests__/mcp.integration.test.ts
```

**Expected output (trimmed):**
```
[MCP INTEGRATION] Starting MCPClient → real MCP server test
[MCP INTEGRATION] MCP server path: C:\Aa\vs_Code\mern projects\zom2\mcp\dist\index.js
[MCP INTEGRATION] Connecting to MCP server...
[foodhub-mcp] Server running on stdio. Ready for MCP client connections.
[MCP INTEGRATION] Connected. isConnected: true
[MCP INTEGRATION] Found 9 tools: [
  'get_analytics_summary', 'get_metrics', 'compare_periods', 'get_breakdown',
  'get_top_entities', 'analyze_trend',
  'get_restaurant_performance', 'get_cancellation_metrics', 'analyze_restaurant_performance'
]
[MCP INTEGRATION] Calling get_analytics_summary...
[MCP INTEGRATION] Summary metrics: { revenue: { total: 42504, ... }, orders: { total: 60, cancellationRate: 0.05, ... } }
[MCP INTEGRATION] Calling get_top_entities...
[MCP INTEGRATION] Top restaurants: [ 'The Biryani Co. (₹4780)', 'Coastal Cravings (₹3900)', 'Spice Garden (₹3750)' ]
[MCP INTEGRATION] Calling analyze_restaurant_performance...
[MCP INTEGRATION] Analysis result: { restaurantName: 'Spice Garden', performanceScore: 92, rank: { position: 3, ... } }
[MCP INTEGRATION] ALL TESTS PASSED ✓
[MCP INTEGRATION] Client disconnected
```

**IMPORTANT:** Spice Garden's `performanceScore: 92` in the integration test differs from `32` in the smoke test because:
- Integration test uses **real mock data** from `mcp/src/data/` — Spice Garden is actually rank #3
- Smoke test uses **manually mocked evidence** where rank is set to #15
- Both are correct for their respective purposes

---

## Step 5: Start API Server (requires MongoDB)

```powershell
# Start MongoDB first (in a separate terminal)
mongod

# Start API
cd "c:\Aa\vs_Code\mern projects\zom2\API"
npm run dev
```

**Expected:** API starts on port 5000. `[foodhub-mcp] Server running on stdio...` will appear when first AI request is made (MCPClient spawns it on demand).

**NOT YET TESTED END-TO-END** — this has not been verified as a complete running system. The individual components are verified but the HTTP → MongoDB → MCP full flow has not been run in a single session.

---

## Step 6: Start Web Frontend

```powershell
cd "c:\Aa\vs_Code\mern projects\zom2\web"
npm run dev
```

Navigate to `http://localhost:5173`. Login as admin user. Click "AI Insights" in sidebar.

**NOT YET BROWSER-TESTED** — see Bug 1, 2, 3 in `01_CURRENT_STATE.md` for known display issues that will appear.

---

## Demo-Ready Moments (When Fixed)

1. **Smoke test output** — pastes cleanly into a terminal. Shows structured DCF events, golden path, severity=critical.
2. **MCP integration test** — shows real tool listing (9 tools) and real Q4 2024 analytics data being retrieved.
3. **`tsc --noEmit` passing on all 3 packages** — clean TypeScript.
4. **API route listing** — `GET /api/health` proves API is running.

---

## What Is NOT Demo-Ready

- Browser UI (type mismatches will show blank fields)
- Investigation flow (page always shows "not found")
- Any real LLM provider
- Real MongoDB-backed MCP data

---

## Exact File Paths for Tests

```
API/src/modules/ai/__tests__/smoke.test.ts          — Unit smoke test (no external deps)
API/src/modules/ai/__tests__/mcp.integration.test.ts — Real MCP process integration test
```
