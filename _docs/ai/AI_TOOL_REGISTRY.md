# AI Tool Registry

## FoodHub MCP Server — Complete Tool Catalog

Server: `foodhub-analytics` v1.0.0  
Transport: stdio (JSON-RPC 2.0)  
Data Coverage: Q4 2024 (2024-10-01 to 2024-12-31) — mock data

---

## Original Tools (6)

### `get_analytics_summary`
**Status**: ✅ Implemented | Runtime Verified

Returns platform KPI snapshot: revenue, orders, delivery rate, cancellation rate, AOV, top city/cuisine.

```json
Input: { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }
Output: { "scope", "metrics": { "revenue", "orders", "averageOrderValue", "users", "platform" } }
```

---

### `get_metrics`
**Status**: ✅ Implemented | Runtime Verified

Retrieves specific metrics: `revenue | orders | platform_fees | avg_order_value | cancellation_rate`

```json
Input: { "metrics": ["revenue", "orders"], "from": "...", "to": "..." }
Output: { "scope", "results": { "revenue": { "value", "unit" } } }
```

---

### `compare_periods`
**Status**: ✅ Implemented

Period-over-period comparison with interpretation text.

```json
Input: { "period": { "from", "to" }, "baseline": { "from", "to" } }
Output: { "metrics": { "revenue", "orders", "avgOrderValue", "cancellationRate" }, "interpretation" }
```

---

### `get_breakdown`
**Status**: ✅ Implemented

Revenue/orders breakdown by dimension: `city | cuisine | restaurant | payment_method | user_segment | order_status`

```json
Input: { "dimension": "restaurant", "from": "...", "to": "...", "limit": 10 }
Output: [{ "label", "revenue", "orders", "platformFees", "avgOrderValue", "share" }]
```

---

### `get_top_entities`
**Status**: ✅ Implemented | Runtime Verified

Ranked restaurants or users by revenue or order count.

```json
Input: { "entityType": "restaurant", "sortBy": "revenue", "limit": 5, "from": "...", "to": "..." }
Output: { "results": [{ "rank", "id", "name", "city", "cuisine", "orders", "revenue", "rating" }] }
```

---

### `analyze_trend`
**Status**: ✅ Implemented

Time-series with trend direction, peak/trough, percent change, volatility.

```json
Input: { "metric": "revenue", "from": "...", "to": "...", "granularity": "month" }
Output: { "series", "trend", "peakDate", "peakValue", "troughDate", "troughValue", "percentChange", "volatility" }
```

---

## New Tools (3) — Added for AI Platform

### `get_restaurant_performance`
**Status**: ✅ Implemented | Runtime Verified

Comprehensive performance snapshot for a named restaurant.

```json
Input: { "restaurantName": "Spice Garden", "from": "2024-10-01", "to": "2024-12-31" }
Output: {
  "restaurantName", "found": true,
  "performance": { "rank", "totalRestaurants", "revenue", "orders", "avgOrderValue", "revenueShare", "rating", "city", "cuisine" },
  "platformBenchmarks": { "avgRevenuePerRestaurant", "avgOrdersPerRestaurant", "avgRating", "avgCancellationRate" }
}
```

---

### `get_cancellation_metrics`
**Status**: ✅ Implemented | Runtime Verified

Cancellation rate analysis for platform or specific restaurant.

```json
Input: { "restaurantName": "Spice Garden" (optional), "from": "...", "to": "..." }
Output: {
  "scope", "period",
  "metrics": { "totalOrders", "cancelledOrders", "cancellationRate", "deliveredOrders", "deliverySuccessRate" },
  "orderStatusDistribution", "assessment": "above_benchmark"
}
```

---

### `analyze_restaurant_performance`
**Status**: ✅ Implemented | Runtime Verified

Primary tool for "Why is [restaurant] underperforming?" queries. Comprehensive multi-dimensional analysis.

```json
Input: { "restaurantName": "Spice Garden" }
Output: {
  "performanceScore": 0-100,
  "rank": { "position", "outOf", "percentile" },
  "revenue": { "total", "revenueShare", "benchmark" },
  "rating": { "current", "platformAvg", "assessment" },
  "trend": { "octToNov", "novToDec" },
  "issues": [{ "type", "severity", "detail" }],
  "strengths": [],
  "recommendations": []
}
```

---

## Resources (3)

| URI | Description |
|-----|-------------|
| `foodhub://analytics/metric-definitions` | Metric meanings, units, calculation methods |
| `foodhub://analytics/dimensions` | Valid breakdown dimensions and available values |
| `foodhub://analytics/data-coverage` | Date range, record counts, data source caveats |

---

## Prompts (2)

| Name | Description |
|------|-------------|
| `weekly_business_review` | Structured weekly report template |
| `restaurant_performance_audit` | Deep-dive restaurant analysis template |

---

## Tool Selection Logic (in AIAgent)

| Question Pattern | Tools Called |
|-----------------|--------------|
| Contains restaurant name | `analyze_restaurant_performance`, `get_restaurant_performance`, `get_cancellation_metrics` |
| Contains "cancel" | `get_cancellation_metrics`, `get_analytics_summary` |
| Contains "trend" or "revenue" | `get_analytics_summary`, `analyze_trend` |
| Contains "top" or "best" or "perform" | `get_top_entities`, `get_analytics_summary` |
| General/default | `get_analytics_summary`, `get_metrics` |

---

## Data Coverage

| Dataset | Count | Date Range |
|---------|-------|-----------|
| Restaurants | 20 (6 cities) | Static |
| Orders | 60 | 2024-10-01 → 2024-12-31 |
| Users | 20 (4 segments) | Joined 2022-2024 |

> All date-range queries must use dates within **2024-10-01 to 2024-12-31** to return data.
