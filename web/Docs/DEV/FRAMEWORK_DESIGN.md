# React Developer Framework (RDF) - Comprehensive Design
**Extract from Zom2 MERN Stack | Standalone Reusable Frontend Framework**

---

## 📋 TABLE OF CONTENTS

1. Framework Architecture
2. Data Factory Design
3. Logging System Design  
4. Dev Toolkit Plan
5. Shared Layer Refactor Plan
6. Framework Usage Guide

---

## 1️⃣ FRAMEWORK ARCHITECTURE

### 1.1 Overview
The **React Developer Framework (RDF)** is a productivity-focused layer that abstracts common development patterns extracted from Zom2. It provides:

- **DataFactory**: Schema-driven test data generation
- **Logger**: Structured, namespaced logging with visual filtering
- **DevToolkit**: Simulation, debugging, and feature toggling
- **Shared**: Curated reusable React patterns (hooks, components, utilities)

### 1.2 Folder Structure

```
react-dev-framework/
├── src/
│   ├── data-factory/              # Schema-driven data generation
│   │   ├── core/
│   │   │   ├── FactoryBuilder.ts
│   │   │   ├── FactoryRegistry.ts
│   │   │   ├── FieldGenerator.ts
│   │   │   └── types.ts
│   │   ├── generators/
│   │   │   ├── primitives.ts      # string, number, boolean, date
│   │   │   ├── faker-adapters.ts  # faker.js wrappers
│   │   │   └── relationships.ts   # hasMany, belongsTo, hasOne
│   │   ├── persistence/
│   │   │   ├── storage.ts         # File, Memory, MongoDB, JSON
│   │   │   └── exporters.ts       # JSON, CSV, SQL
│   │   ├── seeds/
│   │   │   └── index.ts           # Seed data registry
│   │   ├── hooks/
│   │   │   ├── useFactory.ts
│   │   │   └── useFactoryData.ts
│   │   └── index.ts               # Public API
│   │
│   ├── logging/                   # Structured logging system
│   │   ├── core/
│   │   │   ├── Logger.ts          # Main logger class
│   │   │   ├── types.ts
│   │   │   └── persistence.ts
│   │   ├── domains/
│   │   │   ├── api.ts
│   │   │   ├── redux.ts
│   │   │   ├── component.ts
│   │   │   ├── auth.ts
│   │   │   └── performance.ts
│   │   ├── formatters/
│   │   │   ├── colors.ts          # Color-coding for terminal/browser
│   │   │   ├── structured.ts      # JSON/object formatting
│   │   │   └── tables.ts          # Table format for easy scanning
│   │   ├── ui/
│   │   │   └── LogConsole.tsx     # Browser dev console
│   │   └── index.ts
│   │
│   ├── dev-toolkit/               # Developer utilities
│   │   ├── core/
│   │   │   ├── DevContext.tsx
│   │   │   ├── devConfig.ts
│   │   │   └── types.ts
│   │   ├── simulators/
│   │   │   ├── ApiSimulator.ts    # Delays, failures, pagination
│   │   │   ├── FeatureToggle.ts   # Dev-only features
│   │   │   └── ErrorSimulator.ts  # Error injection
│   │   ├── hooks/
│   │   │   ├── useDevMode.ts
│   │   │   ├── useSimulation.ts
│   │   │   └── useFeatureToggle.ts
│   │   ├── ui/
│   │   │   ├── DevPanel.tsx       # Dev control panel
│   │   │   └── FeatureToggleUI.tsx
│   │   └── index.ts
│   │
│   ├── shared/                    # Reusable patterns
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useAsync.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   ├── useTheme.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── response.ts        # Standardized response handling
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── http.ts
│   │   │   ├── errors.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── index.ts                   # Main export
│
├── examples/
│   ├── food-delivery/             # Zom2-like implementation
│   ├── ecommerce/
│   └── saas/
│
├── docs/
│   ├── API.md
│   ├── QUICKSTART.md
│   ├── DATA_FACTORY.md
│   └── ADVANCED.md
│
├── package.json
├── tsconfig.json
└── README.md
```

### 1.3 Core Responsibilities

