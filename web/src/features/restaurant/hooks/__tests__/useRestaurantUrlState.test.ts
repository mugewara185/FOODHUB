import { describe, it, expect } from 'vitest';
import { parseUrlParams, serializeUrlParams } from '../useRestaurantUrlState';
import type { RestaurantFilters } from '@/features/restaurant/restaurantSlice';

describe('useRestaurantUrlState pure functions', () => {
  describe('parseUrlParams', () => {
    it('parses valid supported query parameters', () => {
      const params = new URLSearchParams('q=biryani&cuisine=Indian,Mughlai&rating=4&time=30&open=1&featured=1&sort=price&page=3');
      const { filters, page } = parseUrlParams(params);

      expect(filters.searchQuery).toBe('biryani');
      expect(filters.cuisines).toEqual(['Indian', 'Mughlai']);
      expect(filters.minRating).toBe(4);
      expect(filters.deliveryTime).toBe('30');
      expect(filters.isOpen).toBe(true);
      expect(filters.featuredOnly).toBe(true);
      expect(filters.sortBy).toBe('price');
      expect(page).toBe(3);
    });

    it('safely handles legacy ?filter=featured query param', () => {
      const params = new URLSearchParams('filter=featured');
      const { filters } = parseUrlParams(params);
      expect(filters.featuredOnly).toBe(true);
    });

    it('safely ignores invalid, out-of-range, or unsupported values without throwing', () => {
      const params = new URLSearchParams('q=%20%20hello%20%20&rating=99&time=999&sort=unsupported_sort&page=-5');
      const { filters, page } = parseUrlParams(params);

      expect(filters.searchQuery).toBe('hello');
      expect(filters.minRating).toBeNull();
      expect(filters.deliveryTime).toBe('all');
      expect(filters.sortBy).toBe('rating');
      expect(page).toBe(1);
    });

    it('caps search query at 80 characters', () => {
      const longQuery = 'a'.repeat(120);
      const params = new URLSearchParams(`q=${longQuery}`);
      const { filters } = parseUrlParams(params);

      expect(filters.searchQuery).toHaveLength(80);
      expect(filters.searchQuery).toBe('a'.repeat(80));
    });

    it('returns empty/default filters when query string is empty', () => {
      const params = new URLSearchParams('');
      const { filters, page } = parseUrlParams(params);

      expect(filters.searchQuery).toBeUndefined();
      expect(filters.cuisines).toBeUndefined();
      expect(filters.minRating).toBeUndefined();
      expect(filters.deliveryTime).toBeUndefined();
      expect(filters.isOpen).toBeUndefined();
      expect(filters.featuredOnly).toBeUndefined();
      expect(filters.sortBy).toBe('rating');
      expect(page).toBe(1);
    });
  });

  describe('serializeUrlParams', () => {
    const baseFilters: RestaurantFilters = {
      searchQuery: '',
      cuisines: [],
      minPrice: 0,
      maxPrice: 1000,
      minRating: null,
      deliveryTime: 'all',
      isVeg: false,
      isOpen: false,
      featuredOnly: false,
      sortBy: 'rating',
    };

    it('omits defaults from URLSearchParams', () => {
      const params = serializeUrlParams(baseFilters, 1);
      expect(params.toString()).toBe('');
    });

    it('serializes non-default filters and page > 1', () => {
      const customFilters: RestaurantFilters = {
        ...baseFilters,
        searchQuery: 'pizza',
        cuisines: ['Italian', 'Continental'],
        minRating: 4,
        deliveryTime: '40',
        isOpen: true,
        featuredOnly: true,
        sortBy: 'deliveryTime',
      };

      const params = serializeUrlParams(customFilters, 2);
      expect(params.get('q')).toBe('pizza');
      expect(params.get('cuisine')).toBe('Italian,Continental');
      expect(params.get('rating')).toBe('4');
      expect(params.get('time')).toBe('40');
      expect(params.get('open')).toBe('1');
      expect(params.get('featured')).toBe('1');
      expect(params.get('sort')).toBe('deliveryTime');
      expect(params.get('page')).toBe('2');
    });

    it('round-trips custom filter state cleanly through serialize -> parse', () => {
      const customFilters: RestaurantFilters = {
        ...baseFilters,
        searchQuery: 'tacos',
        cuisines: ['Mexican'],
        minRating: 3,
        deliveryTime: '50',
        isOpen: true,
        featuredOnly: true,
        sortBy: 'name',
      };

      const serialized = serializeUrlParams(customFilters, 4);
      const { filters, page } = parseUrlParams(serialized);

      expect(filters.searchQuery).toBe(customFilters.searchQuery);
      expect(filters.cuisines).toEqual(customFilters.cuisines);
      expect(filters.minRating).toBe(customFilters.minRating);
      expect(filters.deliveryTime).toBe(customFilters.deliveryTime);
      expect(filters.isOpen).toBe(customFilters.isOpen);
      expect(filters.featuredOnly).toBe(customFilters.featuredOnly);
      expect(filters.sortBy).toBe(customFilters.sortBy);
      expect(page).toBe(4);
    });
  });
});
