# Framework Quick Reference & Code Examples

## 🔥 QUICK START (5 minutes)

### Setup
```bash
npm install @org/react-dev-framework
```

### Basic Usage
```ts
// 1. Setup
import { DataFactory, Logger, useApi } from '@org/react-dev-framework';

const factory = new DataFactory();
const logger = new Logger({ minLevel: 'DEBUG' });

// 2. Define Schema
factory.schema('user', {
  id: 'uuid',
  name: 'fullName',
  email: 'email',
  createdAt: 'pastDate',
});

// 3. Generate Data
const users = factory.create('user', { count: 10 });

// 4. Use in Component
const MyComponent = () => {
  const { data, loading, error } = useApi(
    () => fetch('/api/users').then(r => r.json()),
    { autoFetch: true }
  );

  return (
    <div>
      {data?.map(u => <UserCard key={u.id} user={u} />)}
    </div>
  );
};

// 5. Debug
logger.info('app:start', 'App initialized', { userCount: users.length });
```

---

## 📋 COMMON PATTERNS

### Pattern 1: Restaurant Listing App

#### Schema Definition
```ts
// schemas/restaurant.ts
import { factory } from '@/framework';

factory.schema('restaurant', {
  id: 'uuid',
  name: 'company.name',
  rating: { 
    generator: () => parseFloat((Math.random() * 2 + 3).toFixed(1)) 
  },
  cuisines: {
    generator: (ctx) => {
      const cuisines = ['Italian', 'Indian', 'Chinese', 'Thai'];
      return [cuisines[ctx.index % cuisines.length]];
    }
  },
  deliveryTime: {
    generator: () => `${Math.floor(Math.random() * 30) + 20}-${Math.floor(Math.random() * 30) + 50} min`
  },
  image: 'imageUrl',
  isOpen: 'boolean',
  minOrder: {
    generator: () => (Math.floor(Math.random() * 10) + 1) * 100
  },
});

factory.schema('foodItem', {
  id: 'uuid',
  name: { generator: (ctx) => ctx.faker.commerce.productName() },
  price: {
    generator: () => Math.floor(Math.random() * 500) + 50
  },
  restaurantId: 'uuid',
  category: {
    enum: ['Pizza', 'Burger', 'Indian', 'Chinese', 'Dessert']
  },
  image: 'imageUrl',
  vegetarian: 'boolean',
});
```

#### Component Usage
```tsx
// features/RestaurantList.tsx
import { useFactory } from '@org/react-dev-framework';
import { logger } from '@/framework';

export const RestaurantList = () => {
  const [useDevData, setUseDevData] = useState(true);
  const { data: restaurants, loading, error } = useApi(
    useDevData
      ? () => {
          logger.debug('data:dev', 'Using factory data for restaurants');
          return Promise.resolve(
            factory.create('restaurant', { count: 20 })
          );
        }
      : () => fetch('/api/restaurants').then(r => r.json()),
    {
      autoFetch: true,
      onSuccess: (data) => {
        logger.info('restaurants:loaded', 'Restaurants loaded', { count: data.length });
      },
    }
  );

  return (
    <div>
      <button onClick={() => setUseDevData(!useDevData)}>
        {useDevData ? 'Switch to Real API' : 'Use Mock Data'}
      </button>

      {loading && <Spinner />}
      {error && <ErrorBoundary error={error} />}

      <div className="grid">
        {restaurants?.map(r => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </div>
  );
};
```

---

### Pattern 2: Redux Integration

#### Store Setup
```ts
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { factory, logger } from '@/framework';

// Redux logger middleware
const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
  const prevState = store.getState();
  logger.debug(
    `redux:action:${action.type}`,
    `Dispatched ${action.type}`,
    action.payload
  );

  const result = next(action);

  logger.debug(
    `redux:state:${action.type.split('/')[0]}`,
    `State updated`,
    store.getState()
  );

  return result;
};

const store = configureStore({
  reducer: {
    restaurants: restaurantReducer,
    cart: cartReducer,
    auth: authReducer,
  },
  middleware: (getDefault) => getDefault().concat(loggerMiddleware),
  preloadedState: {
    restaurants: {
      items: factory.create('restaurant', { count: 20 }),
      loading: false,
      error: null,
    },
    cart: {
      items: [],
      total: 0,
    },
  },
  devTools: import.meta.env.DEV,
});

export default store;
```

