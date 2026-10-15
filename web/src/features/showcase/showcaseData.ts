import type { DomainShowcase, EngineeringTradeoff, ArchitectureNode } from './types';

export const SHOWCASE_DOMAINS: DomainShowcase[] = [
  {
    id: 'customer',
    title: 'Customer Experience',
    roleBadge: 'CUSTOMER APP',
    tagline: 'End-to-end food discovery, checkout, and live tracking',
    description:
      'A responsive consumer ordering platform featuring searchable restaurant catalogs, cuisine categorization, Redux-managed shopping carts, and real-time order tracking with animated Leaflet GPS progression.',
    status: 'Verified E2E',
    primaryRoute: '/restaurants',
    accentColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
    keyActors: ['Customer', 'Socket Relay', 'Order Gateway'],
    realtimeEvents: ['order_created', 'order_status_updated', 'delivery:location', 'notification'],
    features: [
      {
        id: 'cust-catalog',
        name: 'Truthful Catalog & Filter Engine',
        summary: 'Dynamic restaurant directory with cuisine filtering, delivery time sorting, and search query synchronization.',
        technicalDetails:
          'Utilizes Redux Toolkit slices (`restaurantSlice.ts`) with normalized search parameters, pagination state management, and fallback image rendering (`SafeImage.tsx`).',
        sourceFile: 'web/src/pages/restaurantListings/V/Restaurants_V.tsx',
        sourceLineRange: 'L40-L110',
        status: 'Unit / Contract Tested',
        keyConcepts: ['URL Query Sync', 'Client-side Filtering', 'Resilient Images'],
        routePath: '/restaurants',
      },
      {
        id: 'cust-tracking',
        name: 'Live Realtime Order & GPS Tracker',
        summary: 'Synchronous map projection tracking delivery partner movement and order milestones from preparation to doorstep.',
        technicalDetails:
          'Subscribes to Socket.IO order room (`order:join`). Consumes `delivery:location` and `delivery:status` payloads to render dynamic Leaflet markers and progress bars.',
        sourceFile: 'web/src/pages/Orders/OrderTracking/index.tsx',
        sourceLineRange: 'L30-L95',
        status: 'Verified E2E',
        keyConcepts: ['WebSockets', 'Leaflet Coordinates', 'Redux Sync'],
        routePath: '/orders/tracking/ord-demo-1',
      },
      {
        id: 'cust-chat',
        name: 'Cross-Domain Order Chat',
        summary: 'Real-time 2-way messaging between Customer, Restaurant Owner, and Delivery Partner for order coordination.',
        technicalDetails:
          'Direct WebSocket event routing via `chat:message` with optimistic client updates and backend database persistence.',
        sourceFile: 'web/src/shared/components/OrderChat/OrderChat.tsx',
        sourceLineRange: 'L20-L80',
        status: 'Integration Verified',
        keyConcepts: ['Socket Rooms', 'Optimistic UI', 'Unread Tracking'],
      },
    ],
  },
  {
    id: 'owner',
    title: 'Merchant Restaurant Hub',
    roleBadge: 'OWNER OPERATIONS',
    tagline: 'Kitchen order management, queue dispatch, and menu control',
    description:
      'Operational portal designed for restaurant managers. Receives live order broadcasts via WebSockets, provides atomic state transition triggers, and manages menu catalog availability.',
    status: 'Verified E2E',
    primaryRoute: '/owner',
    accentColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
    keyActors: ['Restaurant Owner', 'Kitchen Staff', 'Socket.IO Dispatcher'],
    realtimeEvents: ['order_created', 'order_status_updated', 'notification'],
    features: [
      {
        id: 'owner-queue',
        name: 'Live Kitchen Order Queue',
        summary: 'Real-time incoming orders with audio/visual notifications and stage transition actions.',
        technicalDetails:
          'Listens for `order_created` events to prepend incoming tickets without full-page reloads. Transitions order state from `placed` → `accepted` → `preparing` → `ready_for_pickup`.',
        sourceFile: 'web/src/pages/_ownerPages/orders/OrderQueue.tsx',
        sourceLineRange: 'L40-L100',
        status: 'Verified E2E',
        keyConcepts: ['Live Queue', 'Audio Alerts', 'State Invariants'],
        routePath: '/owner',
      },
      {
        id: 'owner-menu',
        name: 'Menu & Inventory Management',
        summary: 'Dynamic item management with pricing, category tagging, and availability toggles.',
        technicalDetails:
          'CRUD operations integrated with Zod validation on the backend and optimistic updates on the client.',
        sourceFile: 'web/src/pages/_ownerPages/menu/MenuItems.tsx',
        sourceLineRange: 'L30-L90',
        status: 'Dual Transport (Mock / API)',
        keyConcepts: ['Form Validation', 'Optimistic Updates', 'Category Grouping'],
      },
    ],
  },
  {
    id: 'partner',
    title: 'Logistics Fleet Partner',
    roleBadge: 'DELIVERY FLEET',
    tagline: 'Order dispatching, deterministic GPS simulation, and delivery fulfillment',
    description:
      'Mobile-first courier interface supporting online/offline availability toggling, assignment acceptance, interactive map directions, and step-by-step milestone confirmations.',
    status: 'Verified E2E',
    primaryRoute: '/partner',
    accentColor: '#10b981',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
    keyActors: ['Delivery Partner', 'GPS Simulator', 'Dispatch Engine'],
    realtimeEvents: ['delivery_assigned', 'delivery:status', 'delivery:location'],
    features: [
      {
        id: 'partner-active',
        name: 'Active Delivery Progression & Handshake',
        summary: 'Step-by-step UI guiding couriers from pickup confirmation to doorstep delivery with confirmation dialogs.',
        technicalDetails:
          'Coupled with defensive Redux unwrapping in `deliveryPartnerSlice.ts`. Triggers status mutations (`arrived_pickup` → `picked_up` → `delivered`) with modal confirmation safeguards.',
        sourceFile: 'web/src/pages/_deliveryPartner/ActiveDelivery.tsx',
        sourceLineRange: 'L50-L120',
        status: 'Verified E2E',
        keyConcepts: ['Modal Confirmations', 'Defensive Envelope Handling', 'Active Redux State'],
        routePath: '/partner',
      },
      {
        id: 'partner-simulator',
        name: 'Deterministic GPS Route Simulation',
        summary: 'Server-side GPS tick simulation computing linear interpolation between restaurant coordinates and customer dropoff.',
        technicalDetails:
          'Calculates bearing, distance, and stepped coordinate intervals (`delivery.simulator.ts`). Protected with atomic CAS guards to prevent stale updates or cancellation overwrite races.',
        sourceFile: 'API/src/modules/delivery/delivery.simulator.ts',
        sourceLineRange: 'L88-L120',
        status: 'Deterministic Simulation',
        keyConcepts: ['Haversine Math', 'Atomic CAS Guards', 'Race Condition Prevention'],
      },
    ],
  },
  {
    id: 'admin',
    title: 'Platform Administration & Governance',
    roleBadge: 'ADMIN COMMAND',
    tagline: 'Fleet telemetry, system analytics, and operational oversight',
    description:
      'Executive command center providing live delivery tracking across all active platform couriers, centralized user management, and operational telemetry diagnostics.',
    status: 'Integration Verified',
    primaryRoute: '/admin',
    accentColor: '#ef4444',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
    keyActors: ['Platform Administrator', 'Fleet Dispatcher', 'Audit Logger'],
    realtimeEvents: ['delivery:status', 'order_status_updated', 'notification'],
    features: [
      {
        id: 'admin-fleet',
        name: 'Live Fleet Oversight & Telemetry',
        summary: 'Bird-eye view of all active deliveries, partner locations, and platform throughput.',
        technicalDetails:
          'Aggregates active deliveries across all restaurants. Connects to `useDeliverySocket` to render concurrent partner markers on platform maps.',
        sourceFile: 'web/src/pages/admin/delivery/index.tsx',
        sourceLineRange: 'L25-L85',
        status: 'Integration Verified',
        keyConcepts: ['Multi-marker Mapping', 'Fleet Aggregation', 'Real-time Dashboards'],
        routePath: '/admin',
      },
      {
        id: 'admin-ai',
        name: 'Automated Diagnostic & AI Investigation Panel',
        summary: 'Diagnostic platform for system anomalies, automated root-cause suggestions, and data inspection.',
        technicalDetails:
          'Prototype architectural investigation console (`AdminAIPage.tsx`) demonstrating tool-use execution interfaces and system health metrics.',
        sourceFile: 'web/src/pages/admin/ai/AdminAIPage.tsx',
        sourceLineRange: 'L20-L70',
        status: 'Architectural Prototype',
        keyConcepts: ['Telemetry Diagnostics', 'Prototype Agent UI', 'Anomaly Detection'],
      },
    ],
  },
  {
    id: 'dev',
    title: 'Core/Dev Infrastructure & Observability',
    roleBadge: 'CORE / DEV PLATFORM',
    tagline: 'Enterprise developer tooling, observability, dynamic versioning, and test data factories',
    description:
      'The foundational engineering infrastructure powering FoodHub: multi-level tracing loggers, hot-swappable UI component versioning, dual-mode transport layers, and synthetic dataset generators.',
    status: 'Framework Architecture',
    primaryRoute: '/dev',
    accentColor: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    keyActors: ['Engineering Team', 'QA Automation', 'CI/CD Pipelines'],
    realtimeEvents: ['LOG.API', 'LOG.REDUX', 'LOG.RENDER', 'LOG.SOCKET'],
    features: [
      {
        id: 'dev-renderer',
        name: 'Dynamic Component Versioning Engine',
        summary: 'Hot-swap component implementations (V0 through V4) at runtime without altering routing or reloading the page.',
        technicalDetails:
          'Implemented via `DevVersionRenderer.tsx` and Vite `import.meta.glob`. Registers version variants in `DevContext` and provides seamless fallback error boundaries.',
        sourceFile: 'web/src/core/dev/renderer/DevVersionRenderer.tsx',
        sourceLineRange: 'L20-L58',
        status: 'Framework Architecture',
        keyConcepts: ['Dynamic Glob Imports', 'Component Hot-Swap', 'Architecture Evolution'],
        routePath: '/',
      },
      {
        id: 'dev-logger',
        name: 'Structured Trace Logger & Log Console',
        summary: 'Custom client observability platform attaching trace IDs, performance timings, and Redux action traces.',
        technicalDetails:
          'In-memory rolling buffer with localStorage persistence (`Logger.ts`). Integrated into fetch interceptors (`api.ts`), RouteLogger, and Redux middleware with filtering by level and source.',
        sourceFile: 'web/src/core/dev/logger/Logger.ts',
        sourceLineRange: 'L15-L85',
        status: 'Client Observability',
        keyConcepts: ['Distributed Tracing', 'Performance Metrics', 'Log Filtering'],
      },
      {
        id: 'dev-dual-transport',
        name: 'Dual Transport Architecture (Mock vs. API)',
        summary: 'Instant runtime toggling between zero-dependency synthetic mock data and live REST/Socket backend.',
        technicalDetails:
          'Driven by `appConfig.api.dataSource`. Mock adapters seamlessly satisfy repository API contracts when running offline or isolated in test environments.',
        sourceFile: 'web/src/core/config/app.config.ts',
        sourceLineRange: 'L10-L60',
        status: 'Dual Transport (Mock / API)',
        keyConcepts: ['Contract Decoupling', 'Mock Adapters', 'Zero-Backend Execution'],
      },
      {
        id: 'dev-factory',
        name: 'Relational Test Data Platform & Factory',
        summary: 'Deterministic synthetic data generator creating coherent, relational graphs of users, restaurants, orders, and couriers.',
        technicalDetails:
          'Factory seed engine (`factorySeed.ts`) supporting presets (`minimal`, `development`, `stress`) with referential integrity across MongoDB collections.',
        sourceFile: 'web/src/core/dev/utils/factorySeed.ts',
        sourceLineRange: 'L30-L110',
        status: 'Integration Verified',
        keyConcepts: ['Relational Seeding', 'Preset Configurations', 'Testbed Safety'],
      },
    ],
  },

];

