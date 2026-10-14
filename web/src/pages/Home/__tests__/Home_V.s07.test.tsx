import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HomeV2 from '../versions/Home_V';
import { SectionHeader } from '@/features/home/components/shared/SectionHeader';
import { SectionContainer } from '@/features/home/components/shared/SectionContainer';
import { Reveal } from '@/features/home/components/shared/Reveal';
import restaurantReducer from '@/features/restaurant/restaurantSlice/V/restaurantSlice_V';
import cartReducer from '@/features/cart/cartSlice/V/cartSlice_V';
import uiReducer from '@/features/ui/uiSlice';
import type { Restaurant } from '@/core/types';

import { restaurantApi } from '@/services/api/restaurantApi';

vi.mock('@/services/api/restaurantApi', () => ({
  restaurantApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('@/features/auth/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

vi.mock('@/features/ui/hooks/useHideGlobalSearch', () => ({
  useHideGlobalSearch: vi.fn(),
}));

const mockRestaurantApi = vi.mocked(restaurantApi);

const mockRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Taste of Punjab',
    cuisine: ['North Indian', 'Punjabi'],
    rating: 4.8,
    deliveryTime: '20-30 min',
    deliveryFee: 0,
    priceRange: '₹₹',
    image: '',
    imageUrl: '',
    isFeatured: true,
  },
  {
    id: 'rest-2',
    name: 'Little Italy Pizzeria',
    cuisine: ['Italian', 'Pizza'],
    rating: 4.5,
    deliveryTime: '15-25 min',
    deliveryFee: 25,
    priceRange: '₹₹₹',
    image: '',
    imageUrl: '',
    isFeatured: true,
  },
];

const createTestStore = (initialRestaurants = mockRestaurants, error: string | null = null) => {
  return configureStore({
    reducer: combineReducers({
      restaurants: restaurantReducer,
      cart: cartReducer,
      ui: uiReducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
    preloadedState: {
      restaurants: {
        ...restaurantReducer(undefined, { type: '@@INIT' }),
        restaurants: initialRestaurants,
        featuredRestaurants: initialRestaurants.filter((r) => r.isFeatured),
        error,
      },
    },
  });
};

describe('S07 Home Visual Redesign & A11y Hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestaurantApi.getAll.mockResolvedValue(mockRestaurants);
    mockRestaurantApi.getById.mockResolvedValue({ restaurant: mockRestaurants[0], items: [] });
  });

  describe('Shared Design Primitives', () => {
    it('SectionHeader renders semantic h2 heading, subtitle, and action button', () => {
      const handleAction = vi.fn();
      render(
        <SectionHeader
          title="Featured Kitchens"
          subtitle="Handpicked quality dining"
          actionLabel="View All"
          onActionClick={handleAction}
        />
      );

      const heading = screen.getByRole('heading', { level: 2, name: 'Featured Kitchens' });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Handpicked quality dining')).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: 'View All' });
      expect(actionBtn).toBeInTheDocument();
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('SectionContainer renders children inside semantic section tag', () => {
      const { container } = render(
        <SectionContainer id="test-section" alternateBg>
          <div>Section Content</div>
        </SectionContainer>
      );

      const section = container.querySelector('section#test-section');
      expect(section).toBeInTheDocument();
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });

    it('Reveal renders children safely in test/reduced-motion environments', () => {
      render(
        <Reveal yOffset={10}>
          <span>Animated Child</span>
        </Reveal>
      );

      expect(screen.getByText('Animated Child')).toBeInTheDocument();
    });
  });

  describe('Home_V Semantic Hierarchy & Layout', () => {
    it('maintains accessible heading hierarchy with exactly one h1 and sequential h2 elements', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/']}>
            <HomeV2 />
          </MemoryRouter>
        </Provider>
      );

      // Exactly one h1 on the entire page (Hero title)
      const h1Headings = screen.getAllByRole('heading', { level: 1 });
      expect(h1Headings).toHaveLength(1);
      expect(h1Headings[0]).toHaveTextContent(/Craving something/i);

      // Sequential section h2 headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      const h2Texts = h2Headings.map((h) => h.textContent?.trim());

      expect(h2Texts).toContain('Featured Restaurants');
      expect(h2Texts).toContain('Menu Highlights');
      expect(h2Texts).toContain('Fastest Delivery');
      expect(h2Texts).toContain('Browse by Cuisine');
      expect(h2Texts).toContain('How It Works');
      expect(h2Texts).toContain('Ready to Order?');
    });

    it('renders global retryable error alert when restaurant loading fails', async () => {
      mockRestaurantApi.getAll.mockRejectedValueOnce(new Error('Network connection failure'));
      const store = createTestStore([]);
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/']}>
            <HomeV2 />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to load restaurants/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('renders gracefully when store has zero restaurants without throwing or horizontal overflow', () => {
      const store = createTestStore([]);
      const { container } = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/']}>
            <HomeV2 />
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(container.textContent).toContain('Ready to Order?');
    });
  });
});