#### Logging Actions
```ts
// features/cart/cartSlice.ts
import { logger } from '@/framework';

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      logger.info('cart:addItem', 'Item added to cart', {
        itemId: action.payload.itemId,
        quantity: action.payload.quantity,
      });
      state.items.push(action.payload);
      // Calculate total
    },

    removeItem: (state, action) => {
      logger.info('cart:removeItem', 'Item removed from cart', {
        itemId: action.payload,
      });
      state.items = state.items.filter(i => i.id !== action.payload);
    },

    checkout: (state, action) => {
      logger.info('cart:checkout', 'Checkout initiated', {
        itemCount: state.items.length,
        total: state.total,
      });
      state.items = [];
      state.total = 0;
    },
  },
});
```

---

### Pattern 3: API Integration with Logging

#### API Client
```ts
// services/api.ts
import { apiLogger } from '@org/react-dev-framework/logging';

class ApiClient {
  async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    apiLogger.request(method, endpoint, data);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });

      const body = await response.json();

      apiLogger.response(method, endpoint, response.status, body);

      if (!response.ok) {
        throw new Error(`${response.status}: ${body.message}`);
      }

      return body;
    } catch (error) {
      apiLogger.error(endpoint, error);
      throw error;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, data: any) {
    return this.request<T>('POST', endpoint, data);
  }

  put<T>(endpoint: string, data: any) {
    return this.request<T>('PUT', endpoint, data);
  }

  delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }
}

export const api = new ApiClient();
```

#### Usage in Hooks
```ts
// hooks/useRestaurants.ts
import { api } from '@/services/api';

export const useRestaurants = (options?: { useDevData?: boolean }) => {
  const fetchRestaurants = useCallback(async () => {
    if (options?.useDevData) {
      const restaurants = factory.create('restaurant', { count: 20 });
      return Promise.resolve(restaurants);
    }
    return api.get('/api/restaurants');
  }, [options?.useDevData]);

  return useApi(fetchRestaurants, {
    autoFetch: true,
    onSuccess: (data) => {
      logger.info('restaurants:loaded', 'Fetched from API', { count: data.length });
    },
  });
};
```

---

### Pattern 4: Error Handling & Logging

#### Error Boundary
```tsx
// components/ErrorBoundary.tsx
import { logger } from '@/framework';

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.critical(
      'component:errorBoundary',
      `${error.name}: ${error.message}`,
      {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }
    );

    // Send to error tracking service
    sendToSentry(error);
  }

  render() {
    // Fallback UI
  }
}
```

#### API Error Handling
```ts
// utils/apiError.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    logger.warn('api:auth', 'Unauthorized - redirecting to login');
    // Redirect to login
  } 
  
  if (error.response?.status === 500) {
    logger.critical('api:server', 'Server error', error.response.data);
    // Show error page
  }

  if (error.code === 'ECONNABORTED') {
    logger.error('api:timeout', 'Request timed out', { endpoint: error.config?.url });
    // Retry logic
  }
};
```

---

## 🐛 DEBUGGING RECIPES

### Recipe 1: Track Data Flow Through Redux

```ts
// In browser console:
window.__DEV__.logger.getByNamespace('redux:.*');
// Output all Redux-related logs

window.__DEV__.logger.getLogs({
  namespace: 'redux:action:cart.*',
  level: 'INFO'
});
// Get all cart action logs
```

### Recipe 2: Find API Errors

```ts
window.__DEV__.logger.getLogs({
  namespace: 'api:.*',
  level: ['WARN', 'ERROR']
});
// All API errors in current session
```

### Recipe 3: Performance Analysis

```ts
const stats = window.__DEV__.logger.stats();
console.table(stats.byNamespace);
// See which operations logged most

const apiLogs = window.__DEV__.logger.getByNamespace('api:.*');
const avgDuration = apiLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / apiLogs.length;
console.log(`Average API response: ${avgDuration}ms`);
```

### Recipe 4: Component Lifecycle Tracking

