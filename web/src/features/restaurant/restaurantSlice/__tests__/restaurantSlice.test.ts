import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import restaurantReducer, {
  toggleCuisine,
  setSearchQuery,
  setCurrentPage,
  setMinRating,
  setDeliveryTime,
  setVegFilter,
  filterByCuisine,
  fetchRestaurants,
  selectFilteredRestaurants,
  selectPaginatedRestaurants,
  selectTotalPages,
  type RestaurantState,
} from '../V/restaurantSlice_V';
import type { Restaurant } from '../../../../core/types';
import type { RootState } from '../../../../app/store';
import { restaurantApi } from '../../../../services/api/restaurantApi';

vi.mock('../../../../services/api/restaurantApi', () => ({
  restaurantApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

const createMockRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({
  id: 'rest-1',
  name: 'Royal Biryani House',
  description: 'Authentic Hyderabadi Dum Biryani',
  cuisine: ['Indian', 'Biryani'],
  rating: 4.5,
  deliveryTime: '30-40 min',
  deliveryFee: 40,
  minOrder: 150,
  image: 'https://example.com/biryani.jpg',
  bannerImage: 'https://example.com/banner.jpg',
  address: '123 Food Street',
  location: { lat: 12.97, lng: 77.59 },
  isOpen: true,
  isFeatured: false,
  tags: ['Top Rated'],
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

describe('restaurantSlice reducers and pagination (characterization)', () => {
  it('resets currentPage to 1 when toggleCuisine is dispatched', () => {
    const store = createTestStore();

    store.dispatch(setCurrentPage(3));
    expect(store.getState().restaurants.pagination.currentPage).toBe(3);

    // Adding cuisine resets to page 1
    store.dispatch(toggleCuisine('Italian'));
    expect(store.getState().restaurants.filters.cuisines).toEqual(['Italian']);
    expect(store.getState().restaurants.pagination.currentPage).toBe(1);

    // Removing cuisine also resets to page 1
    store.dispatch(setCurrentPage(4));
    store.dispatch(toggleCuisine('Italian'));
    expect(store.getState().restaurants.filters.cuisines).toEqual([]);
    expect(store.getState().restaurants.pagination.currentPage).toBe(1);
  });

  it('characterizes D-11: setSearchQuery does NOT reset pagination to 1 (known defect)', () => {
    const store = createTestStore();

    store.dispatch(setCurrentPage(3));
    expect(store.getState().restaurants.pagination.currentPage).toBe(3);

    // KNOWN-DEFECT D-11: setSearchQuery updates query but does NOT reset pagination.currentPage
    store.dispatch(setSearchQuery('pizza'));
    expect(store.getState().restaurants.filters.searchQuery).toBe('pizza');
    expect(store.getState().restaurants.pagination.currentPage).toBe(3);
  });

  it('characterizes D-10: filterByCuisine("all") clobbers loaded restaurants when mockRestaurants is empty', () => {
    const initialRestaurants = [
      createMockRestaurant({ id: 'r1', name: 'Restaurant 1' }),
      createMockRestaurant({ id: 'r2', name: 'Restaurant 2' }),
    ];
    const store = createTestStore({ restaurants: initialRestaurants });

    expect(store.getState().restaurants.restaurants).toHaveLength(2);

    // KNOWN-DEFECT D-10: In production/unit test environment mockRestaurants is [],
    // so filterByCuisine('all') replaces state.restaurants with []
    store.dispatch(filterByCuisine('all'));
    expect(store.getState().restaurants.restaurants).toEqual([]);
  });
});

describe('selectFilteredRestaurants (characterization)', () => {
  const r1 = createMockRestaurant({
    id: 'r1',
    name: 'Royal Biryani House',
    cuisine: ['Indian', 'Mughlai'],
    rating: 4.5,
    minOrder: 150,
    deliveryTime: '30-40 min',
    isVeg: undefined, // Backend normalizer omits isVeg
    isOpen: true,
  });

  const r2 = createMockRestaurant({
    id: 'r2',
    name: 'Pizza Roma',
    cuisine: ['Italian'],
    rating: 3.8,
    minOrder: 250,
    deliveryTime: '20-30 min',
    isVeg: true,
    isOpen: true,
  });

  const r3 = createMockRestaurant({
    id: 'r3',
    name: 'Green Vegan Bowl',
    cuisine: ['Healthy', 'Salads'],
    rating: 4.8,
    minOrder: 100,
    deliveryTime: '15-25 min',
    isVeg: true,
    isOpen: false,
  });

  const r4 = createMockRestaurant({
    id: 'r4',
    name: 'Carnivore Grill',
    cuisine: ['BBQ'],
    rating: 4.2,
    minOrder: 300,
    deliveryTime: '30-40 min',
    isVeg: false,
    isOpen: true,
  });

  const allSampleRestaurants = [r1, r2, r3, r4];

  it('filters by search query matching name or cuisine case-insensitively', () => {
    const store = createTestStore({ restaurants: allSampleRestaurants });

    // Match name
    store.dispatch(setSearchQuery('biryani'));
    let filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered.map(r => r.id)).toEqual(['r1']);

    // Match cuisine
    store.dispatch(setSearchQuery('italian'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered.map(r => r.id)).toEqual(['r2']);

    // No match
    store.dispatch(setSearchQuery('nonexistent'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toEqual([]);
  });

  it('filters by cuisine selection', () => {
    const store = createTestStore({ restaurants: allSampleRestaurants });

    store.dispatch(toggleCuisine('Indian'));
    let filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered.map(r => r.id)).toEqual(['r1']);

    store.dispatch(toggleCuisine('Italian'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered.map(r => r.id)).toEqual(['r1', 'r2']);
  });

  it('filters by minimum rating', () => {
    const store = createTestStore({ restaurants: allSampleRestaurants });

    store.dispatch(setMinRating(4.5));
    const filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    // r1 (4.5) and r3 (4.8) qualify; r2 (3.8) and r4 (4.2) are excluded
    expect(filtered.map(r => r.id)).toEqual(['r1', 'r3']);
  });

  it('characterizes D-12: deliveryTime filter uses strict equality against formatted string', () => {
    const store = createTestStore({ restaurants: [r1] }); // r1 has deliveryTime: '30-40 min'

    // 'all' includes the restaurant
    store.dispatch(setDeliveryTime('all'));
    let filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(1);

    // Exact string match '30-40 min' includes the restaurant
    store.dispatch(setDeliveryTime('30-40 min'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(1);

    // KNOWN-DEFECT D-12: UI option '10-15 mins' or numeric '30' does not match formatted string
    store.dispatch(setDeliveryTime('10-15 mins'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(0);

    store.dispatch(setDeliveryTime('30'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(0);
  });

  it('characterizes D-13: isVeg filter excludes restaurants where isVeg is undefined (all API data)', () => {
    const store = createTestStore({ restaurants: [r1, r2, r4] });
    // r1: isVeg === undefined (API normalized)
    // r2: isVeg === true
    // r4: isVeg === false

    store.dispatch(setVegFilter(true));
    const filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);

    // KNOWN-DEFECT D-13: Because !restaurant.isVeg is true when isVeg is undefined,
    // all API restaurants with undefined isVeg are excluded
    expect(filtered.map(r => r.id)).toEqual(['r2']);
    expect(filtered.some(r => r.id === 'r1')).toBe(false);
  });
});

describe('selectPaginatedRestaurants and selectTotalPages (characterization)', () => {
  it('correctly calculates total pages and slices 25 items at 10 itemsPerPage', () => {
    const twentyFiveRestaurants = Array.from({ length: 25 }, (_, i) =>
      createMockRestaurant({
        id: `rest-${i + 1}`,
        name: `Restaurant ${String(i + 1).padStart(2, '0')}`,
        rating: 4.0, // Same rating so sort order is stable
      })
    );

    const store = createTestStore({
      restaurants: twentyFiveRestaurants,
      pagination: {
        currentPage: 1,
        itemsPerPage: 10,
      },
    });

    // Total pages for 25 items at 10/page should be 3
    const totalPages = selectTotalPages(store.getState() as unknown as RootState);
    expect(totalPages).toBe(3);

    // Page 1: items 0..9 (length 10)
    store.dispatch(setCurrentPage(1));
    let pageItems = selectPaginatedRestaurants(store.getState() as unknown as RootState);
    expect(pageItems).toHaveLength(10);
    expect(pageItems[0].id).toBe('rest-1');
    expect(pageItems[9].id).toBe('rest-10');

    // Page 2: items 10..19 (length 10)
    store.dispatch(setCurrentPage(2));
    pageItems = selectPaginatedRestaurants(store.getState() as unknown as RootState);
    expect(pageItems).toHaveLength(10);
    expect(pageItems[0].id).toBe('rest-11');
    expect(pageItems[9].id).toBe('rest-20');

    // Page 3: items 20..24 (length 5)
    store.dispatch(setCurrentPage(3));
    pageItems = selectPaginatedRestaurants(store.getState() as unknown as RootState);
    expect(pageItems).toHaveLength(5);
    expect(pageItems[0].id).toBe('rest-21');
    expect(pageItems[4].id).toBe('rest-25');
  });
});

describe('fetchRestaurants thunk (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates restaurants and sets featuredRestaurants when fulfilled', async () => {
    const mockData: Restaurant[] = [
      createMockRestaurant({ id: 'r1', name: 'Featured 1', isFeatured: true }),
      createMockRestaurant({ id: 'r2', name: 'Regular 1', isFeatured: false }),
      createMockRestaurant({ id: 'r3', name: 'Featured 2', isFeatured: true }),
    ];

    vi.mocked(restaurantApi.getAll).mockResolvedValue(mockData);

    const store = createTestStore();
    expect(store.getState().restaurants.fetchStatus).toBe('idle');

    await store.dispatch(fetchRestaurants());

    const state = store.getState().restaurants;
    expect(state.fetchStatus).toBe('success');
    expect(state.restaurants).toHaveLength(3);
    expect(state.featuredRestaurants).toHaveLength(2);
    expect(state.featuredRestaurants.map(r => r.id)).toEqual(['r1', 'r3']);
  });
});
