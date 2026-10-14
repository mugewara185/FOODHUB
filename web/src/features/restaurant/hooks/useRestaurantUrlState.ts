import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store';
import {
  hydrateFilters,
  type RestaurantFilters,
} from '@/features/restaurant/restaurantSlice';

export interface ParsedUrlState {
  filters: Partial<RestaurantFilters>;
  page: number;
}

const VALID_SORT_VALUES = ['rating', 'deliveryTime', 'price', 'price_desc', 'name'] as const;
const VALID_DELIVERY_TIMES = ['30', '40', '50', '60'] as const;

/**
 * Pure function to parse URL query parameters into Redux filter state and page number.
 * Defaults are safely omitted or defaulted. Invalid values are silently ignored.
 */
export const parseUrlParams = (params: URLSearchParams): ParsedUrlState => {
  const filters: Partial<RestaurantFilters> = {};

  // Text search
  const q = params.get('q');
  if (q !== null) {
    filters.searchQuery = q.trim().slice(0, 80);
  }

  // Cuisines (comma-separated or repeated)
  const cuisineParam = params.get('cuisine');
  if (cuisineParam !== null) {
    const list = cuisineParam
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    filters.cuisines = Array.from(new Set(list));
  }

  // Rating
  const ratingParam = params.get('rating');
  if (ratingParam !== null) {
    const num = parseInt(ratingParam, 10);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      filters.minRating = num;
    } else {
      filters.minRating = null;
    }
  }

  // Delivery Time (30 | 40 | 50 | 60)
  const timeParam = params.get('time');
  if (timeParam !== null) {
    if (VALID_DELIVERY_TIMES.includes(timeParam as any)) {
      filters.deliveryTime = timeParam;
    } else {
      filters.deliveryTime = 'all';
    }
  }

  // Open Now
  const openParam = params.get('open');
  if (openParam !== null) {
    filters.isOpen = openParam === '1' || openParam === 'true';
  }

  // Featured Only (supporting both ?featured=1 and legacy ?filter=featured)
  const featuredParam = params.get('featured');
  const legacyFilterParam = params.get('filter');
  if (featuredParam !== null || legacyFilterParam !== null) {
    filters.featuredOnly =
      featuredParam === '1' ||
      featuredParam === 'true' ||
      legacyFilterParam === 'featured';
  }

  // Sort
  const sortParam = params.get('sort');
  if (sortParam !== null && VALID_SORT_VALUES.includes(sortParam as any)) {
    filters.sortBy = sortParam as RestaurantFilters['sortBy'];
  } else {
    filters.sortBy = 'rating';
  }

  // Page
  const pageParam = params.get('page');
  let page = 1;
  if (pageParam !== null) {
    const p = parseInt(pageParam, 10);
    if (!isNaN(p) && p >= 1) {
      page = p;
    }
  }

  return { filters, page };
};

/**
 * Pure function to serialize Redux filters and current page into URLSearchParams.
 * Omits defaults (e.g. empty search, empty cuisines, rating=null, time='all', sort='rating', page=1).
 */
export const serializeUrlParams = (
  filters: RestaurantFilters,
  page: number
): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.searchQuery?.trim()) {
    params.set('q', filters.searchQuery.trim().slice(0, 80));
  }

  if (filters.cuisines?.length > 0) {
    params.set('cuisine', filters.cuisines.join(','));
  }

  if (filters.minRating && filters.minRating >= 1 && filters.minRating <= 5) {
    params.set('rating', String(filters.minRating));
  }

  if (filters.deliveryTime && filters.deliveryTime !== 'all') {
    params.set('time', filters.deliveryTime);
  }

  if (filters.isOpen) {
    params.set('open', '1');
  }

  if (filters.featuredOnly) {
    params.set('featured', '1');
  }

  if (filters.sortBy && filters.sortBy !== 'rating') {
    params.set('sort', filters.sortBy);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  return params;
};

/**
 * Hook to manage bidirectional synchronization between URLSearchParams and Redux state.
 * - Hydrates Redux filters on mount and when browser back/forward navigation occurs.
 * - Updates URL query parameters when Redux filters or page changes.
 * - Guards against update loops and prevents polluting browser history for search typing.
 */
export const useRestaurantUrlState = (isSearchDebouncePending = false) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useAppSelector((state) => state.restaurants.filters);
  const currentPage = useAppSelector((state) => state.restaurants.pagination.currentPage);

  const isSyncingFromUrlRef = useRef(false);
  const lastSerializedQueryRef = useRef<string>('');

  // 1. Sync from URL to Redux (on mount and on popstate/searchParams change)
  useEffect(() => {
    const currentSerializedQuery = searchParams.toString();

    // If this URL change was triggered by our own Redux->URL sync, ignore it
    if (currentSerializedQuery === lastSerializedQueryRef.current) {
      return;
    }

    const { filters: parsedFilters, page: parsedPage } = parseUrlParams(searchParams);

    isSyncingFromUrlRef.current = true;
    dispatch(
      hydrateFilters({
        filters: {
          searchQuery: parsedFilters.searchQuery ?? '',
          cuisines: parsedFilters.cuisines ?? [],
          minRating: parsedFilters.minRating ?? null,
          deliveryTime: parsedFilters.deliveryTime ?? 'all',
          isOpen: parsedFilters.isOpen ?? false,
          featuredOnly: parsedFilters.featuredOnly ?? false,
          sortBy: parsedFilters.sortBy ?? 'rating',
        },
        page: parsedPage,
      })
    );

    lastSerializedQueryRef.current = currentSerializedQuery;

    // Release sync flag in microtask
    queueMicrotask(() => {
      isSyncingFromUrlRef.current = false;
    });
  }, [searchParams, dispatch]);

  // 2. Sync from Redux to URL (when user changes filters or page)
  useEffect(() => {
    if (isSyncingFromUrlRef.current) {
      return;
    }

    const serializedParams = serializeUrlParams(filters, currentPage);
    const serializedQuery = serializedParams.toString();

    if (serializedQuery === searchParams.toString()) {
      lastSerializedQueryRef.current = serializedQuery;
      return;
    }

    lastSerializedQueryRef.current = serializedQuery;

    // Use replace when user is actively searching or when only search changes
    const shouldReplace = isSearchDebouncePending;
    setSearchParams(serializedParams, { replace: shouldReplace });
  }, [filters, currentPage, searchParams, setSearchParams, isSearchDebouncePending]);

  return {
    searchParams,
    setSearchParams,
  };
};

export default useRestaurantUrlState;