```ts
window.__DEV__.logger.getLogs({
  namespace: 'component:.*:Dashboard',
  level: 'DEBUG'
});
// Trace all Dashboard component lifecycle events
```

### Recipe 5: Export Logs for Analysis

```ts
const logs = window.__DEV__.logger.getLogs();
const csv = window.__DEV__.logger.export('csv');
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `logs-${Date.now()}.csv`;
a.click();
// Download logs for analysis
```

---

## 🎮 DEV MODE COMMANDS

### Enable Slow Network Simulation
```ts
window.__DEV__.api.setRandomDelay('*', 1000, 3000);
// All APIs now have 1-3 sec delay
```

### Simulate API Errors
```ts
window.__DEV__.api.setError('/api/restaurants', 500, 'Server error');
// Next request to /api/restaurants returns 500

window.__DEV__.api.setRandomError('/api/orders', 0.3);
// 30% chance of error on any /api/orders call
```

### Toggle Features
```ts
window.__DEV__.features.enable('darkMode');
window.__DEV__.features.enable('newCheckout');

if (window.__DEV__.features.isEnabled('newCheckout')) {
  // Use new checkout flow
}
```

### Regenerate Test Data
```ts
window.__DEV__.factory.seed(12345);
const newUsers = window.__DEV__.factory.create('user', { count: 50 });
// Deterministic: same seed = same data
```

### Pause/Resume Logging
```ts
window.__DEV__.logger.pause();
// Stop logging
// ... do work without logging noise
window.__DEV__.logger.resume();
// Resume logging
```

---

## 📝 FIELD GENERATOR REFERENCE

### Built-in Generators

```ts
// Identifiers
'uuid'          → '550e8400-e29b-41d4-a716-446655440000'
'id'            → 'f1a2b3c4'
'slug'          → 'hello-world'

// Person Data
'firstName'     → 'John'
'lastName'      → 'Doe'
'fullName'      → 'John Doe'
'email'         → 'john.doe@example.com'
'phone'         → '+1-555-123-4567'
'avatar'        → 'https://i.pravatar.cc/150?u=john'

// Business
'company'       → 'Acme Corporation'
'jobTitle'      → 'Software Engineer'
'department'    → 'Engineering'

// Dates
'date'          → 2024-01-15T10:30:00Z
'pastDate'      → 2023-11-20T...
'futureDate'    → 2025-03-10T...
'recentDate'    → 2024-01-14T...

// Location
'address'       → '123 Main St'
'city'          → 'San Francisco'
'country'       → 'United States'
'zipCode'       → '94102'
'latitude'      → 37.7749
'longitude'     → -122.4194

// Commerce
'productName'   → 'Awesome Shoes'
'productDesc'   → 'High quality durable shoes'
'price'         → '$49.99'
'currency'      → 'USD'

// Web
'url'           → 'https://example.com'
'imageUrl'      → 'https://loremflickr.com/...'
'ipAddress'     → '192.168.1.1'

// Content
'sentence'      → 'Lorem ipsum dolor sit amet.'
'paragraph'     → 'Lorem ipsum dolor sit...'
'word'          → 'lorem'
'words'         → 'lorem ipsum dolor'

// Boolean
'boolean'       → true / false

// Number
'number'        → 12345
'integer'       → 42
'float'         → 3.14
'percentage'    → 75
```

---

## 🔌 SCHEMA SHORTHAND EXAMPLES

```ts
// Simple shorthand
factory.schema('user', {
  id: 'uuid',
  name: 'fullName',
  email: 'email',
});

// With options
factory.schema('restaurant', {
  rating: {
    type: 'number',
    options: { min: 1, max: 5 }
  },
  cuisines: {
    type: 'array',
    options: { enum: ['Italian', 'Indian', 'Thai'] }
  },
});

// With custom generator
factory.schema('order', {
  orderNumber: {
    generator: (ctx) => `ORD-${Date.now()}-${ctx.index}`
  },
  total: {
    generator: () => Math.floor(Math.random() * 10000) / 100
  },
});

// With transform
factory.schema('user', {
  email: {
    generator: 'email',
    transform: (val) => val.toLowerCase()
  },
  password: {
    generator: 'string',
    transform: (val) => btoa(val) // base64 encode
  },
});

// Nested objects
factory.schema('user', {
  profile: {
    type: 'object',
    generator: (ctx) => ({
      bio: ctx.faker.lorem.sentence(),
      avatar: ctx.faker.image.avatar(),
      settings: {
        notifications: true,
        theme: 'light'
      }
    })
  },
});
```