| Module | Responsibility | Key Output |
|--------|-----------------|-----------|
| **DataFactory** | Generate test data from schemas | In-memory, JSON, or persisted |
| **Logger** | Track data flow & debug issues | Structured logs + visual console |
| **DevToolkit** | Simulate backend behavior | API delays, errors, toggles |
| **Shared** | Reusable React patterns | Hooks, utilities, constants |

### 1.4 Design Principles

```ts
// 1. SCHEMA-DRIVEN: Define once, generate anywhere
const userSchema = factory.schema('user', {
  id: 'uuid',
  name: 'firstName lastName',
  email: 'email',
  role: ['admin', 'user', 'owner'],
  createdAt: 'date',
});

// 2. COMPOSABLE: Build complex data from simple blocks
factory.create('order', {
  user: userSchema,  // Embed schema
  items: 'foodItem', // Reference another
});

// 3. DETERMINISTIC: Same seed = same data
factory.seed(12345);
const user1 = factory.create('user');
const user2 = factory.create('user'); // Same as user1

// 4. PORTABLE: Use in any context
// - Browser: React components
// - Node: API tests
// - CLI: Data dumps
```

---

## 2️⃣ DATA FACTORY DESIGN

### 2.1 Architecture

```ts
// ============================================================================
// FACTORY CORE TYPES
// ============================================================================

// Definition of a schema
export interface FieldDef {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  generator?: string | ((ctx: GeneratorContext) => any); // e.g., 'email', 'firstName'
  options?: {
    min?: number;
    max?: number;
    enum?: any[];
    format?: string;
    nullable?: boolean;
    default?: any;
  };
  transform?: (val: any) => any;
}

export interface SchemaDef {
  [key: string]: FieldDef | string; // Shorthand: 'email' = { type: 'string', generator: 'email' }
}

export interface FactoryInput {
  count?: number;
  overrides?: Partial<any>;
  seed?: number;
  relations?: {
    [key: string]: 'hasMany' | 'hasOne' | 'belongsTo';
  };
}

export interface GeneratorContext {
  index: number;
  seed: number;
  faker: Faker;
  registry: FactoryRegistry;
}

// ============================================================================
// FACTORY API (Public)
// ============================================================================

class DataFactory {
  // Register a schema
  schema<T>(name: string, def: SchemaDef): FactoryBuilder<T>;

  // Generate data
  create<T>(
    schemaName: string,
    input?: FactoryInput
  ): T | T[];

  // Bulk operations
  batch<T>(
    schemaName: string, 
    operations: FactoryInput[]
  ): T[][];

  // Export
  export<T>(
    schemaName: string,
    options: {
      to: 'json' | 'csv' | 'sql';
      filename?: string;
    }
  ): string | Buffer;

  // Persistence
  persist<T>(
    schemaName: string,
    options: {
      to: 'mongodb' | 'file' | 'memory';
      collection?: string;
      connectionString?: string;
    }
  ): Promise<T[]>;

  // Seeding
  seed(value: number): this;
  setSeed(schemaName: string, value: number): this;

  // Utilities
  clear(schemaName?: string): void;
  stats(): FactoryStats;
}
```

### 2.2 Field Generators

**Built-in Generators** (via faker.js):
- `'string'`, `'uuid'`, `'email'`, `'phone'`
- `'firstName'`, `'lastName'`, `'fullName'`
- `'date'`, `'pastDate'`, `'futureDate'`
- `'number'`, `'integer'`, `'float'`
- `'boolean'`, `'address'`, `'country'`, `'city'`
- `'imageUrl'`, `'slug'`, `'url'`

**Custom Generators**:
```ts
factory.registerGenerator('cuisineType', (ctx) => {
  const cuisines = ['Italian', 'Indian', 'Chinese', 'Thai'];
  return cuisines[ctx.index % cuisines.length];
});

factory.schema('restaurant', {
  cuisine: 'cuisineType',
  name: { 
    generator: (ctx) => `${ctx.faker.company.name()} Kitchen`,
    transform: (val) => val.toLowerCase(),
  },
});
```

**Custom Field Functions**:
```ts
factory.schema('user', {
  id: { generator: () => crypto.randomUUID() },
  email: { 
    generator: (ctx) => `user${ctx.index}@example.com`,
  },
  isAdmin: { 
    generator: (ctx) => ctx.index === 0, // First user is admin
  },
});
```

