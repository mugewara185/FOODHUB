# Data Types Consolidation & Unified Factory System

## ✅ COMPLETED REFACTORING

### 1. Type System Consolidation

#### **Problem Identified:**
- **7 Different Versions** of the same types across multiple files
- **Duplicates:** User, Restaurant, FoodItem, Cart, Order types defined 2-3 times each
- **Conflicts:** Different property signatures for same types
  - `CartItem` had 2 incompatible definitions
  - `Restaurant.location` was `{ lat, lng }` vs `string` vs `Coordinates`
  - `User` role field had ['admin' | 'user' | 'instructor'] vs ['admin' | 'restaurant_owner' | 'user' | 'delivery_partner']
- **Unused Types:** Course, Lesson, QuizQuestion, Resource (from abandoned courseware feature)
- **Inconsistent Naming:** `geoLocation` vs `location`, `addons` type mismatches

#### **Solution:**
- ✅ Centralized single source of truth: **`src/core/types/index.ts`**
- ✅ All other type files now re-export from core/types
- ✅ Removed duplicate definitions
- ✅ Commented out unused future types (kept for reference)
- ✅ Standardized property naming and types

---

### 2. Type File Structure After Refactor

```
src/
├── core/types/
│   └── index.ts         → MAIN HUB (300+ lines, well-organized)
│       ├── 1. User & Auth Types
│       ├── 2. Restaurant & Location Types
│       ├── 3. Food Item Types
│       ├── 4. Cart & Checkout Types
│       ├── 5. Order Types
│       ├── 6. Review Types
│       ├── 7. Delivery & Logistics
│       ├── FUTURE FEATURES (Commented)
│       └── Factory Input Interface
│
└── data/types/
    ├── index.ts         → Re-exports from core + UI types
    ├── auth.ts          → Auth-specific types + re-exports
    ├── food.ts          → Re-exports from core (deprecated)
    └── location.ts      → Re-exports from core (deprecated)
```

---

### 3. Consolidated Type Definitions

#### **CORE TYPES (Single Source of Truth)**

```typescript
// 1. USER & AUTHENTICATION
- User (id, name, email, phone, avatar, role, isActive, etc.)
- AuthUser extends User (+ token, refreshToken, permissions)
- UserRole = 'admin' | 'restaurant_owner' | 'user' | 'delivery_partner'
- Permission (15 different permission types)

// 2. RESTAURANT & LOCATION
- Coordinates { lat, lng }
- OpeningHours { day, open, close }
- ContactInfo { phone, email }
- Restaurant (complete definition with all properties)

// 3. FOOD ITEMS
- Addon { id, name, price, isAvailable }
- Variant { id, name, price }
- DietaryInfo { calories, protein, carbs, fat }
- FoodItem (with optional addons, variants, dietary info)
- MenuItem (lightweight version)
- Category (for menu organization)

// 4. CART
- CartItem (standard cart entry)
- CustomizedCartItem extends CartItem (with full foodItem reference)
- Cart (userId, restaurantId, items[], totals, coupon)

// 5. ORDERS
- OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
- PaymentMethod = 'card' | 'upi' | 'wallet' | 'cash_on_delivery'
- PaymentStatus = 'pending' | 'completed' | 'failed'
- OrderItem (foodItemId, name, quantity, price, addons)
- DeliveryInfo (address, coordinates, estimatedTime)
- Order (complete with all fields)

// 6. REVIEWS
- Review (id, userId, restaurantId, rating, comment, photos, helpful/unhelpful)

// 7. DELIVERY & LOGISTICS
- DeliveryPartner (full details for delivery partner)
- LiveTracking (real-time order tracking data)
```

#### **FUTURE TYPES (Commented Out, Ready to Uncomment)**

```typescript
// FAVORITES & PERSONALIZATION
- Favorite, SearchHistory, RecentView

// PAYMENTS & BILLING  
- SavedPaymentMethod, Invoice, Coupon

// RESTAURANT MANAGEMENT
- RestaurantBranch, RestaurantStats, RestaurantOwnerPanel

// ADMIN & MODERATION
- Report, AdminActivity, SuspendedUser

// ANALYTICS
- AnalyticsEvent, UserPreferences, PushNotification
```