---

## 🎯 ROUTING PATTERNS

### Pattern: Route with Logging

```ts
// routes/index.ts
import { logger } from '@/framework';

const routes = [
  {
    path: '/',
    element: <Home />,
    onEnter: () => logger.info('navigation:route', 'Navigated to /', { timestamp: Date.now() }),
  },
  {
    path: '/restaurants/:id',
    element: <RestaurantDetail />,
    onEnter: (params) => logger.info('navigation:route', `Navigated to /restaurants/${params.id}`),
  },
];
```

### Pattern: Auth-Protected Routes

```ts
const ProtectedRoute = ({ children }: any) => {
  const { user } = useAuth();

  useEffect(() => {
    logger.debug('auth:protected', `Accessing protected route`, { userId: user?.id });
  }, [user?.id]);

  if (!user) {
    logger.warn('auth:unauthorized', 'Attempted access to protected route without auth');
    return <Redirect to="/login" />;
  }

  return children;
};
```

---

## 📚 LIBRARY COMPARISON

| Feature | RDF | Redux DevTools | LogRocket | Sentry |
|---------|-----|-----------------|-----------|--------|
| **Logging** | ✅ Built-in | ❌ No | ✅ Yes | ⚠️ Error only |
| **Data Factory** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **API Simulation** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Feature Toggles** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Frontend-only** | ✅ Yes | ✅ Yes | ❌ Cloud | ❌ Cloud |
| **Learning Curve** | 📈 Low | 📈 Low | 📈📈 Medium | 📈📈 Medium |
| **Bundle Size** | 📦 10kb | 📦 50kb | 📦 100kb | 📦 80kb |
| **Cost** | ✅ Free | ✅ Free | ❌ Paid | ⚠️ Free tier |

---

## ✅ FRAMEWORK CHECKLIST FOR NEW PROJECT

```markdown
## New Project Setup

- [ ] Install @org/react-dev-framework
- [ ] Create schemas/
  - [ ] Define all entity schemas
  - [ ] Setup relationships if needed
- [ ] Create framework/init.ts
  - [ ] Setup logger
  - [ ] Setup factory
  - [ ] Export global window.__DEV__
- [ ] Setup Redux store
  - [ ] Add logger middleware
  - [ ] Setup preloadedState from factory
- [ ] Create API client
  - [ ] Add logging to requests
  - [ ] Add error handling
- [ ] Create shared/hooks
  - [ ] useApi hook
  - [ ] useLocalStorage hook
  - [ ] Custom hooks as needed
- [ ] Setup features
  - [ ] Use useApi for data fetching
  - [ ] Log important actions
  - [ ] Handle errors with logging
- [ ] Test dev mode
  - [ ] window.__DEV__.api.setDelay() works
  - [ ] window.__DEV__.logger.getLogs() works
  - [ ] window.__DEV__.factory.create() works
- [ ] Configure for production
  - [ ] Set logger.minLevel to 'WARN'
  - [ ] Replace factory data with real API
  - [ ] Remove dev-only code

## Estimated Time
- Schemas: 30 min
- Framework setup: 15 min
- Redux integration: 15 min
- API client: 20 min
- Features: varies
- Testing: 20 min
- **Total: 2-3 hours for 80% of functionality**
```

---

## 🚀 NEXT STEPS

1. **Copy code examples** into your project
2. **Run in browser console**: `window.__DEV__.logger.stats()`
3. **Read**: FRAMEWORK_DESIGN.md for architecture details
4. **Explore**: FRAMEWORK_IMPLEMENTATION_GUIDE.md for deep dives
5. **Join**: Slack channel for questions/feedback

---

**Last Updated**: 2024
**Framework Version**: 0.3.0 (Design Phase)
**Status**: Ready for Beta Testing
