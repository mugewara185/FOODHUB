/**
 * Dev Console — Centralized Mock Data
 * 
 * All mock data for the dev console UI pages is co-located here to:
 * 1. Ensure consistency across pages (same restaurant names, user IDs, etc.)
 * 2. Make it easy to swap to real data sources later
 * 3. Keep page components focused on presentation, not data inventing
 */

// ─────────────────────────────────────────────────────────────────────────
// COMPONENT TREE
// ─────────────────────────────────────────────────────────────────────────

export interface ComponentNode {
  id: string;
  name: string;
  type: 'provider' | 'layout' | 'page' | 'feature' | 'ui' | 'atom';
  props: Record<string, string>;
  state?: Record<string, unknown>;
  renderCount: number;
  lastRenderMs: number;
  children?: ComponentNode[];
}

export const componentTree: ComponentNode = {
  id: 'root',
  name: 'App',
  type: 'provider',
  props: {},
  renderCount: 1,
  lastRenderMs: 2.1,
  children: [
    {
      id: 'auth-provider',
      name: 'AuthProvider',
      type: 'provider',
      props: {},
      state: { isAuthenticated: true, user: '{ id: "u_dev_01", role: "user" }' },
      renderCount: 1,
      lastRenderMs: 0.3,
      children: [
        {
          id: 'main-layout',
          name: 'MainLayout',
          type: 'layout',
          props: {},
          renderCount: 4,
          lastRenderMs: 8.7,
          children: [
            {
              id: 'app-bar',
              name: 'AppBar',
              type: 'ui',
              props: { position: 'sticky', color: 'default' },
              state: { sidebarOpen: false, searchQuery: '' },
              renderCount: 12,
              lastRenderMs: 1.2,
              children: [
                { id: 'search-bar', name: 'SearchBar', type: 'atom', props: { placeholder: 'Search...', variant: 'outlined' }, renderCount: 8, lastRenderMs: 0.4 },
                { id: 'cart-badge', name: 'CartBadge', type: 'atom', props: { count: '3' }, renderCount: 6, lastRenderMs: 0.2 },
                { id: 'user-avatar', name: 'UserAvatar', type: 'atom', props: { src: '/avatar.jpg', size: '40' }, renderCount: 2, lastRenderMs: 0.1 },
              ],
            },
            {
              id: 'home-page',
              name: 'HomePage',
              type: 'page',
              props: {},
              state: { loading: false },
              renderCount: 3,
              lastRenderMs: 24.6,
              children: [
                {
                  id: 'featured-section',
                  name: 'FeaturedRestaurants',
                  type: 'feature',
                  props: { limit: '6' },
                  state: { restaurants: '[...6 items]' },
                  renderCount: 2,
                  lastRenderMs: 12.3,
                  children: [
                    { id: 'rest-card-1', name: 'RestaurantCard', type: 'ui', props: { id: 'rest_01', name: 'Spice Garden', rating: '4.5' }, renderCount: 2, lastRenderMs: 3.1 },
                    { id: 'rest-card-2', name: 'RestaurantCard', type: 'ui', props: { id: 'rest_02', name: 'Pizza Palace', rating: '4.2' }, renderCount: 2, lastRenderMs: 2.8 },
                    { id: 'rest-card-3', name: 'RestaurantCard', type: 'ui', props: { id: 'rest_03', name: 'Burger Hub', rating: '4.7' }, renderCount: 2, lastRenderMs: 3.0 },
                  ],
                },
                {
                  id: 'cuisine-filter',
                  name: 'CuisineFilter',
                  type: 'feature',
                  props: { cuisines: '["Indian","Italian","Chinese","Mexican"]' },
                  state: { selected: '["Indian"]' },
                  renderCount: 5,
                  lastRenderMs: 1.8,
                },
                {
                  id: 'restaurant-grid',
                  name: 'RestaurantGrid',
                  type: 'feature',
                  props: { columns: '3', gap: '24' },
                  renderCount: 3,
                  lastRenderMs: 18.4,
                  children: [
                    { id: 'rest-card-4', name: 'RestaurantCard', type: 'ui', props: { id: 'rest_04', name: 'Sushi Station', rating: '4.8' }, renderCount: 1, lastRenderMs: 2.9 },
                    { id: 'rest-card-5', name: 'RestaurantCard', type: 'ui', props: { id: 'rest_05', name: 'Taco Fiesta', rating: '4.1' }, renderCount: 1, lastRenderMs: 2.7 },
                    { id: 'skeleton-grid', name: 'SkeletonGrid', type: 'atom', props: { count: '6', variant: 'rectangular' }, renderCount: 1, lastRenderMs: 0.8 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// REDUX STATE SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────

export const reduxStateSnapshot = {
  auth: {
    user: {
      id: 'u_dev_01',
      name: 'Aarush Dev',
      email: 'dev@zom2.app',
      phone: '+91 98765 43210',
      role: 'user',
      avatar: 'https://i.pravatar.cc/150?u=dev01',
      token: 'eyJhbGciOi...mock_jwt',
      isActive: true,
      emailVerified: true,
    },
    isLoggedIn: true,
    isAuthenticated: true,
    loading: false,
    error: null,
  },
  cart: {
    items: [
      { id: 'ci_01', foodItemId: 'food_001', name: 'Butter Chicken', price: 349, quantity: 2, image: '/food/butter-chicken.jpg', restaurantId: 'rest_01', restaurantName: 'Spice Garden', isVeg: false },
      { id: 'ci_02', foodItemId: 'food_007', name: 'Garlic Naan', price: 49, quantity: 4, image: '/food/garlic-naan.jpg', restaurantId: 'rest_01', restaurantName: 'Spice Garden', isVeg: true },
      { id: 'ci_03', foodItemId: 'food_012', name: 'Gulab Jamun', price: 99, quantity: 1, image: '/food/gulab-jamun.jpg', restaurantId: 'rest_01', restaurantName: 'Spice Garden', isVeg: true },
    ],
    restaurantId: 'rest_01',
    restaurantName: 'Spice Garden',
    subtotal: 993,
    deliveryFee: 29,
    tax: 49.65,
    total: 1071.65,
    couponCode: null,
    discount: 0,
    itemCount: 7,
  },
  restaurants: {
    restaurants: '[ ...20 Restaurant objects ]',
    selectedRestaurant: null,
    menuItems: '[ ...50 FoodItem objects ]',
    featuredRestaurants: '[ ...6 featured ]',
    loading: false,
    error: null,
    filters: {
      searchQuery: '',
      cuisines: ['Indian'],
      minPrice: 0,
      maxPrice: 1000,
      minRating: null,
      deliveryTime: 'all',
      isVeg: false,
      isOpen: false,
      sortBy: 'rating',
    },
    pagination: { currentPage: 1, itemsPerPage: 10 },
    favorites: ['rest_01', 'rest_05', 'rest_12'],
  },
  ui: {
    theme: 'light',
    sidebarOpen: false,
    cartDrawerOpen: false,
    searchDrawerOpen: false,
    currentModal: null,
    toast: { open: false, message: '', type: 'info' },
    loading: {},
  },
};

// ─────────────────────────────────────────────────────────────────────────
// COMPONENT VERSION DATA
// ─────────────────────────────────────────────────────────────────────────

export interface ComponentVersion {
  pageKey: string;
  componentName: string;
  versions: {
    name: string;
    label: string;
    description: string;
    features: string[];
    status: 'stable' | 'beta' | 'experimental' | 'deprecated';
    lastUpdated: string;
    author: string;
    linesOfCode: number;
  }[];
  activeVersion: string;
}

export const componentVersions: ComponentVersion[] = [
  {
    pageKey: 'RestaurantCard',
    componentName: 'RestaurantCard',
    activeVersion: 'RestaurantCard_V',
    versions: [
      {
        name: 'RestaurantCard_V',
        label: 'Default',
        description: 'Production card with rating, delivery time, cuisine tags, and favorites toggle.',
        features: ['Image lazy-load', 'Fallback image', 'Favorite toggle', 'Cuisine chips', 'Rating badge'],
        status: 'stable',
        lastUpdated: '2026-03-28',
        author: 'Aarush',
        linesOfCode: 187,
      },
      {
        name: 'RestaurantCard_V2',
        label: 'Compact',
        description: 'Condensed horizontal card for list-view layouts. Smaller footprint, no banner image.',
        features: ['Horizontal layout', 'Compact info', 'Quick-add CTA'],
        status: 'beta',
        lastUpdated: '2026-04-02',
        author: 'Aarush',
        linesOfCode: 142,
      },
    ],
  },
  {
    pageKey: 'FoodItemCard',
    componentName: 'FoodItemCard',
    activeVersion: 'FoodItemCard',
    versions: [
      {
        name: 'FoodItemCard',
        label: 'Default',
        description: 'Full food item card with customization modal trigger, veg/non-veg badge, and add-to-cart.',
        features: ['Customization modal', 'Quantity controls', 'Veg indicator', 'Price display'],
        status: 'stable',
        lastUpdated: '2026-04-06',
        author: 'Aarush',
        linesOfCode: 278,
      },
    ],
  },
  {
    pageKey: 'LoginForm',
    componentName: 'LoginForm',
    activeVersion: 'LoginForm',
    versions: [
      {
        name: 'LoginForm',
        label: 'Default',
        description: 'Email + password login with validation, error display, and dev-mode quick-login buttons.',
        features: ['Email validation', 'Password toggle', 'Dev quick-login', 'Remember me', 'Error alerts'],
        status: 'stable',
        lastUpdated: '2026-03-31',
        author: 'Aarush',
        linesOfCode: 245,
      },
      {
        name: 'LoginForm_V2',
        label: 'OTP-first',
        description: 'Phone-number first login with OTP. Falls back to email/password.',
        features: ['Phone OTP', 'Social login buttons', 'Progressive form'],
        status: 'experimental',
        lastUpdated: '2026-04-10',
        author: 'Aarush',
        linesOfCode: 312,
      },
    ],
  },
  {
    pageKey: 'OwnerDashboard',
    componentName: 'OwnerDashboard',
    activeVersion: 'DashBoard',
    versions: [
      {
        name: 'DashBoard',
        label: 'Default',
        description: 'Full owner dashboard with revenue stats, recent orders, menu overview, and review panels.',
        features: ['Revenue chart', 'Order table', 'Menu stats', 'Review summary'],
        status: 'stable',
        lastUpdated: '2026-04-01',
        author: 'Aarush',
        linesOfCode: 480,
      },
    ],
  },
  {
    pageKey: 'CartItem',
    componentName: 'CartItem',
    activeVersion: 'CartItem',
    versions: [
      {
        name: 'CartItem',
        label: 'Default',
        description: 'Cart line-item with quantity +/- controls, special instructions, and remove button.',
        features: ['Quantity controls', 'Special instructions', 'Remove item', 'Subtotal calc'],
        status: 'stable',
        lastUpdated: '2026-03-25',
        author: 'Aarush',
        linesOfCode: 156,
      },
      {
        name: 'CartItem_Swipeable',
        label: 'Swipeable',
        description: 'Mobile-optimized cart item with swipe-to-delete gesture.',
        features: ['Swipe delete', 'Touch optimized', 'Haptic feedback placeholder'],
        status: 'experimental',
        lastUpdated: '2026-04-08',
        author: 'Aarush',
        linesOfCode: 198,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// NETWORK / API CALLS
// ─────────────────────────────────────────────────────────────────────────

export interface MockApiCall {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: number;
  statusText: string;
  duration: number;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  initiator: string;
  size: string;
}

export const mockApiCalls: MockApiCall[] = [
  {
    id: 'api_001',
    timestamp: '14:23:01.234',
    method: 'GET',
    endpoint: '/api/v1/restaurants',
    status: 200,
    statusText: 'OK',
    duration: 124,
    requestHeaders: { Authorization: 'Bearer eyJhbG...', 'Content-Type': 'application/json', Accept: 'application/json' },
    responseHeaders: { 'Content-Type': 'application/json', 'X-Request-Id': 'req_abc123', 'X-Rate-Limit-Remaining': '98' },
    responseBody: { data: '[ ...20 restaurants ]', pagination: { page: 1, pageSize: 20, total: 47 } },
    initiator: 'fetchRestaurants() → restaurantSlice.ts:61',
    size: '14.2 KB',
  },
  {
    id: 'api_002',
    timestamp: '14:23:01.891',
    method: 'GET',
    endpoint: '/api/v1/restaurants/rest_01',
    status: 200,
    statusText: 'OK',
    duration: 89,
    requestHeaders: { Authorization: 'Bearer eyJhbG...', 'Content-Type': 'application/json' },
    responseHeaders: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    responseBody: { id: 'rest_01', name: 'Spice Garden', rating: 4.5, cuisine: ['Indian', 'North Indian'], menuItems: 32 },
    initiator: 'fetchRestaurantById("rest_01") → restaurantSlice.ts:74',
    size: '3.8 KB',
  },
  {
    id: 'api_003',
    timestamp: '14:23:02.456',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    status: 200,
    statusText: 'OK',
    duration: 312,
    requestHeaders: { 'Content-Type': 'application/json' },
    requestBody: { email: 'dev@zom2.app', password: '••••••••' },
    responseHeaders: { 'Content-Type': 'application/json', 'Set-Cookie': 'refresh_token=...' },
    responseBody: { user: { id: 'u_dev_01', name: 'Aarush Dev', role: 'user' }, token: 'eyJhbG...' },
    initiator: 'loginThunk() → authSlice.ts:26',
    size: '1.2 KB',
  },
  {
    id: 'api_004',
    timestamp: '14:23:03.102',
    method: 'POST',
    endpoint: '/api/v1/cart/add',
    status: 201,
    statusText: 'Created',
    duration: 67,
    requestHeaders: { Authorization: 'Bearer eyJhbG...', 'Content-Type': 'application/json' },
    requestBody: { foodItemId: 'food_001', restaurantId: 'rest_01', quantity: 1 },
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: { cartId: 'cart_01', itemCount: 3, total: 1071.65 },
    initiator: 'addToCart() → cartSlice.ts:51',
    size: '0.4 KB',
  },
  {
    id: 'api_005',
    timestamp: '14:23:04.778',
    method: 'GET',
    endpoint: '/api/v1/restaurants/rest_01/menu',
    status: 200,
    statusText: 'OK',
    duration: 156,
    requestHeaders: { Authorization: 'Bearer eyJhbG...', 'Content-Type': 'application/json' },
    responseHeaders: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    responseBody: { categories: ['Starters', 'Main Course', 'Breads', 'Desserts'], items: '[ ...32 food items ]' },
    initiator: 'fetchRestaurantById() → restaurantSlice.ts:81',
    size: '8.6 KB',
  },
  {
    id: 'api_006',
    timestamp: '14:23:05.123',
    method: 'GET',
    endpoint: '/api/v1/orders?userId=u_dev_01',
    status: 200,
    statusText: 'OK',
    duration: 201,
    requestHeaders: { Authorization: 'Bearer eyJhbG...' },
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: { orders: '[ ...5 orders ]', total: 5 },
    initiator: 'fetchOrders() → orderSlice.ts:22',
    size: '6.1 KB',
  },
  {
    id: 'api_007',
    timestamp: '14:23:06.001',
    method: 'PUT',
    endpoint: '/api/v1/user/profile',
    status: 200,
    statusText: 'OK',
    duration: 145,
    requestHeaders: { Authorization: 'Bearer eyJhbG...', 'Content-Type': 'application/json' },
    requestBody: { name: 'Aarush Dev', phone: '+91 98765 43210' },
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: { success: true, updatedAt: '2026-04-14T08:53:06Z' },
    initiator: 'updateProfile() → AuthContext.tsx:43',
    size: '0.3 KB',
  },
  {
    id: 'api_008',
    timestamp: '14:23:07.445',
    method: 'DELETE',
    endpoint: '/api/v1/cart/items/ci_03',
    status: 204,
    statusText: 'No Content',
    duration: 42,
    requestHeaders: { Authorization: 'Bearer eyJhbG...' },
    responseHeaders: {},
    responseBody: null,
    initiator: 'removeFromCart("ci_03") → cartSlice.ts:84',
    size: '0 B',
  },
  {
    id: 'api_009',
    timestamp: '14:23:08.900',
    method: 'POST',
    endpoint: '/api/v1/orders',
    status: 500,
    statusText: 'Internal Server Error',
    duration: 2340,
    requestHeaders: { Authorization: 'Bearer eyJhbG...', 'Content-Type': 'application/json' },
    requestBody: { restaurantId: 'rest_01', items: ['ci_01', 'ci_02'], paymentMethod: 'upi' },
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: { error: 'Payment gateway timeout', code: 'PAYMENT_TIMEOUT', retryAfter: 30 },
    initiator: 'placeOrder() → orderSlice.ts:45',
    size: '0.2 KB',
  },
  {
    id: 'api_010',
    timestamp: '14:23:12.333',
    method: 'GET',
    endpoint: '/api/v1/reviews?restaurantId=rest_01',
    status: 200,
    statusText: 'OK',
    duration: 178,
    requestHeaders: { Authorization: 'Bearer eyJhbG...' },
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: { reviews: '[ ...12 reviews ]', avgRating: 4.5, totalReviews: 12 },
    initiator: 'fetchReviews("rest_01") → reviewSlice.ts:18',
    size: '4.3 KB',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// EVENTS / LOG TIMELINE
// ─────────────────────────────────────────────────────────────────────────

export type EventType = 'user_action' | 'state_update' | 'api_call' | 'render' | 'error' | 'navigation';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: EventType;
  category: string;
  message: string;
  details?: string;
  source?: string;
  duration?: number;
}

export const timelineEvents: TimelineEvent[] = [
  { id: 'evt_01', timestamp: '14:22:58.100', type: 'navigation', category: 'Router', message: 'Navigate → /', source: 'BrowserRouter', },
  { id: 'evt_02', timestamp: '14:22:58.150', type: 'render', category: 'Lifecycle', message: 'MainLayout mounted', source: 'MainLayout.tsx', duration: 8.7 },
  { id: 'evt_03', timestamp: '14:22:58.200', type: 'state_update', category: 'Redux', message: 'restaurants/fetchAll/pending', source: 'restaurantSlice.ts', },
  { id: 'evt_04', timestamp: '14:23:01.234', type: 'api_call', category: 'Network', message: 'GET /api/v1/restaurants → 200 (124ms)', source: 'restaurantSlice.ts:61', duration: 124 },
  { id: 'evt_05', timestamp: '14:23:01.250', type: 'state_update', category: 'Redux', message: 'restaurants/fetchAll/fulfilled → 20 restaurants loaded', source: 'restaurantSlice.ts', },
  { id: 'evt_06', timestamp: '14:23:01.260', type: 'render', category: 'Lifecycle', message: 'FeaturedRestaurants re-rendered (6 cards)', source: 'HomePage.tsx', duration: 12.3 },
  { id: 'evt_07', timestamp: '14:23:04.500', type: 'user_action', category: 'Interaction', message: 'Click → RestaurantCard "Spice Garden"', source: 'RestaurantCard_V.tsx', },
  { id: 'evt_08', timestamp: '14:23:04.510', type: 'navigation', category: 'Router', message: 'Navigate → /restaurants/rest_01', source: 'BrowserRouter', },
  { id: 'evt_09', timestamp: '14:23:04.520', type: 'state_update', category: 'Redux', message: 'restaurants/fetchById/pending', source: 'restaurantSlice.ts', },
  { id: 'evt_10', timestamp: '14:23:04.778', type: 'api_call', category: 'Network', message: 'GET /api/v1/restaurants/rest_01/menu → 200 (156ms)', source: 'restaurantSlice.ts:81', duration: 156 },
  { id: 'evt_11', timestamp: '14:23:04.800', type: 'state_update', category: 'Redux', message: 'restaurants/fetchById/fulfilled → 32 menu items', source: 'restaurantSlice.ts', },
  { id: 'evt_12', timestamp: '14:23:06.200', type: 'user_action', category: 'Interaction', message: 'Click → "Add to Cart" on Butter Chicken', source: 'FoodItemCard.tsx', },
  { id: 'evt_13', timestamp: '14:23:06.210', type: 'state_update', category: 'Redux', message: 'cart/addToCart → Butter Chicken (qty: 1)', source: 'cartSlice.ts:51', },
  { id: 'evt_14', timestamp: '14:23:06.220', type: 'render', category: 'Lifecycle', message: 'CartBadge re-rendered (count: 1→2)', source: 'MainLayout.tsx', duration: 0.2 },
  { id: 'evt_15', timestamp: '14:23:08.900', type: 'api_call', category: 'Network', message: 'POST /api/v1/orders → 500 (2340ms)', source: 'orderSlice.ts:45', duration: 2340 },
  { id: 'evt_16', timestamp: '14:23:08.910', type: 'error', category: 'Error', message: 'Payment gateway timeout — order placement failed', source: 'orderSlice.ts', },
  { id: 'evt_17', timestamp: '14:23:09.000', type: 'state_update', category: 'Redux', message: 'ui/showToast → "Order failed. Please retry."', source: 'uiSlice.ts', },
  { id: 'evt_18', timestamp: '14:23:12.333', type: 'user_action', category: 'Interaction', message: 'Click → "Reviews" tab on restaurant page', source: 'RestaurantDetails.tsx', },
  { id: 'evt_19', timestamp: '14:23:12.500', type: 'api_call', category: 'Network', message: 'GET /api/v1/reviews?restaurantId=rest_01 → 200 (178ms)', source: 'reviewSlice.ts:18', duration: 178 },
  { id: 'evt_20', timestamp: '14:23:15.000', type: 'user_action', category: 'Interaction', message: 'Toggle → isVeg filter ON', source: 'RestaurantFilters.tsx', },
  { id: 'evt_21', timestamp: '14:23:15.010', type: 'state_update', category: 'Redux', message: 'restaurants/setVegFilter → true', source: 'restaurantSlice.ts', },
  { id: 'evt_22', timestamp: '14:23:15.020', type: 'render', category: 'Lifecycle', message: 'RestaurantGrid re-rendered (20→8 cards after veg filter)', source: 'Restaurants.tsx', duration: 6.2 },
];

// ─────────────────────────────────────────────────────────────────────────
// PERFORMANCE METRICS
// ─────────────────────────────────────────────────────────────────────────

export interface ComponentPerfEntry {
  name: string;
  path: string;
  renderCount: number;
  avgRenderMs: number;
  lastRenderMs: number;
  mountTimeMs: number;
  unmountCount: number;
  memoized: boolean;
  reRenderTriggers: string[];
}

export const componentPerfData: ComponentPerfEntry[] = [
  { name: 'HomePage', path: 'pages/Home', renderCount: 3, avgRenderMs: 22.1, lastRenderMs: 24.6, mountTimeMs: 45.2, unmountCount: 0, memoized: false, reRenderTriggers: ['restaurants.loading', 'restaurants.restaurants'] },
  { name: 'RestaurantCard', path: 'features/restaurant/components/RestaurantCard', renderCount: 42, avgRenderMs: 2.9, lastRenderMs: 3.1, mountTimeMs: 4.2, unmountCount: 12, memoized: true, reRenderTriggers: ['props.restaurant'] },
  { name: 'FoodItemCard', path: 'features/food/components/FoodItemCard', renderCount: 64, avgRenderMs: 4.1, lastRenderMs: 4.8, mountTimeMs: 6.3, unmountCount: 32, memoized: false, reRenderTriggers: ['props.item', 'cart.items'] },
  { name: 'MainLayout', path: 'shared/layout/MainLayout', renderCount: 4, avgRenderMs: 7.2, lastRenderMs: 8.7, mountTimeMs: 12.1, unmountCount: 0, memoized: false, reRenderTriggers: ['ui.sidebarOpen', 'cart.itemCount'] },
  { name: 'RestaurantFilters', path: 'features/restaurant/components/RestaurantFilters', renderCount: 18, avgRenderMs: 3.4, lastRenderMs: 2.9, mountTimeMs: 5.8, unmountCount: 2, memoized: true, reRenderTriggers: ['restaurants.filters'] },
  { name: 'CartItem', path: 'features/cart/CartItem', renderCount: 21, avgRenderMs: 1.8, lastRenderMs: 1.5, mountTimeMs: 3.1, unmountCount: 5, memoized: true, reRenderTriggers: ['props.item.quantity'] },
  { name: 'SearchBar', path: 'features/ui/components/SearchBar', renderCount: 34, avgRenderMs: 0.6, lastRenderMs: 0.4, mountTimeMs: 1.2, unmountCount: 0, memoized: true, reRenderTriggers: ['local.query'] },
  { name: 'FoodCustomizationModal', path: 'features/food/components/FoodCustomizationModal', renderCount: 8, avgRenderMs: 6.7, lastRenderMs: 7.2, mountTimeMs: 9.4, unmountCount: 4, memoized: false, reRenderTriggers: ['local.selectedAddons', 'local.selectedVariant', 'local.quantity'] },
  { name: 'ActiveFiltersRow', path: 'features/ui/components/ActiveFiltersRow', renderCount: 12, avgRenderMs: 1.2, lastRenderMs: 1.0, mountTimeMs: 2.1, unmountCount: 3, memoized: true, reRenderTriggers: ['restaurants.filters.cuisines'] },
  { name: 'OwnerDashboard', path: 'pages/_ownerPages/DashBoard', renderCount: 2, avgRenderMs: 34.5, lastRenderMs: 38.1, mountTimeMs: 52.3, unmountCount: 0, memoized: false, reRenderTriggers: ['local.statsData', 'local.recentOrders'] },
];

export const bundleMetrics = {
  totalSize: '2.41 MB',
  gzipSize: '812 KB',
  chunks: [
    { name: 'vendor.js', raw: '1.24 MB', gzip: '398 KB', modules: ['react', 'react-dom', '@mui/material', 'redux'] },
    { name: 'app.js', raw: '486 KB', gzip: '156 KB', modules: ['features/*', 'pages/*', 'core/*'] },
    { name: 'restaurant.chunk.js', raw: '124 KB', gzip: '42 KB', modules: ['RestaurantDetails', 'RestaurantCard', 'RestaurantFilters'] },
    { name: 'auth.chunk.js', raw: '89 KB', gzip: '31 KB', modules: ['LoginForm', 'SignupForm', 'ForgotPasswordForm'] },
    { name: 'admin.chunk.js', raw: '210 KB', gzip: '72 KB', modules: ['AdminDashboard', 'UsersList', 'RestaurantsList'] },
    { name: 'owner.chunk.js', raw: '178 KB', gzip: '61 KB', modules: ['OwnerDashboard', 'MenuItems', 'Categories'] },
    { name: 'dev.chunk.js', raw: '82 KB', gzip: '28 KB', modules: ['DevLayout', 'DevDashboard', 'ComponentPlayground'] },
  ],
  loadTimes: { fcp: 1.2, lcp: 2.4, fid: 12, cls: 0.04, ttfb: 180 },
};

// ─────────────────────────────────────────────────────────────────────────
// PROPS & OVERRIDES
// ─────────────────────────────────────────────────────────────────────────

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string;
  currentValue: string;
  description: string;
}

export interface ComponentPropsConfig {
  componentName: string;
  path: string;
  props: PropDefinition[];
}

export const propsOverrideData: ComponentPropsConfig[] = [
  {
    componentName: 'RestaurantCard',
    path: 'features/restaurant/components/RestaurantCard/RestaurantCard_V.tsx',
    props: [
      { name: 'restaurant', type: 'Restaurant', required: true, defaultValue: '—', currentValue: '{ id: "rest_01", name: "Spice Garden", ... }', description: 'Full restaurant data object' },
      { name: 'onFavoriteToggle', type: '(id: string) => void', required: false, defaultValue: 'undefined', currentValue: 'bound dispatch(toggleFavorite)', description: 'Callback when user toggles favorite' },
      { name: 'isFavorite', type: 'boolean', required: false, defaultValue: 'false', currentValue: 'true', description: 'Whether this restaurant is in favorites' },
    ],
  },
  {
    componentName: 'FoodItemCard',
    path: 'features/food/components/FoodItemCard.tsx',
    props: [
      { name: 'item', type: 'FoodItem', required: true, defaultValue: '—', currentValue: '{ id: "food_001", name: "Butter Chicken", price: 349, ... }', description: 'Food item data' },
      { name: 'restaurantId', type: 'string', required: true, defaultValue: '—', currentValue: '"rest_01"', description: 'Parent restaurant ID for cart association' },
      { name: 'restaurantName', type: 'string', required: true, defaultValue: '—', currentValue: '"Spice Garden"', description: 'Restaurant display name' },
      { name: 'onAddToCart', type: '(item: CartItem) => void', required: false, defaultValue: 'dispatch(addToCart)', currentValue: 'bound dispatch', description: 'Override default cart dispatch' },
    ],
  },
  {
    componentName: 'PageHeader',
    path: 'features/ui/components/PageHeader/PageHeader.tsx',
    props: [
      { name: 'title', type: 'string', required: true, defaultValue: '—', currentValue: '"All Restaurants"', description: 'Page heading text' },
      { name: 'subtitle', type: 'string', required: false, defaultValue: '""', currentValue: '"Discover your next favorite meal"', description: 'Supplementary description text' },
      { name: 'action', type: 'ReactNode', required: false, defaultValue: 'null', currentValue: '<Button>Filter</Button>', description: 'Action element (button, link, etc.)' },
      { name: 'breadcrumbs', type: 'string[]', required: false, defaultValue: '[]', currentValue: '["Home", "Restaurants"]', description: 'Breadcrumb path segments' },
    ],
  },
];