---

### 4. Factory Input Interface (For Configuration-Based Generation)

```typescript
export interface FactoryInput {
  restaurants: RestaurantFactoryInput[];
  foodItems: FoodItemFactoryInput[];
  users: UserFactoryInput[];
  orders: OrderFactoryInput[];
  reviews: ReviewFactoryInput[];
}

// Custom inputs for each domain:
RestaurantFactoryInput {
  count?: number;
  cuisines?: string[];
  locations?: string[];
  priceRanges?: 'low' | 'medium' | 'high'[];
}

FoodItemFactoryInput {
  count?: number;
  categories?: string[];
  vegPercentage?: number;
  withAddons?: boolean;
  withVariants?: boolean;
}

UserFactoryInput {
  count?: number;
  roles?: UserRole[];
  includeTestAccounts?: boolean;
}

OrderFactoryInput {
  count?: number;
  statuses?: OrderStatus[];
  dateRange?: { from: string; to: string };
}

ReviewFactoryInput {
  count?: number;
  ratingRange?: { min: number; max: number };
}
```

---

### 5. Unified Factory System

#### **New File:** `src/data/factories/unifiedFactory.ts`

**Provides:**
- ✅ `generateAllDummyData(input: Partial<FactoryInput>)` — Single method to generate all data
- ✅ `factories` object — Individual generator functions (for selective use)
- ✅ Seed data (cuisines, restaurant names, locations, images)
- ✅ Full type safety with TypeScript

#### **Usage:**

```typescript
// Example 1: Generate with defaults (30 restaurants, 100 food items, 10 users, etc.)
const data = generateAllDummyData();

// Example 2: Custom configuration
const customData = generateAllDummyData({
  restaurants: { count: 50, cuisines: ['Italian', 'Mexican', 'Indian'] },
  foodItems: { count: 150, categories: ['Pizza', 'Burger'], vegPercentage: 40 },
  users: { count: 20, roles: ['user', 'delivery_partner'] },
  orders: { count: 100 },
  reviews: { count: 300 },
});

// Example 3: Individual factories
const restaurant = factories.restaurant(0);
const user = factories.user(5, ['restaurant_owner']);
const order = factories.order(10);
```

#### **Returns:**
```typescript
{
  restaurants: Restaurant[],
  foodItems: FoodItem[],
  users: User[],
  orders: Order[],
  reviews: Review[],
  metadata: {
    generatedAt: string,
    counts: { restaurants, foodItems, users, orders, reviews }
  }
}
```

---

### 6. Migration Guide

#### **Old Way (Individual Factories):**
```typescript
// Before: Multiple imports from separate files
import getRestaurants from './factories/restaurants';
import { menus } from './factories/menus';
import { users } from './factories/users';
import { orders } from './factories/orders';
import { reviews } from './factories/reviews';

// Problem: Hard to configure, need to modify each file
```

#### **New Way (Unified Factory):**
```typescript
// After: Single import, configurable generation
import { generateAllDummyData, factories } from '@/data/factories/unifiedFactory';

// Generate all data with one call
const allData = generateAllDummyData({
  restaurants: { count: 50 },
  foodItems: { count: 200, vegPercentage: 30 },
  users: { count: 15, includeTestAccounts: true },
});

// Or use individual factories
const singleRestaurant = factories.restaurant(0);
```

---

### 7. Files Modified/Created

#### **Modified Files:**
1. ✅ `src/core/types/index.ts` — Complete rewrite (300+ lines)
   - Organized into 7 sections with clear comments
   - Future types section (commented out)
   - Factory input interfaces
   
2. ✅ `src/data/types/index.ts` — Re-exports only
   - Imports from core/types
   - Removes unused courseware types (commented out)
   - Keeps UI-specific types
   
3. ✅ `src/data/types/auth.ts` — Refactored
   - Re-exports User, AuthUser, UserRole, Permission from core
   - Keeps auth-specific request/response types
   - Added RoleConfig interface
   
4. ✅ `src/data/types/food.ts` — Simplified to re-exports
   - All complex types now come from core/types
   - File serves as convenience import point
   