### 2.3 Relationships

```ts
// One-to-Many
factory.schema('restaurant', {
  id: 'uuid',
  name: 'company.name',
  // ... other fields
});

factory.schema('menu', {
  id:  'uuid',
  restaurantId: { 
    reference: 'restaurant.id',
    relation: 'belongsTo'
  },
  items: { 
    relation: 'hasMany',
    schema: 'foodItem',
    count: 10
  }
});

// With linking
const restaurants = factory.create('restaurant', { count: 5 });
const menus = factory.create('menu', {
  count: 5,
  relations: {
    restaurantId: 'belongsTo:restaurant'
  }
});
```

### 2.4 Usage Examples

#### Example 1: Simple Schema
```ts
const factory = new DataFactory();

// Define schema
factory.schema('user', {
  id: 'uuid',
  name: 'fullName',
  email: 'email',
  phone: 'phoneNumber',
  createdAt: 'pastDate',
});

// Generate
const users = factory.create('user', { count: 10 });
// Output: User[] (10 objects)
```

#### Example 2: Complex with Overrides
```ts
const restaurants = factory.create('restaurant', {
  count: 5,
  overrides: {
    0: { name: 'Premium Restaurant', rating: 4.8 },
    1: { isOpen: false },
  }
});

// Output: First restaurant has custom name/rating
```

#### Example 3: Seeded Deterministic
```ts
factory.seed(12345);
const users1 = factory.create('user', { count: 5 });

factory.seed(12345);
const users2 = factory.create('user', { count: 5 });

// users1 === users2 (exact same data)
```

#### Example 4: Nested Objects
```ts
factory.schema('user', {
  id: 'uuid',
  name: 'fullName',
  profile: {
    type: 'object',
    generator: (ctx) => ({
      bio: ctx.faker.lorem.sentence(),
      avatar: ctx.faker.image.avatar(),
      preferences: {
        theme: ctx.faker.helpers.arrayElement(['light', 'dark']),
        notifications: true,
      }
    })
  }
});
```

#### Example 5: Bulk Export
```ts
// Generate and export in one operation
const json = factory.create('order', { count: 1000 })
  |> factory.export('order', { to: 'json', filename: 'orders.json' });

const csv = factory.export('restaurant', { to: 'csv' });
// Returns CSV string
```

#### Example 6: Persist to MongoDB
```ts
await factory.persist('user', {
  to: 'mongodb',
  connectionString: 'mongodb://localhost:27017/dev_db',
  collection: 'users'
});

// All generated users now in DB
```

### 2.5 Hook Integration (React)

```ts
// Hook 1: Use factory in component
const MyComponent = () => {
  const { factory, data, isLoading } = useFactory('user', { count: 20 });

  const regenerate = () => {
    factory.seed(Date.now());
    // ...
  };

  return (
    <>
      <button onClick={regenerate}>Regenerate Data</button>
      {data.map((user) => <UserCard key={user.id} user={user} />)}
    </>
  );
};

// Hook 2: Track factory state
const { stats } = useFactory();
// stats = { schemas: 5, totalRecords: 1500, memory: '2.3MB' }
```

---

## 3️⃣ LOGGING SYSTEM DESIGN

### 3.1 Core Concept

A **structured, visually scannable** logging system that combines:
- Category-based organization (API, Redux, Component, Auth)
- Hierarchical namespaces (e.g., `auth:login:request`)
- Color-coded output for quick identification
- Persistence for debugging session history
- Built-in domain loggers (API, Redux, Component, etc.)

### 3.2 Logger Architecture