export const ENGINEERING_TRADEOFFS: EngineeringTradeoff[] = [
  {
    id: 'atomic-concurrency',
    title: 'Atomic Transitions vs. Stale Writes in Delivery Simulation',
    problem:
      'When delivery partner GPS movement is simulated via asynchronous server ticks, concurrent HTTP requests (e.g. customer cancellation, partner handover) could race against active simulation intervals, overwriting terminal state or corrupting driver metrics.',
    solution:
      'Implemented atomic MongoDB Compare-and-Set filters: `status: { $in: [\'picked_up\', \'out_for_delivery\', \'nearby\'] }`. If an atomic update returns null, the simulation immediately halts without touching partner metrics or re-broadcasting stale positions.',
    impact: 'Zero race-condition overwrites. Proved in automated concurrency tests (`simulator-concurrency.integration.test.ts`).',
    tradeoffConsideration:
      'Requires explicit status array guards on every DB mutation instead of simpler in-memory object manipulation, but guarantees strict ACID consistency across distributed socket events.',
    sourceFiles: [
      'API/src/modules/delivery/delivery.simulator.ts',
      'API/src/modules/delivery/__tests__/simulator-concurrency.integration.test.ts',
    ],
    sourceLineRanges: {
      'API/src/modules/delivery/delivery.simulator.ts': 'L88-L120',
    },
    status: 'Integration Verified',
  },
  {
    id: 'api-envelope-normalization',
    title: 'Defensive API Response Envelope Unwrapping',
    problem:
      'The core API client (`api.ts`) automatically unwraps response bodies containing `{ success, data }` into `data.data`. However, Redux thunk reducers and test mock adapters occasionally passed double-wrapped or raw envelope structures, resulting in silent `undefined` field assignments in UI slices.',
    solution:
      'Added defensive payload extraction: `(action.payload?.data || action.payload)` across thunk reducers (`deliveryPartnerSlice.ts`). Ensured both unwrapped client objects and envelope-wrapped transports resolve cleanly.',
    impact: 'Eliminated silent UI state drops across partner dashboard and assignment acceptance. Verified via 7 contract tests.',
    tradeoffConsideration:
      'Adds a small normalization step in thunk reducers, but eliminates transport fragility across mock adapters and production HTTP payloads.',
    sourceFiles: [
      'web/src/features/deliveryPartner/deliveryPartnerSlice.ts',
      'web/src/core/utils/api.ts',
    ],
    sourceLineRanges: {
      'web/src/features/deliveryPartner/deliveryPartnerSlice.ts': 'L252-L308',
      'web/src/core/utils/api.ts': 'L100-L135',
    },
    status: 'Unit / Contract Tested',
  },
  {
    id: 'version-renderer-architecture',
    title: 'Dynamic Component Evolution via DevVersionRenderer',
    problem:
      'During UI evolution and A/B refactoring, maintaining multiple component generations (e.g., Home V0, V1, V2, V3, V) required duplicate route declarations or brittle conditional branching inside view files.',
    solution:
      'Created `DevVersionRenderer`, an abstracted dynamic loader that leverages Vite `import.meta.glob`. Components register their variants in `DevContext`, and visitors or developers can hot-swap implementations in real-time with zero route duplication.',
    impact: 'Supports side-by-side architectural comparison of component implementations with automatic error boundary fallback.',
    tradeoffConsideration:
      'Increases initial bundle size slightly with glob imports, but provides unprecedented visibility into UI iterations and component design trade-offs.',
    sourceFiles: [
      'web/src/core/dev/renderer/DevVersionRenderer.tsx',
      'web/src/pages/Home/index.tsx',
    ],
    sourceLineRanges: {
      'web/src/core/dev/renderer/DevVersionRenderer.tsx': 'L20-L58',
      'web/src/pages/Home/index.tsx': 'L1-L18',
    },
    status: 'Framework Architecture',
  },
  {
    id: 'socket-listener-hygiene',
    title: 'Isolated Realtime Listener Teardown vs. Global Socket Reset',
    problem:
      'Generic `socket.off(\'event\')` calls without specific callback references were previously clearing all registered listeners across the app, causing sibling components (such as notifications or chat) to stop receiving live events when a single page unmounted.',
    solution:
      'Refactored socket hooks (`useDeliverySocket.ts`, `App.tsx`) to store and unbind only specific function references (`socket.off(event, handler)`). Decoupled domain-specific listeners from global application sockets.',
    impact: 'Guarantees uninterrupted real-time updates for toast notifications, chat, and background tracking during navigation.',
    tradeoffConsideration:
      'Requires explicit callback reference tracking in `useEffect` cleanup blocks rather than one-line resets, but completely prevents cross-component event drops.',
    sourceFiles: [
      'web/src/services/socket.ts',
      'web/src/App.tsx',
      'web/src/features/deliveryPartner/hooks/useDeliverySocket.ts',
    ],
    sourceLineRanges: {
      'web/src/features/deliveryPartner/hooks/useDeliverySocket.ts': 'L35-L60',
    },
    status: 'Integration Verified',
  },
  {
    id: 'multi-actor-e2e-testing',
    title: 'Concurrent 4-Actor Browser Automation Testbed',
    problem:
      'Food-delivery apps cannot be adequately tested with single-user unit tests because the core value proposition is distributed state synchronization across 4 independent actors.',
    solution:
      'Built a headless Puppeteer orchestration pipeline (`web/e2e.ts`) that launches 4 distinct browser contexts simultaneously: Customer places order → Owner accepts in real-time → Partner picks up and drives → Customer tracks GPS marker movement → Admin verifies delivery completion.',
    impact: 'Proves complete end-to-end multi-actor lifecycle functionality in under 3 minutes with zero manual intervention.',
    tradeoffConsideration:
      'E2E browser tests require running backend/socket servers, but provide 100% genuine validation that no mocked unit test can replicate.',
    sourceFiles: [
      'web/e2e.ts',
      'API/src/__tests__/multi-actor-e2e.test.ts',
    ],
    sourceLineRanges: {
      'web/e2e.ts': 'L500-L580',
    },
    status: 'Verified E2E',
  },
];


