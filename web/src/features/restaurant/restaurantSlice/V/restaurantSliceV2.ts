//async thinks, selectors, and mock data for restaurant feature
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
// import { v4 as uuidv4 } from 'uuid';
import type { RootState } from '../../../../app/store';
import type { Restaurant } from '../../../../data/types';
import getRestaurants from '../../../../data/factories/restaurants';

// Types
// export interface Restaurant {
//   id: string;
//   name: string;
//   description: string;
//   cuisine: string[];
//   rating: number;
//   deliveryTime: string;
//   deliveryFee: number;
//   minOrder: number;
//   image: string;
//   bannerImage?: string;
//   address: string;
//   isOpen: boolean;
//   isFeatured: boolean;
//   tags: string[];
// }

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  restaurantId: string;
  restaurantName: string;
  isVeg: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  isAvailable: boolean;
  rating: number;
}

export interface Category {
  id: string;
  name: string;
  items: FoodItem[];
}

export interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  menuItems: FoodItem[];
  categories: Category[];
  featuredRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;
}

// Mock data
const mockRestaurants: Restaurant[] = getRestaurants();

const mockFoodItems: FoodItem[] = [
  {
    id: '101',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato butter gravy',
    price: 320,
    originalPrice: 380,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
    category: 'Main Course',
    restaurantId: '1',
    restaurantName: 'Spice Garden',
    isVeg: false,
    isSpicy: true,
    isBestSeller: true,
    isAvailable: true,
    rating: 4.8,
  },
  {
    id: '102',
    name: 'Garlic Naan',
    description: 'Soft bread with garlic butter',
    price: 80,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=400&h=300&fit=crop',
    category: 'Breads',
    restaurantId: '1',
    restaurantName: 'Spice Garden',
    isVeg: true,
    isSpicy: false,
    isBestSeller: true,
    isAvailable: true,
    rating: 4.5,
  },
  {
    id: '103',
    name: 'Veg Biryani',
    description: 'Fragrant rice with vegetables and spices',
    price: 250,
    originalPrice: 280,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop',
    category: 'Rice',
    restaurantId: '1',
    restaurantName: 'Spice Garden',
    isVeg: true,
    isSpicy: true,
    isBestSeller: false,
    isAvailable: true,
    rating: 4.6,
  },
  {
    id: '201',
    name: 'Margherita Pizza',
    description: 'Classic cheese pizza',
    price: 299,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
    category: 'Pizza',
    restaurantId: '2',
    restaurantName: 'Pizza Paradise',
    isVeg: true,
    isSpicy: false,
    isBestSeller: true,
    isAvailable: true,
    rating: 4.7,
  },
];

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

export const { clearSelectedRestaurant, filterByCuisine } = restaurantSlice.actions;
export default restaurantSlice.reducer;

// Selectors
export const selectAllRestaurants = (state: RootState) => state.restaurants.restaurants;
export const selectFeaturedRestaurants = (state: RootState) => {
  console.log({state}); 
  return state.restaurants.featuredRestaurants;};
export const selectSelectedRestaurant = (state: RootState) => state.restaurants.selectedRestaurant;
export const selectRestaurantMenu = (state: RootState) => state.restaurants.menuItems;
export const selectMenuCategories = (state: RootState) => state.restaurants.categories;
export const selectRestaurantLoading = (state: RootState) => state.restaurants.loading;
export const selectRestaurantError = (state: RootState) => state.restaurants.error;