```ts
// ============================================================================
// CORE LOGGER TYPES
// ============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;              // UUID for uniq identification
  timestamp: number;       // ms since epoch
  level: LogLevel;
  namespace: string;       // e.g., 'auth:flow:login'
  message: string;
  data?: unknown;          // Structured context
  stackTrace?: string;     // For errors only
  tags?: string[];         // For filtering (e.g., ['api', 'request'])
  duration?: number;       // ms (for performance spans)
  source?: string;         // File/component origin
}

export interface LoggerConfig {
  maxLogs: number;                    // In-memory buffer
  persistLogs: boolean;               // localStorage
  minLevel: LogLevel;                 // Filtering threshold
  enableStackTrace: boolean;
  enableTimestamps: boolean;
  enableGrouping: boolean;
  colors: {
    DEBUG: string;
    INFO: string;
    WARN: string;
    ERROR: string;
    CRITICAL: string;
  };
}

export interface FilterOptions {
  level?: LogLevel | LogLevel[];
  namespace?: string;                 // Regex pattern
  search?: string;                    // Full-text search
  tags?: string[];                    // AND logic
  timeRange?: { start: number; end: number };
}

// ============================================================================
// LOGGER PUBLIC API
// ============================================================================

class Logger {
  // Core methods (grouped by namespace)
  debug(namespace: string, message: string, data?: any, tags?: string[]): LogEntry;
  info(namespace: string, message: string, data?: any, tags?: string[]): LogEntry;
  warn(namespace: string, message: string, data?: any, tags?: string[]): LogEntry;
  error(namespace: string, message: string, data?: any, tags?: string[]): LogEntry;
  critical(namespace: string, message: string, data?: any, tags?: string[]): LogEntry;

  // Span/timing (for performance)
  span(namespace: string, fn: () => Promise<T> | T): Promise<T>;
  startSpan(namespace: string): { end: (data?: any) => LogEntry };

  // Querying
  getLogs(filters?: FilterOptions): LogEntry[];
  getByNamespace(pattern: string): LogEntry[];
  getByLevel(level: LogLevel): LogEntry[];
  getRecent(count: number): LogEntry[];

  // Statistics
  stats(): LogStats;
  statsByNamespace(): Record<string, number>;

  // Export
  export(format: 'json' | 'csv' | 'html'): string;

  // Control
  setLevel(level: LogLevel): void;
  clear(namespace?: string): void;
  pause(): void;
  resume(): void;
}
```

### 3.3 Domain Loggers

Built-in loggers for common domains:

```ts
// Domain 1: API requests/responses
logger.api.request('GET', '/users', { params: { skip: 0 } });
logger.api.response('GET', '/users', 200, { count: 50 });
logger.api.error('GET', '/users', new Error('Network timeout'));
logger.api.cached('GET', '/users', { ttl: 5000 });

// Domain 2: Redux actions and state
logger.redux.action('auth/LoginRequest', { email: 'user@ex.com' });
logger.redux.state('auth', { isAuthenticated: true, user: {...} });
logger.redux.dispatch('cart/AddItem', { itemId: 'f1', qty: 2 });
logger.redux.error('order/CreateOrder', new Error('Server error'));

// Domain 3: Component lifecycle
logger.component.mount('CartPage');
logger.component.render('CartPage', { items: 5 });
logger.component.effect('CartPage', 'watchCartChanges');
logger.component.unmount('CartPage');
logger.component.error('CartPage', new Error('State corruption'));

// Domain 4: Authentication
logger.auth.login('user-123', 'google');
logger.auth.logout('user-123');
logger.auth.tokenRefresh('user-123');
logger.auth.error('user-123', new Error('Invalid token'));

// Domain 5: Performance
const span = logger.performance.start('page-load');
// ... do work
logger.performance.end('page-load'); // Logs duration

// Domain 6: Custom domain
logger.custom('payment:stripe', 'charge_created', { amount: 100, currency: 'USD' });
``
ts

### 3.4 Visual Formatting

Logs are colorized and structured for **visual scannability**:

```ts
// Example output (simulated):
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ 14:23:45.123 [API] [REQUEST] GET /restaurants                   │
// │ parameters: { skip: 0, limit: 10 }                              │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ 14:23:45.567 [API] [RESPONSE] 200 ✓ /restaurants               │
// │ duration: 444ms | cached: true                                  │
// │ count: 60 records returned                                      │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ 14:23:46.001 [REDUX] [ACTION] cart/AddItem                      │
// │ payload: { itemId: 'f1', quantity: 2, specialInstructions: null }│
// │ prev state: { items: 0, total: 0 }                              │
// │ new state:  { items: 1, total: 299 }                            │
// └─────────────────────────────────────────────────────────────────┘
```

### 3.5 Usage Examples

#### Example 1: Simple Logging
```ts
// Setup
const logger = new Logger({
  minLevel: 'DEBUG',
  persistLogs: true,
  maxLogs: 1000,
});

