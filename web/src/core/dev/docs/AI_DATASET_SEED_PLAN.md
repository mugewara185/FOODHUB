# FoodHub AI Dataset Seed Plan

## Overview

The factory seed system (`core/dev/utils/factorySeed.ts`) generates a coherent,
relational development dataset suitable for the next phase of FoodHub:

```
DB → API → MCP Tools → AI Client → Admin/Analytics UI
```

One Dev Console seed operation produces a dataset that supports AI reasoning over
restaurant performance, customer behaviour, order analytics, and review sentiment.

---

## Seed Lifecycle

```
seed:start
    └─ seed:users:start   → seed:users:complete
    └─ seed:restaurants:start → seed:restaurants:complete
    └─ seed:orders:start  → seed:orders:complete
    └─ seed:reviews:start → seed:reviews:complete
    └─ seed:payload:ready (→ POST /api/dev/seed-factory-data)
         └─ [backend] seed:{Model}:start → seed:{Model}:complete (console.log)
```

Logger events use the DCF `logger` instance from `core/dev/logger`.
Backend lifecycle is logged to the Node.js console (not the DCF logger).

---

## Generated Entities

| Entity | Count | Notes |
|--------|-------|-------|
| Users | 6 fixed + N extra | Admin, Dev, Customers, Owner |
| Restaurants | 8 fixed (template-driven) | Menu items embedded |
| Menu Items | 5–10 per restaurant | Embedded in `Restaurant.menu[]` |
| Orders | Configurable (default 80) | Weighted by restaurant scenario |
| Reviews | Configurable (default 60) | One per (user, restaurant) pair |

---

## Relationship Strategy

All IDs are generated as 24-char hex MongoDB ObjectIds via `generateObjectId()`.
References are resolved from the same generated set before sending to the backend.

```
User._id ──────────────────────────────────────────────┐
                                                        ▼
Restaurant._id ──────────────────────┐     Order.userId / restaurantId
Restaurant.menu[]._id (embedded)     │     Review.userId / restaurantId
         │                           │
         └─ Order.items[].menuItemId ┘
         └─ User.favoriteRestaurants[]
```

**Unique constraint respected:** The Review model has `{ userId, restaurantId }` unique index.
The seed generator tracks all (userId, restaurantId) pairs and skips duplicates.

---

## Performance Scenarios (AI/MCP Signals)

| Restaurant | Scenario | Rating | Order Weight | Cancel Rate | Review Theme |
|-----------|----------|--------|--------------|-------------|--------------|
| The Golden Spoon | `strong` | ~4.7 | 3× | ~5% | Positive |
| Sushi Dreams | `declining` | ~4.3 (dropping) | 3× | Increases from 5% to 35% | Recent complaints, past positive |
| Spice Garden | `underperformer` | ~2.8 | 2× | ~30% | Negative (cold food, wrong orders) |
| Curry Kitchen | `underperformer` | ~2.5 | 2× | ~30% | Negative |
| Burger Hub Express | `popular_problematic` | ~3.4 | 4× | ~15% | Delivery complaints |
| Pasta Perfetto | `improving` | ~4.1 (rising) | 3× | Drops from 25% to 5% | Past complaints, recent positive |
| Noodle House | `average` | ~3.8 | 2× | ~10% | Mixed |
| Taco Fiesta | `average` | ~3.9 | 2× | ~10% | Mixed, currently closed |

### Temporal Signals (Trend Analysis)

The dataset generates events over a 90-day period. Temporal scenarios (`improving`, `declining`) have explicit inflection points:
- `declining` shows increased cancellations and lower ratings in the most recent 30 days.
- `improving` shows decreased cancellations and higher ratings in the most recent 30 days.

This allows AI/MCP tools to detect trends and answer questions like: "Which restaurant is currently struggling?" or "Are cancellations increasing for Sushi Dreams?"

---

## Schema Alignment (Backend Constraints)

All factory outputs are validated against actual Mongoose schemas before seeding:

| Field | Constraint | Factory Compliance |
|-------|------------|-------------------|
| `Review.rating` | `min: 1, max: 5` | `clampRating()` applied, always 1–5 |
| `Order.paymentMethod` | `['cash', 'card', 'upi']` | Only these values generated |
| `User.roles` | `['user', 'admin', 'owner', 'partner', 'dev']` | Backend enum used |
| `User.addresses[].type` | `['home', 'work', 'other']` | Correct values used |
| `Order.status` | 6-value enum | All 6 values, distributed by scenario |
| `Order.items[].quantity` | `min: 1` | `randomInt(1, 3)` |
| `Review.comment` | `maxlength: 1000` | All templates under 200 chars |
| `Restaurant.phone` | required | Always provided |
| `Order.deliveryAddress` | required | User's address or fallback |

---

## Seeding Behaviour

- `clearFirst: true` on all collections (default) — full reseed every time
- Data cleared in order: Users → Restaurants → Orders → Reviews
- Production guard: `config.nodeEnv === 'production'` throws 403
- Dev endpoint: `POST /api/dev/seed-factory-data` (no auth required, dev only)

---

## What Notifications / Favourites Seed

- **Favourites:** Embedded in `User.favoriteRestaurants[]` — each customer user
  gets 1–3 random restaurant ObjectIds as favourites. No separate collection.
- **Notifications:** A minimal backend `Notification` model was created (`API/src/modules/notifications/notification.model.ts`).
  It tracks `userId`, `title`, `message`, `type` ('success', 'warning', etc.), and `isRead`.
  Notifications are seeded alongside orders/reviews to simulate operational events over the 90-day period.
  Azure Service Bus is intentionally omitted at this stage; this serves as the foundational data model for UI and AI querying.

---

## MCP Tool Readiness

The seeded data supports the following future MCP tool queries without any DB changes:

```
get_restaurant_performance(restaurantId)
  → aggregate: orders count, revenue, cancellation rate, avg delivery time

get_restaurant_reviews(restaurantId)
  → find: reviews sorted by date, with rating distribution

get_restaurant_metrics(restaurantId)
  → join: orders + reviews aggregated by restaurant

get_top_restaurants(limit, period)
  → aggregate: by revenue/order count in timeframe

get_negative_review_trends()
  → find: reviews with rating <= 2, extract comment themes

get_cancellation_metrics()
  → aggregate: cancelled orders by restaurant, user, time

get_customer_metrics(userId)
  → aggregate: orders by user, total spend, favourite cuisines
```

---

## Files

| File | Role |
|------|------|
| `web/src/core/dev/utils/factorySeed.ts` | Primary seed builder — coherent relational dataset |
| `web/src/core/data/factories/unifiedFactory.ts` | Legacy standalone generators (rating bug fixed) |
| `web/src/core/data/Corefactory/Factory.ts` | Generic Factory class + `generateObjectId()` |
| `web/src/core/dev/ui/modals/FloatingDevConsole.tsx` | Dev Console UI with seed controls |
| `API/src/modules/dev/dev.controller.ts` | Generic seed endpoint — schema-agnostic |
| `API/src/modules/dev/dev.routes.ts` | `POST /api/dev/seed-factory-data` |

---

## Verification Status

- **STATICALLY VERIFIED:** All generated values comply with backend schema constraints.
- **STATICALLY VERIFIED:** TypeScript passes with exit 0 (both frontend and backend).
- **⚠️ RUNTIME VERIFICATION REMAINS:** Actual MongoDB insertion and result inspection
  requires running the servers and invoking the seed from the Dev Console.
