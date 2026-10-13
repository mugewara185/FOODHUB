//async thinks, selectors, and mock data for restaurant feature
import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from '@reduxjs/toolkit';
// import { v4 as uuidv4 } from 'uuid';
import type { RootState } from '../../../../app/store';
import type { Restaurant, FoodItem, Category } from '@core/types';
import { restaurantApi } from '@/services/api/restaurantApi';
import { logger } from '@/core/dev/logger';
import { normalizeError, type AsyncStatus, type NormalizedApiError } from '@/core/utils/asyncState';

export type RestaurantFilters = {
  searchQuery: string;
  cuisines: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  deliveryTime: string;
  isVeg: boolean;
  isOpen: boolean;
  sortBy: 'rating' | 'deliveryTime' | 'price' | 'price_desc' | 'name';
}

export interface CuisineSummary {
  name: string;
  count: number;
  coverImage: string;
}

export interface MenuHighlightItem {
  restaurantId: string;
  restaurantName: string;
  item: FoodItem;
}

export interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  menuItems: FoodItem[];
  categories: Category[];
  featuredRestaurants: Restaurant[];
  menuHighlights: {
    status: AsyncStatus;
    items: MenuHighlightItem[];
    error: NormalizedApiError | null;
  };
  fetchStatus: AsyncStatus;
  fetchByIdStatus: AsyncStatus;
  error: NormalizedApiError | null;
  loading: boolean;
  filters: RestaurantFilters;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
  // favorites: Set<string>; // Store favorite restaurant IDs
  favorites: string[]; // for serialization in localStorage, we can convert this to a Set when using it in the app logic
}

let mockRestaurants: Restaurant[] = [];
let mockFoodItems: FoodItem[] = [];

if (import.meta.env.DEV) {
  import('../../../../core/data/factories/restaurants').then(m => mockRestaurants = m.default);
  import('../../../../core/data/factories/foodItems').then(m => mockFoodItems = m.default);
}

// Helper to group items by category
const groupItemsByCategory = (items: FoodItem[]) => {
  const categories = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  return Object.entries(categories).map(([name, items]) => ({
    id: name.toLowerCase().replace(' ', '-'),
    name,
    items,
  }));
};

// Async thunks
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchAll',
  async (_, { rejectWithValue }) => {
    logger.info('RESTAURANT', 'Loading restaurants', { event: 'RESTAURANT.LOAD.START' });
    try {
      const result = await restaurantApi.getAll();
      logger.info('RESTAURANT', 'Loaded restaurants', { event: 'RESTAURANT.LOAD.SUCCESS' });
      return result;
    } catch (error) {
      logger.error('RESTAURANT', 'Failed to load restaurants', { event: 'RESTAURANT.LOAD.FAILURE', error });
      return rejectWithValue(normalizeError(error));
    }
  }
);