5. ✅ `src/data/types/location.ts` — Simplified to re-exports
   - Removed duplicate DeliveryRoute, DeliveryStep, MapMarker
   - Re-exports Coordinates, DeliveryPartner, LiveTracking

#### **New Files:**
1. ✅ `src/data/factories/unifiedFactory.ts` — Brand new (400+ lines)
   - Main factory generation system
   - 6 generator functions (restaurant, foodItem, user, order, review, addon/variant)
   - Seed data and helper functions
   - Full documentation with examples

---

### 8. Type Safety Improvements

#### **Before:**
```typescript
// ❌ Confusing: CartItem in core/types has different structure than in food.ts
export interface CartItem {  // core/types
  id: string;
  foodItemId: string;
  name: string;
  // ...
}

export interface CartItem {  // food.ts
  id: string;
  foodItem: FoodItem;  // Full object instead of ID!
  selectedAddons: Addon[];  // Not optional!
  // ...
}
```

#### **After:**
```typescript
// ✅ Clear: Single definition with variants
export interface CartItem {
  id: string;
  foodItemId: string;
  name: string;
  // ... basic properties
}

export interface CustomizedCartItem extends CartItem {
  foodItem: FoodItem;  // Extends with full object
  selectedAddons?: Addon[];  // Optional
  selectedVariant?: Variant | null;
}
```

#### **Before:**
```typescript
// ❌ Inconsistent naming and types
Restaurant.location?: string
vs
Restaurant.geoLocation?: { lat, lng }
vs
Restaurant.location: { lat, lng }
```

#### **After:**
```typescript
// ✅ Single standardized format
Restaurant.location: Coordinates  // { lat, lng }
Restaurant.geoLocation: undefined  // Removed

Coordinates {
  lat: number;
  lng: number;
}
```

---

### 9. Benefits of This Refactor

| Aspect | Before | After |
|--------|--------|-------|
| **Type Sources** | 7 files, duplicates | 1 core hub |
| **Conflicts** | CartItem defined 2 ways | Single definition + extension |
| **Naming** | location vs geoLocation | Single: location: Coordinates |
| **Factory** | 6 separate files to modify | 1 unified method |
| **Configuration** | Hard-coded in each factory | FactoryInput interface |
| **Future Types** | Scattered comments | Organized commented section |
| **Type Safety** | Multiple definitions possible | Single source of truth |
| **IDE Support** | Confusing duplicates | Clear imports from one place |

---

### 10. Next Steps for Integration

#### **1. Update Existing Imports:**
```typescript
// Old
import type { Restaurant, FoodItem } from '@/core/types';
import type { CartItem } from '@/data/types/food';

// New
import type { Restaurant, FoodItem, CartItem } from '@/core/types';
// or
import type { Restaurant, FoodItem, CartItem } from '@/data/types';
```

#### **2. Replace Factory Usage:**
```typescript
// Old: Import individual factories
import getRestaurants from './factories/restaurants';
import { menus } from './factories/menus';

// New: Use unified factory
import { generateAllDummyData } from '@/data/factories/unifiedFactory';

const { restaurants, foodItems, users, orders, reviews } = generateAllDummyData({
  restaurants: { count: 30 },
  foodItems: { count: 100 },
});
```

#### **3. Enable Future Features:**
```typescript
// When ready, uncomment and implement:
// - Favorites (Favorite, SearchHistory, RecentView)
// - Payments (SavedPaymentMethod, Invoice, Coupon)
// - Admin features (Report, AdminActivity, SuspendedUser)
```

---

### 11. Summary

✅ **All types consolidated into single location** (`src/core/types/index.ts`)  
✅ **Factory system unified** (one method, configurable input)  
✅ **Duplicates eliminated** (CartItem, User, Restaurant, Order, etc.)  
✅ **Future types organized** (commented section with clear structure)  
✅ **Type safety improved** (single source of truth, no conflicts)  
✅ **Code reusability** (FactoryInput interface for configuration)  
✅ **Developer experience** (clear file structure, good comments)  

**The app now has a clean, scalable type system ready for:**
- Easy mock data generation
- Backend API integration
- Future feature additions
- Team collaboration without type conflicts