// Usage
logger.info('auth:login', 'User login initiated', { email: 'user@ex.com' });
logger.debug('cart:add', 'Adding item to cart', { itemId: 'f1', qty: 2 });
logger.warn('payment:stripe', 'Rate limit approaching', { remaining: 5 });
logger.error('api:fetch', 'Network error', new Error('Connection refused'));
```

#### Example 2: Span/Performance
```ts
const span = logger.startSpan('data:fetch:users');
const users = await fetchUsers();
span.end({ count: users.length });

// Logs:
// [PERF] Completed data:fetch:users in 234ms (count: 50)
```

#### Example 3: Querying & Filtering
```ts
// Get all errors
const errors = logger.getLogs({ level: ['WARN', 'ERROR'] });

// Get API logs only
const apiLogs = logger.getByNamespace('api:.*');

// Get last 20 logs
const recent = logger.getRecent(20);

// Complex filter
const results = logger.getLogs({
  namespace: 'cart:.*',
  level: 'ERROR',
  timeRange: { start: Date.now() - 60000, end: Date.now() }
});
```

#### Example 4: Export for Analysis
```ts
// Export as JSON
const json = logger.export('json');
// Write to file or send to server

// Statistical breakdown
const stats = logger.stats();
// {
//   total: 523,
//   byLevel: { DEBUG: 400, INFO: 80, WARN: 30, ERROR: 13, CRITICAL: 0 },
//   byNamespace: { 'api:.*': 200, 'redux:.*': 150, ... },
//   avgDuration: 145 // ms
// }
```

#### Example 5: React Integration
```ts
// Hook: useLogger
const MyComponent = () => {
  const logger = useLogger();

  useEffect(() => {
    logger.info('component:mount', 'MyComponent mounted');
    return () => logger.info('component:unmount', 'MyComponent unmounted');
  }, []);

  return <div>{/* ... */}</div>;
};

// Hook: useLoggedAction
const handleAddItem = useLoggedAction(
  (item) => dispatch(addItem(item)),
  { namespace: 'cart:addItem', logPayload: true }
);

// Hook: useLogFilter
const { logs } = useLogFilter({ namespace: 'api:.*', level: 'ERROR' });
```

### 3.6 Dev Console UI

A browser-based log viewer with filtering, search, and export:

```tsx
<LogConsole
  height={300}
  expandable={true}
  defaultFilter={{ namespace: 'api:.*' }}
  showStats={true}
  enableSearch={true}
/>
```

---

## 4️⃣ DEV TOOLKIT PLAN

### 4.1 Purpose

A collection of **developer utilities** to simulate backend behavior, toggle features, and inject errors — all without modifying the actual API/backend.

### 4.2 Components

#### A: API Simulator
```ts
class ApiSimulator {
  // Simulate network delays
  setDelay(endpoint: string, delayMs: number): void;
  setRandomDelay(endpoint: string, minMs: number, maxMs: number): void;

  // Simulate errors
  setError(endpoint: string, status: number, message: string): void;
  setRandomError(endpoint: string, probability: number): void;
  clearError(endpoint: string): void;

  // Simulate pagination
  setPagination(endpoint: string, pageSize: number): void;
  
  // Simulate response transformation
  transformResponse(endpoint: string, transformer: (data: any) => any): void;

  // Simulate timeouts
  setTimeout(endpoint: string, timeoutMs: number): void;
}

// Usage:
const api = new ApiSimulator();
api.setDelay('/restaurants', 2000);        // 2 sec delay
api.setRandomError('/orders', 0.3);        // 30% chance of 500
api.setPagination('/menu', 10);            // 10 items per page
```

#### B: Feature Toggle
```ts
class FeatureToggle {
  // Define features
  register(name: string, defaultEnabled: boolean): void;
  
  // Enable/disable
  enable(name: string): void;
  disable(name: string): void;
  toggle(name: string): void;

  // Query
  isEnabled(name: string): boolean;
  getAll(): Record<string, boolean>;
  
  // Conditional rendering (React)
  when(name: string, Component: React.ComponentType<any>): React.ComponentType<any>;
}

