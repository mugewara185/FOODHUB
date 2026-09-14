# Data and MCP Truth

---

## Where Does MCP Get Its Data?

**Source:** In-memory mock arrays loaded at process start from `mcp/src/data/`.

**Files:**
```
mcp/src/data/index.ts          — re-exports all mock data
mcp/src/data/orders.data.ts    — MOCK_ORDERS: ~60 orders, Q4 2024
mcp/src/data/restaurants.data.ts — MOCK_RESTAURANTS: 20 restaurants, 6 cities
mcp/src/data/users.data.ts     — MOCK_USERS: 20 users
```

**Key facts:**
- Date range: **2024-10-01 to 2024-12-31 ONLY**. Any date range outside this returns 0 or empty results.
- All dates must use this range for meaningful data.
- The data is loaded ONCE when the MCP process starts. No database connection. No file reads at query time.
- Spice Garden in real mock data is **rank #3** with revenue ₹3750 (NOT rank #15 as in the smoke test mock). The smoke test uses its own hardcoded evidence.

**Service entry point:**
```
mcp/src/services/analytics.service.ts
```
Class `AnalyticsService`, singleton `export const analyticsService = new AnalyticsService()`.

**All 9 tools call this service. No tool queries MongoDB directly.**

---

## Where Does the API Backend Get Its Data?

**Source:** Real MongoDB via Mongoose.

**File:** `API/src/modules/analytics/analytics.service.ts`  
Uses models: `Order`, `Restaurant`, `User` from `API/src/modules/*/` directories.

This is a **completely separate** analytics service from the MCP one. The backend analytics service is used by the existing `/api/admin/analytics` routes. The AI module does NOT use it — the AI module calls the MCP server which uses the mock service.

---

## Are They the Same Source?

**NO.** They are divergent:

| | API Backend Analytics | MCP Analytics |
|--|--|--|
| Data source | MongoDB (real) | In-memory mock arrays |
| Schema | Mongoose `IOrder`, `IRestaurant`, `IUser` | Custom `MockOrder`, `MockRestaurant`, `MockUser` |
| Date coverage | All dates in DB | Q4 2024 only |
| Restaurant count | Whatever is seeded | 20 hardcoded |
| Update mechanism | Real-time (MongoDB reads) | Static (never changes without code deploy) |

The AI Agent uses **MCP → mock data**. The existing Admin dashboard uses **API → MongoDB**. They can show different numbers for the same restaurant. This is known and acceptable for the skeleton phase.

---

## What Would It Take to Make MCP Read from Real MongoDB?

### Option A: HTTP API Bridge (Recommended for simplicity)

MCP's `AnalyticsService` makes HTTP calls to the FoodHub API instead of reading mock data.

**Pros:** MCP stays stateless, no DB credentials needed in MCP process, reuses existing API auth.  
**Cons:** Adds network hop, MCP depends on API being running.

**Files to change:**
1. `mcp/src/services/analytics.service.ts` — replace mock data imports with `fetch()` calls to `http://localhost:5000/api/admin/analytics/...`
2. `mcp/.env` (new file) — add `API_BASE_URL=http://localhost:5000` and a service-to-service auth token
3. All `analyticsService` methods must be made `async` (currently some are synchronous)
4. All tool handlers must `await` the service calls (currently some don't await)

**Schema notes:** The existing API analytics endpoint returns different shape than MCP tools expect. Need adapter layer.

### Option B: Direct Mongoose Connection in MCP

MCP process connects to MongoDB directly.

**Pros:** No network hop, same data as API.  
**Cons:** MCP becomes stateful, needs its own DB credentials, Mongoose connection management.

**Files to change:**
1. `mcp/package.json` — add `mongoose`
2. `mcp/src/db/` [NEW] — connection module
3. `mcp/src/services/analytics.service.ts` — replace mock arrays with Mongoose queries
4. `mcp/.env` — add `MONGO_URI`

**Schema compatibility:** MCP uses `MockOrder.status` values like `'delivered' | 'cancelled'`. The Mongoose `IOrder` uses the same values (`'delivered' | 'cancelled' | 'pending' | 'preparing' | 'out_for_delivery'`). The mappings are compatible.

---

## Schema Assumptions MCP Tools Make (DOCUMENT THESE)

These are the assumptions baked into the 3 new tools. Breaking any of them without updating the tools will cause silent wrong results.

### `TopEntity` shape from `getTopRestaurants()`
```typescript
interface TopEntity {
  id: string;
  name: string;
  city: string;
  cuisine: string;
  orders: number;
  revenue: number;   // ← IMPORTANT: was .value in early version, now .revenue
  rating: number;
  rank: number;
}
```
The new tools reference `.revenue`. If this shape changes, `get_restaurant_performance.tool.ts` and `analyze_restaurant_performance.tool.ts` break silently.

### `SummaryStats` from `getSummary()`
```typescript
interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  // ...
}
```
`get_cancellation_metrics` uses `summary.cancellationRate`, `summary.totalOrders`, `summary.cancelledOrders`, `summary.deliveredOrders`.

### Restaurant name matching
All 3 new tools use `r.name.toLowerCase().includes(restaurantName.toLowerCase())` for lookup. This means:
- Partial matches work: "Spice" matches "Spice Garden"
- Multiple matches possible: "The" matches "The Biryani Co.", "The Cake Studio", "The South Indian"
- First match wins — not ideal for common prefixes

### Cancellation rate heuristic
`get_cancellation_metrics` estimates per-restaurant cancellation as: `platformRate * (5 / restaurant.rating)`. Higher-rated restaurants get lower estimated cancellation. This is a proxy, not real order data.

---

## Date Range Constraints

**ALWAYS use `from: '2024-10-01', to: '2024-12-31'` for MCP tool calls.**

The AI Agent defaults to this range for all tool calls. The MCP tools default to this range if no dates are provided.

If Gemini adds any new tool calls in `ai.agent.ts`, use the same `DEFAULT_FROM = '2024-10-01'` and `DEFAULT_TO = '2024-12-31'` constants already defined in the agent.
