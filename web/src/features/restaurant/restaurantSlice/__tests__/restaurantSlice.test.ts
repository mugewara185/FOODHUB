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
  hydrateFilters,
  setFeaturedOnly,
  selectFilteredRestaurants,
  selectPaginatedRestaurants,
  selectTotalPages,
  selectHasVegData,
  selectIsInitialLoading,
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

  it('resets pagination to 1 when setSearchQuery is dispatched (fixes D-11)', () => {
    const store = createTestStore();

    store.dispatch(setCurrentPage(3));
    expect(store.getState().restaurants.pagination.currentPage).toBe(3);

    // D-11 fixed: setSearchQuery updates query and resets pagination.currentPage to 1
    store.dispatch(setSearchQuery('pizza'));
    expect(store.getState().restaurants.filters.searchQuery).toBe('pizza');
    expect(store.getState().restaurants.pagination.currentPage).toBe(1);
  });

  it('sets filters.cuisines and leaves loaded restaurants intact (fixes D-10)', () => {
    const initialRestaurants = [
      createMockRestaurant({ id: 'r1', name: 'Restaurant 1' }),
      createMockRestaurant({ id: 'r2', name: 'Restaurant 2' }),
    ];
    const store = createTestStore({ restaurants: initialRestaurants });

    expect(store.getState().restaurants.restaurants).toHaveLength(2);

    // D-10 fixed: filterByCuisine sets filters.cuisines and leaves loaded restaurants intact
    store.dispatch(filterByCuisine('Indian'));
    expect(store.getState().restaurants.filters.cuisines).toEqual(['Indian']);
    expect(store.getState().restaurants.restaurants).toHaveLength(2);

    store.dispatch(filterByCuisine('all'));
    expect(store.getState().restaurants.filters.cuisines).toEqual([]);
    expect(store.getState().restaurants.restaurants).toHaveLength(2);
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

  it('filters deliveryTime by upper bound threshold (fixes D-12)', () => {
    const store = createTestStore({ restaurants: [r1] }); // r1 has deliveryTime: '30-40 min'

    // 'all' includes the restaurant
    store.dispatch(setDeliveryTime('all'));
    let filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(1);

    // Within 40 min includes '30-40 min' (upper bound 40 <= 40)
    store.dispatch(setDeliveryTime('40'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(1);

    // Within 30 min excludes '30-40 min' (upper bound 40 > 30)
    store.dispatch(setDeliveryTime('30'));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(0);
  });

  it('isVeg filter evaluates only restaurants with boolean isVeg (fixes D-13)', () => {
    const store = createTestStore({ restaurants: [r1, r2, r4] });
    // r1: isVeg === undefined (API normalized)
    // r2: isVeg === true
    // r4: isVeg === false

    store.dispatch(setVegFilter(true));
    const filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);

    // D-13 fixed: r2 (true) is included, r1 (undefined) is not excluded, r4 (false) is excluded
    expect(filtered.map(r => r.id)).toEqual(['r1', 'r2']);
    expect(filtered.some(r => r.id === 'r4')).toBe(false);
  });

  it('filters by featuredOnly when enabled', () => {
    const f1 = createMockRestaurant({ id: 'f1', isFeatured: true });
    const f2 = createMockRestaurant({ id: 'f2', isFeatured: false });
    const store = createTestStore({ restaurants: [f1, f2] });

    let filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(2);

    store.dispatch(setFeaturedOnly(true));
    filtered = selectFilteredRestaurants(store.getState() as unknown as RootState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('f1');
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

describe('hydrateFilters and UI selectors', () => {
  it('hydrates partial filters and page atomically', () => {
    const store = createTestStore();
    store.dispatch(
      hydrateFilters({
        filters: {
          searchQuery: 'biryani',
          cuisines: ['Indian'],
          minRating: 4,
          deliveryTime: '30',
          isOpen: true,
          featuredOnly: true,
          sortBy: 'name',
        },
        page: 2,
      })
    );

    const filters = store.getState().restaurants.filters;
    expect(filters.searchQuery).toBe('biryani');
    expect(filters.cuisines).toEqual(['Indian']);
    expect(filters.minRating).toBe(4);
    expect(filters.deliveryTime).toBe('30');
    expect(filters.isOpen).toBe(true);
    expect(filters.featuredOnly).toBe(true);
    expect(filters.sortBy).toBe('name');
    expect(store.getState().restaurants.pagination.currentPage).toBe(2);
  });

  it('selectHasVegData returns true only when at least one restaurant has boolean isVeg', () => {
    const noVegStore = createTestStore({
      restaurants: [createMockRestaurant({ isVeg: undefined })],
    });
    expect(selectHasVegData(noVegStore.getState() as unknown as RootState)).toBe(false);

    const withVegStore = createTestStore({
      restaurants: [createMockRestaurant({ isVeg: true })],
    });
    expect(selectHasVegData(withVegStore.getState() as unknown as RootState)).toBe(true);
  });

  it('selectIsInitialLoading identifies initial empty loading versus background refresh', () => {
    const initialLoadingStore = createTestStore({
      fetchStatus: 'loading',
      restaurants: [],
    });
    expect(selectIsInitialLoading(initialLoadingStore.getState() as unknown as RootState)).toBe(true);

    const backgroundRefreshStore = createTestStore({
      fetchStatus: 'loading',
      restaurants: [createMockRestaurant()],
    });
    expect(selectIsInitialLoading(backgroundRefreshStore.getState() as unknown as RootState)).toBe(false);
  });
});