// Usage:
const features = new FeatureToggle();
features.register('darkMode', false);
features.register('newCheckout', true);

if (features.isEnabled('newCheckout')) {
  // Use new checkout flow
}
```

#### C: Error Simulator
```ts
class ErrorSimulator {
  // Inject errors at specific points
  onApiCall(probability: number): void;
  onStateChange(namespace: string, probability: number): void;
  onComponentRender(componentName: string): void;  
  onUserAction(actionType: string, probability: number): void;
  
  // Simulate specific errors
  injectReduxError(action: string, error: Error): void;
  injectComponentError(component: string, error: Error): void;
}
```

#### D: Global Dev Console (Window Hook)
```ts
// Available on window if IS_DEV
window.__DEV__ = {
  api: ApiSimulator,
  features: FeatureToggle,
  errors: ErrorSimulator,
  logger: Logger,
  factory: DataFactory,
  store: ReduxStore,
  
  // Quick commands
  simulateSlowApi: () => api.setRandomDelay('*', 1000, 3000),
  simulateErrors: () => errors.onApiCall(0.5),
  resetAll: () => { /* ... */ },
  
  // Examples
  help: () => console.log(`
    window.__DEV__.api.setDelay('/restaurants', 2000);
    window.__DEV__.features.enable('darkMode');
    window.__DEV__.logger.stats();
  `),
};
```

### 4.3 Dev Hooks

```ts
// Hook 1: Use dev mode
const { isDevMode, devTools } = useDevMode();

if (isDevMode) {
  return <DevPanel tools={devTools} />;
}

// Hook 2: Use simulation
const { isSimulating, toggleSimulation } = useSimulation('api-delays');

// Hook 3: Use feature toggle
const { isEnabled, toggle } = useFeatureToggle('darkMode');

// Hook 4: Use error injection
const { injectError, hasError } = useErrorInjection('component-name');
```

---

## 5️⃣ SHARED LAYER REFACTOR PLAN

### 5.1 Current State (Zom2)
- **Mixed concerns**: Components + hooks + utilities in same folder
- **Duplication**: Multiple versions of similar components (`versions/`)
- **Unclear boundaries**: Feature-specific logic in shared layer

### 5.2 Proposed Structure

```
shared/
├── hooks/                 # Generic, reusable React hooks
│   ├── useLocalStorage.ts
│   ├── useApi.ts
│   ├── useAsync.ts
│   ├── useMediaQuery.ts
│   ├── useTheme.ts
│   ├── useDebounce.ts
│   ├── useClickOutside.ts
│   └── index.ts
│
├── utils/                 # Pure utilities
│   ├── response.ts        # Response formatting
│   ├── validators.ts      # Form/data validation
│   ├── formatters.ts      # Date, currency, text formatting
│   ├── errors.ts          # Error handling
│   └── index.ts
│
├── constants/             # Constants & enums
│   ├── http.ts            # Status codes, methods
│   ├── errors.ts          # Error types
│   ├── validation.ts      # Regex, rules
│   └── index.ts
│
├── types/                 # Shared TypeScript
│   ├── api.ts             # API request/response types
│   ├── common.ts          # Generic types (Pagination, List, etc.)
│   └── index.ts
│
└── index.ts               # Public API (opt-in imports)
```

### 5.3 Clear Boundaries

**Shared SHOULD**:
- ✅ Generic hooks (useApi, useLocalStorage, useAsync)
- ✅ Utilities (formatters, validators, error handlers)
- ✅ Constants and enums
- ✅ Common types and interfaces
- ✅ Framework-level abstractions

**Shared SHOULD NOT**:
- ❌ Feature-specific components (CartSummary, OrderCard, RestaurantFilter)
- ❌ Feature-specific hooks (useCartData, useOrderHistory)
- ❌ UI component variations (Button_v1, Button_v2, Button_v3)
- ❌ Business logic

### 5.4 Example: Refactored Hooks

```ts
// shared/hooks/useApi.ts
export const useApi = <T, P = void>(
  apiFunction: (params?: P) => Promise<T>,
  options?: {
    autoFetch?: boolean;
    onError?: (error: Error) => void;
    onSuccess?: (data: T) => void;
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (params?: P) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(params);
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (options?.autoFetch) execute();
  }, []);

  return { data, loading, error, execute, isError: error !== null };
};

