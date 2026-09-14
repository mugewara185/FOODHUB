# Architecture Decision Records

Non-obvious choices made during implementation, with reasoning.

---

## ADR-001: stdio MCP Transport (not HTTP/SSE)

**Decision:** The MCP client spawns the MCP server as a child process and communicates via stdio JSON-RPC 2.0. Not HTTP, not WebSocket, not SSE.

**Why:**
- The existing `mcp/src/index.ts` already uses stdio transport exclusively.
- The MCP spec explicitly supports stdio for local server-client communication.
- Adding HTTP/SSE transport would require modifying the existing MCP server (violates "do not redesign").
- stdio is simpler — no ports, no network, no authentication between API and MCP.
- The MCP README already says: "The React frontend is never the MCP client" and shows the backend API as the client.

**Trade-off:** The MCP server cannot be deployed as a separate microservice with this approach. To deploy separately, you'd need to add HTTP transport to the MCP server first.

**If changing:** Add `StreamableHTTPServerTransport` or `SSEServerTransport` to `mcp/src/index.ts` and update `MCPClient` to use `StreamableHTTPClientTransport`.

---

## ADR-002: Mock Provider First, Real Provider Later

**Decision:** Implemented `MockAIProvider` that fully exercises the `AIProvider` interface before implementing real Claude/OpenAI.

**Why:**
- No API credentials available in the development environment.
- The spec explicitly states: "If no live provider credentials are available, implement a provider-compatible mock." and "The mock must exercise the SAME orchestration interfaces."
- Allows the full golden path to be runtime-verified without an API key.
- The `AIProvider` interface is the contract — swapping providers requires only creating a new class.

**What the mock does vs. real:**
- Mock: deterministic insights based on keyword matching in the question.
- Real: LLM reasoning over evidence context — non-deterministic, much richer.

**Critical:** The mock does NOT skip the MCP tool calls. The evidence is always collected before the provider is called. This is the spec requirement: "No fake shortcuts like Admin → hardcoded AI response."

---

## ADR-003: MCP Tools Live in mcp/src/tools/

**Decision:** New tools (`get_restaurant_performance`, `get_cancellation_metrics`, `analyze_restaurant_performance`) were added to the existing `mcp/src/tools/` directory and registered in the existing `mcp/src/server.ts`.

**Why:**
- The spec says "Do NOT create a second MCP server."
- The existing tool pattern is clear (register function, Zod validation, `analyticsService` call, JSON text content return).
- All tools share `analyticsService` — co-location is correct.

**Convention followed:**
- `// @ts-nocheck` at top (existing pattern, MCP SDK uses loose types)
- `register*Tool(server: McpServer)` export pattern
- Default dates: `from='2024-10-01'`, `to='2024-12-31'`

---

## ADR-004: AIAgent Tool Planning via String Matching

**Decision:** The AIAgent decides which MCP tools to call by pattern-matching the user question against known restaurant names and keywords.

**Why:** The spec does not require full intent classification. For the skeleton phase, string matching is sufficient and avoids adding NLP dependencies. Known restaurant names are hardcoded from the mock data.

**Known limitation:** Only recognizes 20 restaurant names that were visible in the mock data comments in the prompts file. If mock data adds more restaurants, the list in `ai.agent.ts` must be updated.

**`planToolCalls()` in `ai.agent.ts`:**
```
Contains restaurant name → analyze_restaurant_performance + get_restaurant_performance + get_cancellation_metrics
Contains "cancel"        → get_cancellation_metrics + get_analytics_summary
Contains "trend"/"revenue" → get_analytics_summary + analyze_trend
Contains "top"/"best"    → get_top_entities + get_analytics_summary
Default                  → get_analytics_summary + get_metrics
```

**To improve:** Replace with a proper intent classifier or a two-step LLM call (classify intent → select tools) in a later phase.

---

## ADR-005: crypto.randomUUID() Instead of uuid Package

**Decision:** Used `import { randomUUID } from 'crypto'` (Node.js built-in) instead of the `uuid` npm package.

**Why:** The `uuid` package was not in `API/package.json`. Adding a dependency to generate UUIDs is wasteful when Node 18+ provides `crypto.randomUUID()` natively. The web/ package DOES have `uuid` for client-side use.

---

## ADR-006: Frontend AIInsight Type Not Shared with Backend

**Decision:** The frontend `adminAiApi.ts` defines its own `AIInsight` interface instead of importing from the backend.

**Why:** The frontend is a separate Vite app — it cannot import TypeScript from the API directory directly. Sharing types would require a third shared package (monorepo) which was not set up.

**Trade-off:** Type drift between frontend and backend. This is exactly how Bug 1 (entityName vs entity.name) and Bug 3 (name vs toolName) occurred.

**To fix long-term:** Create a shared `packages/ai-types/` package that both `API/` and `web/` import. Or generate types via `tsc --declaration` from the backend and copy them to the frontend build step.

---

## ADR-007: No New MongoDB Collections

**Decision:** AI conversation state is stored in Redux (in-memory) only. No MongoDB collections were created for AI.

**Why:** The spec explicitly states "Do not create new MongoDB collections merely for the AI architecture." This is correct — conversation history that doesn't need to persist across page loads should live in Redux.

**Trade-off:** Conversations are lost on page reload. Investigation results are lost on navigation. This is acceptable for skeleton phase.

---

## ADR-008: MCP_SERVER_PATH Defaults to Relative Path

**Decision:** When `MCP_SERVER_PATH` env var is empty, MCPClient resolves to `path.join(process.cwd(), '..', 'mcp', 'dist', 'index.js')`.

**Why:** The MCP server is a sibling of the API directory: `zom2/API` and `zom2/mcp`. If the API is started from `zom2/API`, `process.cwd()` is `API/`, so `../mcp/dist/index.js` correctly resolves to `zom2/mcp/dist/index.js`.

**Risk:** If API is started from `zom2/` (the root), `process.cwd()` would be `zom2/` and the path would incorrectly resolve to `zom2/mcp/dist/index.js` → wait, that's actually the same. Let me re-check: `process.cwd() = 'c:/Aa/vs_Code/mern projects/zom2/API'`, so `../mcp/` = `c:/Aa/vs_Code/mern projects/zom2/mcp/`. This IS correct.

**Actual risk:** If someone runs `npx ts-node` or the binary from the root `zom2/` directory, cwd is `zom2/` and `'..', 'mcp'` would resolve to a sibling of `zom2` — wrong. Set `MCP_SERVER_PATH` explicitly to avoid this.

---

## ADR-009: Deviations from Original Spec

**What was NOT built (per spec constraints):**
- No elaborate chat UX — AdminAIPage is functional, not polished
- No animations
- No RAG / vector DBs / Redis / Kafka / microservices
- No second MCP server
- No real-time streaming (all requests are request/response)

**What was added beyond the explicit spec:**
- `analyze_restaurant_performance` MCP tool — not in the original spec but clearly needed for the golden path
- `get_restaurant_performance` and `get_cancellation_metrics` tools — made the evidence much richer for the mock provider to parse
- `AIEvidence` type with `toolCallId` correlation — added for debugging and traceability
- `AILogger.startTimer()` utility — clean duration measurement pattern
