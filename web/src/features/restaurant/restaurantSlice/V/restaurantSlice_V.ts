//async thinks, selectors, and mock data for restaurant feature
import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from '@reduxjs/toolkit';
// import { v4 as uuidv4 } from 'uuid';
import type { RootState } from '../../../../app/store';
import type { Restaurant, FoodItem, Category } from '@core/types';
import getRestaurants from '../../../../data/factories/restaurants';
import mockFoodItems from '../../../../data/factories/foodItems';

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

export interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  menuItems: FoodItem[];
  categories: Category[];
  featuredRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  filters: RestaurantFilters;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
  // favorites: Set<string>; // Store favorite restaurant IDs
  favorites: string[]; // for serialization in localStorage, we can convert this to a Set when using it in the app logic
}

// Mock data
const mockRestaurants: Restaurant[] = getRestaurants;

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
    try {
      // throw new Error('Simulated API failure'); // Simulate error for testing
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockRestaurants;
    } catch (error) {
      return rejectWithValue(`Failed to fetch restaurants:${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

export const fetchRestaurantById = createAsyncThunk(
  'restaurants/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const restaurant = mockRestaurants.find(r => r.id === id);
      if (!restaurant) throw new Error('Restaurant not found');

      const items = mockFoodItems.filter(item => item.restaurantId === id);
      console.log({"items":mockFoodItems,"filteredItems":items})
      return { restaurant, items };
    } catch (error) {
      return rejectWithValue(`Failed to fetch restaurant details:${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

const initialState: RestaurantState = {
  restaurants: [],
  selectedRestaurant: null,
  menuItems: [],
  categories: [],
  featuredRestaurants: [],
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
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload;
        state.featuredRestaurants = action.payload.filter(r => r.isFeatured);
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch restaurant by ID
      .addCase(fetchRestaurantById.pending, (state) => {
        state.loading = true;
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
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedRestaurant, filterByCuisine, clearFilters, setCurrentPage,setDeliveryTime,setMinRating,setOpenNowFilter,setPriceRange,setSearchQuery,setSortBy,setVegFilter,toggleCuisine,toggleFavorite } = restaurantSlice.actions;
export default restaurantSlice.reducer;

// Selectors
export const selectAllRestaurants = (state: RootState) => state.restaurants.restaurants;
export const selectFeaturedRestaurants = (state: RootState) => state.restaurants.featuredRestaurants;
export const selectSelectedRestaurant = (state: RootState) => state.restaurants.selectedRestaurant;
export const selectRestaurantMenu = (state: RootState) => state.restaurants.menuItems;
export const selectMenuCategories = (state: RootState) => state.restaurants.categories;
export const selectRestaurantLoading = (state: RootState) => state.restaurants.loading;
export const selectRestaurantError = (state: RootState) => state.restaurants.error;

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

export const selectFavorites = (state: RootState) => state.restaurants.favorites;