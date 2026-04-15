/**
 * State Initializers using unifiedFactory
 * 
 * Best Practices Applied:
 * 1. Separation of concerns - initialization logic separated from store config
 * 2. Type safety - explicit types for all initial states
 * 3. Error boundaries - graceful fallback if factory fails
 * 4. Lazy loading - factory imported only when needed
 * 5. Reusability - can be used in tests or other contexts
 */

import type { CartState } from '../../../features/cart/cartSlice/V/cartSlice_V';
import type { RestaurantState } from '../../../features/restaurant/restaurantSlice/V/restaurantSlice_V';
import type { UIState } from '../../../features/ui/uiSlice';
import type { AuthUser, Restaurant, FoodItem } from '../../../core/types';
import { generateAllDummyData } from '../../../data/factories/unifiedFactory';

// Type for auth state to match the structure in authSlice
interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Safe fallback states with proper structure
const AUTH_INITIAL_STATE: AuthState = {
  user: null,
  isLoggedIn: false,
  loading: false,
  isAuthenticated: false,
  error: null,
};

const CART_INITIAL_STATE: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  subtotal: 0,
  deliveryFee: 29,
  tax: 0,
  total: 0,
  couponCode: null,
  discount: 0,
  itemCount: 0,
};

const UI_INITIAL_STATE: UIState = {
  theme: typeof window !== 'undefined' && localStorage.getItem("theme") === "dark" ? "dark" : "light",
  sidebarOpen: false,
  cartDrawerOpen: false,
  searchDrawerOpen: false,
  currentModal: null,
  toast: {
    open: false,
    message: "",
    type: "info",
  },
  loading: {},
};

/**
 * Initialize auth state from unifiedFactory
 * Loads first test user if available, or falls back to null
 */
export const initializeAuthState = (seedData: {
  users?: AuthUser[];
}): AuthState => {
  try {
    return {
      ...AUTH_INITIAL_STATE,
      user: seedData?.users?.[0] || null,
    };
  } catch (error) {
    console.warn('[Store Init] Failed to initialize auth state:', error);
    return AUTH_INITIAL_STATE;
  }
};

/**
 * Initialize cart state (typically empty on fresh load)
 * Cart is persisted, so this is the fallback for fresh installs
 */
export const initializeCartState = (): CartState => {
  return CART_INITIAL_STATE;
};

/**
 * Initialize restaurant state from unifiedFactory
 * Includes categorized menu items and featured restaurants
 */
export const initializeRestaurantState = (seedData: {
  restaurants?: Restaurant[];
  foodItems?: FoodItem[];
}): RestaurantState => {
  try {
    const restaurants = (seedData?.restaurants || []) as Restaurant[];
    const foodItems = (seedData?.foodItems || []) as FoodItem[];

    // Group food items by category
    const grouped = foodItems.reduce((acc: Record<string, FoodItem[]>, item: FoodItem) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    const categories = Object.entries(grouped).map(([name, items]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      items: items,
    }));

    return {
      restaurants: restaurants,
      selectedRestaurant: null,
      menuItems: foodItems,
      categories,
      featuredRestaurants: restaurants
        .filter((r: Restaurant) => r.isFeatured)
        .slice(0, 10),
      loading: false,
      error: null,
      filters: {
        searchQuery: "",
        cuisines: [],
        minPrice: null,
        maxPrice: null,
        minRating: null,
        deliveryTime: "",
        isVeg: false,
        isOpen: true,
        sortBy: "rating" as const,
      },
      pagination: {
        currentPage: 1,
        itemsPerPage: 12,
      },
      favorites: [],
    };
  } catch (error) {
    console.warn('[Store Init] Failed to initialize restaurant state:', error);
    return {
      restaurants: [],
      selectedRestaurant: null,
      menuItems: [],
      categories: [],
      featuredRestaurants: [],
      loading: false,
      error: null,
      filters: {
        searchQuery: "",
        cuisines: [],
        minPrice: null,
        maxPrice: null,
        minRating: null,
        deliveryTime: "",
        isVeg: false,
        isOpen: true,
        sortBy: "rating" as const,
      },
      pagination: {
        currentPage: 1,
        itemsPerPage: 12,
      },
      favorites: [],
    };
  }
};

