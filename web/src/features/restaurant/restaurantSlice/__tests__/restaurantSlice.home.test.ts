import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import restaurantReducer, {
  selectCuisineSummary,
  selectFastestRestaurants,
  selectMenuHighlights,
  fetchMenuHighlights,
  type RestaurantState,
} from '../V/restaurantSlice_V';
import type { Restaurant, FoodItem } from '../../../../core/types';
import type { RootState } from '../../../../app/store';
import { restaurantApi } from '../../../../services/api/restaurantApi';

vi.mock('../../../../services/api/restaurantApi', () => ({
  restaurantApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

const mockRestaurantApi = vi.mocked(restaurantApi);

const createMockRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({
  id: 'rest-1',
  name: 'Spice Corner',
  description: 'Flavors of India',
  cuisine: ['Indian', 'Curry'],
  rating: 4.5,
  deliveryTime: '30-40 min',
  deliveryFee: 40,
  minOrder: 150,
  image: 'https://example.com/spice.jpg',
  bannerImage: 'https://example.com/banner.jpg',
  address: '123 Food Street',
  location: { lat: 12.97, lng: 77.59 },
  isOpen: true,
  isFeatured: false,
  isVeg: false,
  tags: ['Spicy'],
  contact: '1234567890',
  openingHours: [],
  ...overrides,
});

const createMockFoodItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id: 'item-1',
  name: 'Paneer Butter Masala',
  description: 'Rich creamy paneer gravy',
  price: 240,
  image: 'https://example.com/paneer.jpg',
  category: 'Main Course',
  restaurantId: 'rest-1',
  restaurantName: 'Spice Corner',
  isVeg: true,
  isSpicy: false,
  isBestSeller: true,
  isAvailable: true,
  rating: 4.8,
  ingredients: ['Paneer', 'Butter', 'Tomato'],
  dietaryInfo: { calories: 350, protein: 12, carbs: 10, fat: 28 },
  ...overrides,
});

const createTestStore = (preloadedRestaurantState?: Partial<RestaurantState>) => {
  const rootReducer = combineReducers({
    restaurants: restaurantReducer,
  });
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedRestaurantState
      ? {
          restaurants: {
            ...restaurantReducer(undefined, { type: '@@INIT' }),
            ...preloadedRestaurantState,
          },
        }
      : undefined,
  });
};

describe('Home Redux Selectors & Thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('selectCuisineSummary', () => {
    it('aggregates cuisines, counts restaurants, and selects highest-rated cover image', () => {
      const restA = createMockRestaurant({
        id: 'r1',
        cuisine: ['Indian', 'Street Food'],
        rating: 4.2,
        image: 'https://example.com/img-a.jpg',
      });
      const restB = createMockRestaurant({
        id: 'r2',
        cuisine: ['Indian', 'Mughlai'],
        rating: 4.8,
        image: 'https://example.com/img-b.jpg',
      });
      const restC = createMockRestaurant({
        id: 'r3',
        cuisine: ['Italian', 'Pizza'],
        rating: 4.5,
        image: 'https://example.com/img-c.jpg',
      });

      const store = createTestStore({
        restaurants: [restA, restB, restC],
      });

      const summary = selectCuisineSummary(store.getState() as unknown as RootState);

      // Indian appears in 2 restaurants -> should be first
      expect(summary[0].name).toBe('Indian');
      expect(summary[0].count).toBe(2);
      // restB has rating 4.8 > restA rating 4.2, so coverImage should be img-b
      expect(summary[0].coverImage).toBe('https://example.com/img-b.jpg');

      // Check others exist
      const cuisineNames = summary.map((s) => s.name);
      expect(cuisineNames).toContain('Street Food');
      expect(cuisineNames).toContain('Mughlai');
      expect(cuisineNames).toContain('Italian');
      expect(cuisineNames).toContain('Pizza');
    });

    it('returns empty array when no restaurants exist', () => {
      const store = createTestStore({ restaurants: [] });
      const summary = selectCuisineSummary(store.getState() as unknown as RootState);
      expect(summary).toEqual([]);
    });
  });

  describe('selectFastestRestaurants', () => {
    it('sorts restaurants by parsed delivery minutes ascending and limits to 3', () => {
      const restSlow = createMockRestaurant({ id: 's1', name: 'Slow', deliveryTime: '45-55 min' });
      const restFast = createMockRestaurant({ id: 'f1', name: 'Fast', deliveryTime: '15-20 min' });
      const restMid = createMockRestaurant({ id: 'm1', name: 'Mid', deliveryTime: '25 min' });
      const restUltra = createMockRestaurant({ id: 'u1', name: 'Ultra', deliveryTime: '10 min' });

      const store = createTestStore({
        restaurants: [restSlow, restFast, restMid, restUltra],
      });

      const fastest = selectFastestRestaurants(store.getState() as unknown as RootState);

      expect(fastest).toHaveLength(3);
      expect(fastest[0].name).toBe('Ultra'); // 10 min
      expect(fastest[1].name).toBe('Fast');  // 15 min
      expect(fastest[2].name).toBe('Mid');   // 25 min
    });
  });

  describe('fetchMenuHighlights', () => {
    it('fetches menu highlights from top featured restaurants and filters unavailable items', async () => {
      const r1 = createMockRestaurant({ id: 'r1', name: 'Rest 1', isFeatured: true });
      const r2 = createMockRestaurant({ id: 'r2', name: 'Rest 2', isFeatured: true });

      const item1 = createMockFoodItem({ id: 'i1', name: 'Biryani', isAvailable: true });
      const item2 = createMockFoodItem({ id: 'i2', name: 'Raita', isAvailable: false }); // unavailable
      const item3 = createMockFoodItem({ id: 'i3', name: 'Kebab', isAvailable: true });
      const item4 = createMockFoodItem({ id: 'i4', name: 'Pizza', isAvailable: true });

      mockRestaurantApi.getById.mockImplementation(async (id: string) => {
        if (id === 'r1') {
          return { restaurant: r1, items: [item1, item2, item3] };
        }
        return { restaurant: r2, items: [item4] };
      });

      const store = createTestStore({
        restaurants: [r1, r2],
        featuredRestaurants: [r1, r2],
      });

      await store.dispatch(fetchMenuHighlights() as any);

      const state = selectMenuHighlights(store.getState() as unknown as RootState);
      expect(state.status).toBe('success');
      expect(state.items).toHaveLength(3); // item1, item3 (max 2 from r1, skipping unavailable item2), item4
      expect(state.items.map((h) => h.item.id)).toEqual(['i1', 'i3', 'i4']);
    });
  });
});