// Usage in any component:
const { data: users, loading } = useApi(
  () => fetch('/api/users').then(r => r.json()),
  { autoFetch: true }
);
```

---

## 6️⃣ FRAMEWORK USAGE GUIDE

### 6.1 Installation & Setup

```bash
# Install framework
npm install @your-org/react-dev-framework

# OR create new app with framework
npx create-rdf-app my-app
cd my-app
npm start
```

### 6.2 Step-by-Step Integration

#### Step 1: Initialize Framework
```ts
// src/framework/init.ts
import { DataFactory, Logger, DevToolkit } from '@your-org/react-dev-framework';
import { IS_DEV } from '../config';

export const factory = new DataFactory();
export const logger = new Logger({ minLevel: IS_DEV ? 'DEBUG' : 'INFO' });
export const devTools = new DevToolkit();

if (IS_DEV) {
  window.__DEV__ = { factory, logger, devTools };
}
```

#### Step 2: Define Data Schemas
```ts
// src/schemas/user.schema.ts
import { factory } from '../framework/init';

export const userSchema = factory.schema('user', {
  id: 'uuid',
  name: 'fullName',
  email: 'email',
  avatar: 'image.avatar',
  role: { enum: ['admin', 'user', 'owner'] },
  createdAt: 'pastDate',
});

// src/schemas/restaurant.schema.ts
export const restaurantSchema = factory.schema('restaurant', {
  id: 'uuid',
  name: 'company.name',
  cuisine: {
    generator: (ctx) => {
      const cuisines = ['Italian', 'Indian', 'Chinese'];
      return cuisines[ctx.index % cuisines.length];
    }
  },
  rating: { generator: () => parseFloat((Math.random() * 2 + 3).toFixed(1)) },
  menu: {
    relation: 'hasMany',
    schema: 'foodItem',
    count: 15
  }
});

// src/schemas/index.ts
export * from './user.schema';
export * from './restaurant.schema';
// ... more schemas
```

#### Step 3: Setup Redux with Factory
```ts
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { factory } from '../framework/init';
import { logger } from '../framework/init';

// Middleware to log Redux actions
const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
  logger.redux.action(action.type, action.payload);
  const result = next(action);
  logger.redux.state(action.type.split('/')[0], store.getState());
  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().concat(loggerMiddleware),
  preloadedState: {
    // Initial state from factory
    restaurants: factory.create('restaurant', { count: 20 }),
    menu: factory.create('foodItem', { count: 50 }),
  },
});

export default store;
```

#### Step 4: Use Logging Throughout App
```ts
// src/services/api.ts
import { logger } from '../framework/init';

export const apiClient = {
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    logger.api.request(options?.method || 'GET', endpoint);
    
    try {
      const response = await fetch(endpoint, options);
      const data = await response.json();
      
      logger.api.response(options?.method || 'GET', endpoint, response.status, {
        count: Array.isArray(data) ? data.length : 1
      });
      
      return data;
    } catch (error) {
      logger.api.error(endpoint, error);
      throw error;
    }
  },
};

// src/hooks/useRestaurants.ts
import { useEffect, useState } from 'react';
import { logger } from '../framework/init';
import { apiClient } from '../services/api';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.component.effect('RestaurantList', 'loadRestaurants');
    
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiClient.fetch('/api/restaurants');
        setRestaurants(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { restaurants, loading };
};
```

#### Step 5: Build Features Using Shared Layer
```ts
// src/features/home/Home.tsx
import { logger } from '@framework/init';
import { useApi } from '@shared/hooks';