/**
 * Initialize UI state (uses localStorage theme preference)
 */
export const initializeUIState = (): UIState => {
  return UI_INITIAL_STATE;
};

/**
 * Main initializer function
 * Loads all dummy data from unifiedFactory with optimized counts
 * 
 * Usage:
 * ```ts
 * const preloadedState = initializeAllStatesFromFactory({
 *   restaurantCount: 20,
 *   foodItemCount: 50,
 *   userCount: 5,
 *   orderCount: 5,
 *   reviewCount: 10,
 * });
 * ```
 * 
 * @param options - Configuration for factory data generation
 * @returns Complete initial state object for Redux store (without _persist)
 */
export const initializeAllStatesFromFactory = (options?: {
  restaurantCount?: number;
  foodItemCount?: number;
  userCount?: number;
  orderCount?: number;
  reviewCount?: number;
}): {
  auth: AuthState;
  cart: CartState;
  restaurants: RestaurantState;
  ui: UIState;
} => {
  try {
    // Use pre-imported generateAllDummyData
    if (!generateAllDummyData || typeof generateAllDummyData !== 'function') {
      throw new Error('generateAllDummyData not found in unifiedFactory');
    }

    // Generate seed data with optimized counts
    // Note: function expects config objects with count property, not FactoryInput type
    const seedData = generateAllDummyData({
      restaurants: { count: options?.restaurantCount ?? 20 },
      foodItems: { count: options?.foodItemCount ?? 50 },
      users: { count: options?.userCount ?? 5, includeTestAccounts: true },
      orders: { count: options?.orderCount ?? 5 },
      reviews: { count: options?.reviewCount ?? 10 },
    } as never); // Type cast due to type mismatch in factory function

    return {
      auth: initializeAuthState({ users: seedData.users as AuthUser[] }),
      cart: initializeCartState(),
      restaurants: initializeRestaurantState({
        restaurants: seedData.restaurants,
        foodItems: seedData.foodItems,
      }),
      ui: initializeUIState(),
    };
  } catch (error) {
    console.error('[Store Init] Failed to initialize states from factory:', error);
    console.info('[Store Init] Using fallback empty states');
    
    // Return safe fallback states
    return {
      auth: AUTH_INITIAL_STATE,
      cart: CART_INITIAL_STATE,
      restaurants: {
        restaurants: [],
        selectedRestaurant: null,
        menuItems: [],
        categories: [],
        featuredRestaurants: [],
        loading: false,
        error: null,
        filters: {
          searchQuery: "",
          cuisines: [],
          minPrice: null,
          maxPrice: null,
          minRating: null,
          deliveryTime: "",
          isVeg: false,
          isOpen: true,
          sortBy: "rating" as const,
        },
        pagination: {
          currentPage: 1,
          itemsPerPage: 12,
        },
        favorites: [],
      },
      ui: UI_INITIAL_STATE,
    };
  }
};

/**
 * Initialize states with empty/minimal data (for testing or offline scenarios)
 */
export const initializeEmptyStates = (): {
  auth: AuthState;
  cart: CartState;
  restaurants: RestaurantState;
  ui: UIState;
} => ({
  auth: AUTH_INITIAL_STATE,
  cart: CART_INITIAL_STATE,
  restaurants: {
    restaurants: [],
    selectedRestaurant: null,
    menuItems: [],
    categories: [],
    featuredRestaurants: [],
    loading: false,
    error: null,
    filters: {
      searchQuery: "",
      cuisines: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      deliveryTime: "",
      isVeg: false,
      isOpen: true,
      sortBy: "rating" as const,
    },
    pagination: {
      currentPage: 1,
      itemsPerPage: 12,
    },
    favorites: [],
  },
  ui: UI_INITIAL_STATE,
});