export const fetchRestaurantById = createAsyncThunk(
  'restaurants/fetchById',
  async (id: string, { rejectWithValue }) => {
    logger.info('RESTAURANT', 'Loading restaurant details', { event: 'RESTAURANT.DETAIL.LOAD.START', data: { restaurantId: id } });
    try {
      const result = await restaurantApi.getById(id);
      logger.info('RESTAURANT', 'Loaded restaurant details', { event: 'RESTAURANT.DETAIL.LOAD.SUCCESS' });
      return result;
    } catch (error) {
      logger.error('RESTAURANT', 'Failed to load restaurant details', { event: 'RESTAURANT.DETAIL.LOAD.FAILURE', error });
      return rejectWithValue(`Failed to fetch restaurant details:${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

export const fetchMenuHighlights = createAsyncThunk<
  MenuHighlightItem[],
  void,
  { state: RootState }
>(
  'restaurants/fetchMenuHighlights',
  async (_, { getState, rejectWithValue }) => {
    logger.info('RESTAURANT', 'Fetching menu highlights', { event: 'RESTAURANT.HIGHLIGHTS.START' });
    try {
      const state = getState() as RootState;
      let candidates = state.restaurants.featuredRestaurants;
      if (!candidates || candidates.length === 0) {
        candidates = state.restaurants.restaurants.slice(0, 3);
      }
      const topRestaurants = candidates.slice(0, 3);
      if (topRestaurants.length === 0) {
        return [];
      }

      const results = await Promise.allSettled(
        topRestaurants.map((r) => restaurantApi.getById(r.id))
      );

      const highlights: MenuHighlightItem[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled') {
          const { restaurant, items } = res.value;
          const availableItems = items.filter((item) => item.isAvailable !== false);
          for (const item of availableItems.slice(0, 2)) {
            highlights.push({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              item,
            });
          }
        }
      }
      logger.info('RESTAURANT', 'Menu highlights loaded', {
        event: 'RESTAURANT.HIGHLIGHTS.SUCCESS',
        data: { count: highlights.length },
      });
      return highlights;
    } catch (error) {
      logger.error('RESTAURANT', 'Failed to fetch menu highlights', {
        event: 'RESTAURANT.HIGHLIGHTS.FAILURE',
        error,
      });
      return rejectWithValue(normalizeError(error));
    }
  }
);

const initialState: RestaurantState = {
  restaurants: [],
  selectedRestaurant: null,
  menuItems: [],
  categories: [],
  featuredRestaurants: [],
  menuHighlights: {
    status: 'idle',
    items: [],
    error: null,
  },
  fetchStatus: 'idle',
  fetchByIdStatus: 'idle',
  loading: false,
  error: null,
  filters: {
    searchQuery: '',
    cuisines: [],
    minPrice: 0,
    maxPrice: 1000,
    minRating: null,
    deliveryTime: 'all',
    isVeg: false,
    isOpen: false,
    sortBy: 'rating',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
  },
  favorites: [],
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearSelectedRestaurant: (state) => {
      state.selectedRestaurant = null;
      state.menuItems = [];
      state.categories = [];
    },
    //restaurants
    filterByCuisine: (state, action: PayloadAction<string>) => {
      // Filter restaurants by cuisine
      if (action.payload === 'all') {
        state.restaurants = mockRestaurants;
      } else {
        state.restaurants = mockRestaurants.filter(r =>
          r.cuisine.includes(action.payload)
        );
      }
    },
    //filter state reducers
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    toggleCuisine: (state, action: PayloadAction<string>) => {
      const cuisine = action.payload;
      if (state.filters.cuisines.includes(cuisine)) {
        state.filters.cuisines = state.filters.cuisines.filter(c => c !== cuisine);
      } else {
        state.filters.cuisines.push(cuisine);
      }
      // Reset pagination when filters change
      state.pagination.currentPage = 1; //dev-implement:later change logic to stay in the same page even after filter change, if the current page has results after filtering, otherwise reset to page 1.
    },
    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.filters.minPrice = action.payload[0];
      state.filters.maxPrice = action.payload[1];
      state.pagination.currentPage = 1;
    },
    setMinRating: (state, action: PayloadAction<number | null>) => {
      state.filters.minRating = action.payload;
      state.pagination.currentPage = 1;
    },
    setDeliveryTime: (state, action: PayloadAction<string>) => {
      state.filters.deliveryTime = action.payload;
      state.pagination.currentPage = 1;
    },
    setVegFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.isVeg = action.payload;
      state.pagination.currentPage = 1;
    },
    setOpenNowFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.isOpen = action.payload;
      state.pagination.currentPage = 1;
    },
    setSortBy: (state, action: PayloadAction<RestaurantFilters['sortBy']>) => {
      state.filters.sortBy = action.payload;
      state.pagination.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = {
        searchQuery: '',
        cuisines: [],
        minPrice: 0,
        maxPrice: 1000,
        minRating: null,
        deliveryTime: 'all',
        isVeg: false,
        isOpen: false,
        sortBy: 'rating',
      };
      state.pagination.currentPage = 1;
    },
    //pagination 
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    //favourite 
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const restaurantId = action.payload;
      if (state.favorites.includes(restaurantId)) {
        state.favorites = state.favorites.filter(id => id !== restaurantId);
      } else {
        state.favorites.push(restaurantId);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch restaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.fetchStatus = 'success';
        state.restaurants = action.payload;
        state.featuredRestaurants = action.payload.filter(r => r.isFeatured);
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })

      // Fetch restaurant by ID
      .addCase(fetchRestaurantById.pending, (state) => {
        state.fetchByIdStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        // console.log('fetchRestaurantById.fulfilled:', {state, action})
        state.loading = false;
        state.selectedRestaurant = action.payload.restaurant;
        state.menuItems = action.payload.items;
        state.categories = groupItemsByCategory(action.payload.items);
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.fetchByIdStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })

      // Fetch menu highlights
      .addCase(fetchMenuHighlights.pending, (state) => {
        state.menuHighlights.status = 'loading';
        state.menuHighlights.error = null;
      })
      .addCase(fetchMenuHighlights.fulfilled, (state, action) => {
        state.menuHighlights.status = 'success';
        state.menuHighlights.items = action.payload;
      })
      .addCase(fetchMenuHighlights.rejected, (state, action) => {
        state.menuHighlights.status = 'error';
        state.menuHighlights.error = action.payload as NormalizedApiError;
      });
  },
});

export const { clearSelectedRestaurant, filterByCuisine, clearFilters, setCurrentPage, setDeliveryTime, setMinRating, setOpenNowFilter, setPriceRange, setSearchQuery, setSortBy, setVegFilter, toggleCuisine, toggleFavorite } = restaurantSlice.actions;
export default restaurantSlice.reducer;

// Selectors
export const selectAllRestaurants = (state: RootState) => state.restaurants.restaurants;
export const selectFeaturedRestaurants = (state: RootState) => state.restaurants.featuredRestaurants;
export const selectSelectedRestaurant = (state: RootState) => state.restaurants.selectedRestaurant;
export const selectRestaurantMenu = (state: RootState) => state.restaurants.menuItems;
export const selectMenuCategories = (state: RootState) => state.restaurants.categories;
export const selectRestaurantLoading = (state: RootState) => state.restaurants.fetchStatus === 'loading';
export const selectFetchStatus = (state: RootState) => state.restaurants.fetchStatus;
export const selectRestaurantError = (state: RootState) => state.restaurants.error;
export const selectMenuHighlights = (state: RootState) => state.restaurants.menuHighlights;

export const selectCuisineSummary = createSelector(
  [selectAllRestaurants],
  (restaurants): CuisineSummary[] => {
    const map = new Map<string, { count: number; bestRating: number; image: string }>();
    for (const r of restaurants) {
      const cuisines = Array.isArray(r.cuisine) ? r.cuisine : [];
      for (const c of cuisines) {
        const trimmed = c.trim();
        if (!trimmed) continue;
        const existing = map.get(trimmed);
        const currentRating = r.rating || 0;
        const currentImg = r.image || '';
        if (!existing) {
          map.set(trimmed, { count: 1, bestRating: currentRating, image: currentImg });
        } else {
          existing.count += 1;
          if (currentRating > existing.bestRating && currentImg) {
            existing.bestRating = currentRating;
            existing.image = currentImg;
          }
        }
      }
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        coverImage: data.image,
      }))
      .sort((a, b) => b.count - a.count);
  }
);

export const selectFastestRestaurants = createSelector(
  [selectAllRestaurants],
  (restaurants) => {
    return [...restaurants]
      .sort((a, b) => {
        const timeA = parseInt(String(a.deliveryTime), 10) || 999;
        const timeB = parseInt(String(b.deliveryTime), 10) || 999;
        return timeA - timeB;
      })
      .slice(0, 3);
  }
);

export const selectFilteredRestaurants = createSelector(
  [selectAllRestaurants, (state: RootState) => state.restaurants.filters],
  (restaurants, filters) => {
    return restaurants.filter(restaurant => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = restaurant.name.toLowerCase().includes(query);
        const matchesCuisine = restaurant.cuisine.some(c => c.toLowerCase().includes(query));
        if (!matchesName && !matchesCuisine) return false;
      }

      // Cuisine filter
      if (filters.cuisines.length > 0) {
        if (!restaurant.cuisine.some(c => filters.cuisines.includes(c))) return false;
      }

      // Price filter
      if (restaurant.minOrder < filters.minPrice! || restaurant.minOrder > filters.maxPrice!) return false;

      // Rating filter
      if (filters.minRating && restaurant.rating < filters.minRating) return false;

      // Delivery time filter
      if (filters.deliveryTime !== 'all' && restaurant.deliveryTime !== filters.deliveryTime) return false;

      // Veg filter
      if (filters.isVeg && !restaurant.isVeg) return false;

      // Open now filter
      if (filters.isOpen && !restaurant.isOpen) return false;

      return true;
    });
  }
);

export const selectSortedRestaurants = createSelector(
  [selectFilteredRestaurants, (state: RootState) => state.restaurants.filters.sortBy],
  (restaurants, sortBy) => {
    const sorted = [...restaurants];

    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'deliveryTime':
        return sorted.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
      case 'price':
        return sorted.sort((a, b) => a.minOrder - b.minOrder);
      case 'price_desc':
        return sorted.sort((a, b) => b.minOrder - a.minOrder);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }
);

export const selectPaginatedRestaurants = createSelector(
  [selectSortedRestaurants, (state: RootState) => state.restaurants.pagination],
  (restaurants, pagination) => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return restaurants.slice(start, end);
  }
);

export const selectTotalPages = createSelector(
  [selectFilteredRestaurants, (state: RootState) => state.restaurants.pagination.itemsPerPage],
  (restaurants, itemsPerPage) => Math.ceil(restaurants.length / itemsPerPage)
);

export const selectActiveFiltersCount = createSelector(
  [(state: RootState) => state.restaurants.filters],
  (filters) => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.cuisines.length) count++;
    if (filters.minRating) count++;
    if (filters.deliveryTime !== 'all') count++;
    if (filters.isVeg) count++;
    if (filters.isOpen) count++;
    if (filters.minPrice! > 0 || filters.maxPrice! < 1000) count++;
    return count;
  }
);

export const selectFavorites = (state: RootState) => state.auth.user?.favoriteRestaurants || [];