export const Home = () => {
  const { data: restaurants, loading } = useApi(
    () => fetch('/api/restaurants').then(r => r.json()),
    {
      onSuccess: (data) => {
        logger.info('home:loaded', 'Home page loaded', { count: data.length });
      },
      onError: (error) => {
        logger.error('home:error', 'Failed to load home', error);
      }
    }
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
};
```

#### Step 6: Transition to Real Backend

When ready to switch from dev to production:

```ts
// src/config/dev.ts
export const USE_DEV_DATA = import.meta.env.DEV;
export const DEV_DELAY_MS = 1000;

// src/services/api.ts (updated)
export const apiClient = {
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (USE_DEV_DATA) {
      // Use factory data with simulated delay
      logger.debug('api:devMode', `Using mock data for ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, DEV_DELAY_MS));
      
      // Return mock data based on endpoint
      if (endpoint === '/api/restaurants') {
        return factory.create('restaurant', { count: 20 }) as T;
      }
      // ... more mocks
    }

    // Real API call in production
    logger.api.request(options?.method || 'GET', endpoint);
    // ... actual fetch
  }
};
```

### 6.3 Project Checklist

```markdown
## New React App Setup

- [ ] Install framework: `npm install @org/react-dev-framework`
- [ ] Create `src/framework/init.ts` with factory, logger, devTools
- [ ] Define schemas in `src/schemas/*.schema.ts`
- [ ] Setup Redux with preloadedState from factory
- [ ] Add logger middleware to Redux
- [ ] Add logging to API client
- [ ] Use `useApi` hook instead of raw fetch
- [ ] Setup shared hooks in components
- [ ] Add logging to critical features (auth, cart, orders)
- [ ] Configure dev panel in dev mode
- [ ] Test with `window.__DEV__` commands
- [ ] Setup feature toggles for A/B testing
- [ ] Export logs for bug reports
- [ ] When ready: Switch to real backend (toggle `USE_DEV_DATA`)
- [ ] Remove dev-only code (logger, devTools, mocks)
```

### 6.4 Dev Workflow

```typescript
// During development:
// 1. Start app
npm run dev

// 2. Open browser console and use dev commands
window.__DEV__.factory.seed(12345);
const users = window.__DEV__.factory.create('user', { count: 50 });

window.__DEV__.logger.stats();
// { total: 523, byLevel: { DEBUG: 400, ... } }

window.__DEV__.api.setRandomDelay('*', 1000, 3000);
window.__DEV__.api.setRandomError('*', 0.2);

// 3. Enable feature toggles
window.__DEV__.features.enable('newCheckout');
window.__DEV__.features.enable('darkMode');

// 4. Filter & export logs
const logs = window.__DEV__.logger.getLogs({ namespace: 'api:.*', level: 'ERROR' });
const json = window.__DEV__.logger.export('json');
console.save(json, 'debug.json');
```

### 6.5 Production Checklist

```markdown
## Before Deploying to Production

**Code Cleanup**:
- [ ] Remove all `window.__DEV__` references
- [ ] Remove factory-generated preloaded state
- [ ] Remove dev-only logger middleware
- [ ] Remove feature toggles not needed in production
- [ ] Set `logger.minLevel` to 'WARN'
- [ ] Disable log persistence

**API Integration**:
- [ ] Replace mock data with real API calls
- [ ] Configure API baseURL from env
- [ ] Add authentication headers
- [ ] Handle real error responses
- [ ] Test with real database

**Monitoring**:
- [ ] Set up Sentry/error tracking
- [ ] Configure log export endpoint (optional)
- [ ] Monitor API performance
- [ ] Setup alerts for critical errors

**Testing**:
- [ ] Run integration tests
- [ ] Test all API endpoints
- [ ] Load testing with real data volumes
- [ ] Browser compatibility testing
```

---

## 📝 SUMMARY

| Aspect | Solution |
|--------|----------|
| **Data Generation** | Schema-driven DataFactory with Faker support |
| **Debugging** | Structured Logger with color-coded output |
| **API Simulation** | ApiSimulator for delays, errors, pagination |
| **Feature Control** | FeatureToggle for dev-only features |
| **Code Quality** | Shared hooks & utils enforcing best practices |
| **Learning Curve** | Well-documented with examples for each feature |
| **Portability** | Zero backend dependency, works anywhere React runs |

---

## 🚀 Next Steps

1. **Review & Validate**: Share design with team for feedback
2. **Prototype**: Build core DataFactory and Logger in isolation
3. **Extract from Zom2**: Migrate patterns to framework
4. **Test Integration**: Build 2-3 example apps using framework
5. **Document**: Add API docs, guides, and video tutorials
6. **Publish**: Release as npm package for internal use

---

**Created**: 2024
**Status**: Design Phase
**Target Users**: Frontend developers building React apps with test-driven development
