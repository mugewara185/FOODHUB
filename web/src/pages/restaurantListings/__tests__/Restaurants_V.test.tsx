import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import restaurantReducer, {
  type RestaurantState,
} from '@/features/restaurant/restaurantSlice/V/restaurantSlice_V';
import Restaurants_V from '../V/Restaurants_V';
import type { Restaurant } from '@/core/types';
import { restaurantApi } from '@/services/api/restaurantApi';

vi.mock('@/services/api/restaurantApi', () => ({
  restaurantApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

// Mock useFavorites hook to avoid Firebase/auth dependencies
vi.mock('@/features/auth/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

const mockUseHideGlobalSearch = vi.fn();
vi.mock('@/features/ui/hooks/useHideGlobalSearch', () => ({
  useHideGlobalSearch: () => mockUseHideGlobalSearch(),
}));

const mockRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Royal Biryani House',
    description: 'Authentic Hyderabadi Dum Biryani',
    cuisine: ['Indian', 'Biryani'],
    rating: 4.8,
    deliveryTime: '30-40 min',
    deliveryFee: 40,
    minOrder: 150,
    image: 'https://example.com/biryani.jpg',
    bannerImage: 'https://example.com/banner.jpg',
    address: '123 Food Street',
    location: { lat: 12.97, lng: 77.59 },
    isOpen: true,
    isFeatured: true,
    tags: ['Top Rated', 'Biryani'],
  },
  {
    id: 'rest-2',
    name: 'Pizza Roma',
    description: 'Wood fired authentic pizza',
    cuisine: ['Italian', 'Pizza'],
    rating: 4.2,
    deliveryTime: '20-30 min',
    deliveryFee: 30,
    minOrder: 200,
    image: 'https://example.com/pizza.jpg',
    bannerImage: 'https://example.com/banner2.jpg',
    address: '456 Italian Ave',
    location: { lat: 12.98, lng: 77.60 },
    isOpen: true,
    isFeatured: false,
    tags: ['Pizza'],
  },
  {
    id: 'rest-3',
    name: 'Tokyo Sushi Bar',
    description: 'Fresh sushi and sashimi',
    cuisine: ['Japanese', 'Sushi'],
    rating: 4.6,
    deliveryTime: '40-50 min',
    deliveryFee: 50,
    minOrder: 300,
    image: 'https://example.com/sushi.jpg',
    bannerImage: 'https://example.com/banner3.jpg',
    address: '789 Tokyo Blvd',
    location: { lat: 12.99, lng: 77.61 },
    isOpen: false,
    isFeatured: true,
    tags: ['Sushi', 'Healthy'],
  },
];

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

const renderWithRouterAndStore = (
  initialEntries: string[] = ['/restaurants'],
  preloadedState?: Partial<RestaurantState>
) => {
  const store = createTestStore({
    restaurants: mockRestaurants,
    fetchStatus: 'success',
    lastFetchedAt: Date.now(),
    ...preloadedState,
  });

  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/restaurants" element={<Restaurants_V />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  return { ...utils, store };
};

describe('Restaurants_V Listing Page Integration & Polish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(restaurantApi.getAll).mockResolvedValue(mockRestaurants);
  });

  it('renders discovery page header and truthful restaurant count badge', () => {
    renderWithRouterAndStore();

    expect(screen.getByRole('heading', { level: 1, name: /explore restaurants/i })).toBeInTheDocument();
    expect(screen.getByText(/discover top-rated dining, fast delivery, and authentic cuisines near you/i)).toBeInTheDocument();
    expect(screen.getByText(/3 places/i)).toBeInTheDocument();
  });

  it('initializes filters and active chips from supported URL query parameters', async () => {
    renderWithRouterAndStore(['/restaurants?cuisine=Indian&featured=1&rating=4']);

    // Check active chips appear
    await waitFor(() => {
      const activeChips = screen.getByTestId('active-filter-chips');
      expect(within(activeChips).getByText('Indian')).toBeInTheDocument();
      expect(within(activeChips).getByText('Featured Only')).toBeInTheDocument();
      expect(within(activeChips).getByText('4★ & up')).toBeInTheDocument();
    });

    // Only rest-1 matches (Indian, featured, rating 4.8)
    expect(screen.getByText('Royal Biryani House')).toBeInTheDocument();
    expect(screen.queryByText('Pizza Roma')).not.toBeInTheDocument();
    expect(screen.queryByText('Tokyo Sushi Bar')).not.toBeInTheDocument();
  });

  it('handles search input with debounce and updates filtered cards', async () => {
    const { store } = renderWithRouterAndStore();

    const searchInput = screen.getByPlaceholderText(/search restaurants, cuisines, or tags/i);
    fireEvent.change(searchInput, { target: { value: 'pizza' } });

    // Wait for 400ms debounce
    await waitFor(() => {
      expect(store.getState().restaurants.filters.searchQuery).toBe('pizza');
    }, { timeout: 1000 });

    expect(screen.getByText('Pizza Roma')).toBeInTheDocument();
    expect(screen.queryByText('Royal Biryani House')).not.toBeInTheDocument();
  });

  it('clears active filters and restores full catalogue when Clear All is clicked', async () => {
    const { store } = renderWithRouterAndStore(['/restaurants?cuisine=Japanese']);

    await waitFor(() => {
      const activeChips = screen.getByTestId('active-filter-chips');
      expect(within(activeChips).getByText('Japanese')).toBeInTheDocument();
    });

    expect(screen.getByText('Tokyo Sushi Bar')).toBeInTheDocument();
    expect(screen.queryByText('Pizza Roma')).not.toBeInTheDocument();

    const clearButton = screen.getAllByRole('button', { name: /clear all/i })[0];
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(store.getState().restaurants.filters.cuisines).toEqual([]);
    });

    // All restaurants restored
    expect(screen.getByText('Royal Biryani House')).toBeInTheDocument();
    expect(screen.getByText('Pizza Roma')).toBeInTheDocument();
    expect(screen.getByText('Tokyo Sushi Bar')).toBeInTheDocument();
  });

  it('displays truthful empty state when filters produce zero matches and allows reset', async () => {
    renderWithRouterAndStore(['/restaurants?q=nonexistent_kitchen']);

    await waitFor(() => {
      expect(screen.getByText(/no restaurants match your filters/i)).toBeInTheDocument();
    });

    const resetButton = screen.getByRole('button', { name: /reset all filters/i });
    expect(resetButton).toBeInTheDocument();
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Royal Biryani House')).toBeInTheDocument();
    });
  });

  it('displays retryable error alert when catalogue fetch fails', async () => {
    vi.mocked(restaurantApi.getAll).mockRejectedValueOnce(new Error('Network connectivity timeout'));

    renderWithRouterAndStore(['/restaurants'], {
      restaurants: [],
      error: 'Network connectivity timeout' as any,
    });

    await waitFor(() => {
      expect(screen.getByText(/network connectivity timeout/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry loading/i });
    expect(retryButton).toBeInTheDocument();

    vi.mocked(restaurantApi.getAll).mockResolvedValueOnce(mockRestaurants);
    fireEvent.click(retryButton);
    expect(restaurantApi.getAll).toHaveBeenCalled();
  });

  it('invokes useHideGlobalSearch to prevent duplicate search bars on the listing page', () => {
    renderWithRouterAndStore(['/restaurants']);
    expect(mockUseHideGlobalSearch).toHaveBeenCalled();
  });

  it('correctly calculates pagination summary bounds based on itemsPerPage', () => {
    renderWithRouterAndStore(['/restaurants'], {
      pagination: {
        currentPage: 2,
        itemsPerPage: 2,
      },
    });

    expect(screen.getByText(/showing 3–3 of 3 places/i)).toBeInTheDocument();
  });
});