export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'client-customer',
    label: 'Customer Domain',
    subtitle: 'React 18 / Redux Toolkit',
    type: 'actor',
    color: '#3b82f6',
    portsOrChannels: ['GET /restaurants', 'POST /orders', 'WS order:join', 'WS delivery:location'],
  },
  {
    id: 'client-owner',
    label: 'Restaurant Owner Hub',
    subtitle: 'React 18 / Order Queue',
    type: 'actor',
    color: '#f59e0b',
    portsOrChannels: ['GET /orders/owned', 'PATCH /orders/:id/status', 'WS order_created'],
  },
  {
    id: 'client-partner',
    label: 'Delivery Fleet App',
    subtitle: 'Mobile UI / Leaflet Map',
    type: 'actor',
    color: '#10b981',
    portsOrChannels: ['POST /partner/:id/accept', 'PATCH /partner/:id/status', 'WS delivery_assigned'],
  },
  {
    id: 'client-admin',
    label: 'Admin Command Panel',
    subtitle: 'Fleet & Analytics Hub',
    type: 'actor',
    color: '#ef4444',
    portsOrChannels: ['GET /admin/stats', 'GET /admin/deliveries', 'WS delivery:status'],
  },
  {
    id: 'gateway-api',
    label: 'Core REST & Socket Gateway',
    subtitle: 'Node.js / Express / Socket.IO',
    type: 'service',
    color: '#8b5cf6',
    portsOrChannels: ['HTTP /api/*', 'Socket.IO Server', 'Zod Validation', 'JWT Auth Guard'],
  },
  {
    id: 'simulator-gps',
    label: 'Deterministic GPS Simulator',
    subtitle: 'Interpolation Engine',
    type: 'service',
    color: '#06b6d4',
    portsOrChannels: ['Atomic CAS Guard', '500ms Tick Loop', 'Haversine Bearing Calculator'],
  },
  {
    id: 'database-mongo',
    label: 'MongoDB Database',
    subtitle: 'Mongoose ODM',
    type: 'database',
    color: '#10b981',
    portsOrChannels: ['Users', 'Restaurants', 'Orders', 'Deliveries', 'Notifications'],
  },
  {
    id: 'core-observability',
    label: 'Observability & Dev Platform',
    subtitle: 'TraceLogger & DevConsole',
    type: 'transport',
    color: '#ec4899',
    portsOrChannels: ['Trace IDs', 'Performance Timings', 'Redux Action Interceptors', 'Mock Adapters'],
  },
];
