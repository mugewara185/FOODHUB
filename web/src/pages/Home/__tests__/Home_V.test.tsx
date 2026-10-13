import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import HomeV2 from '../versions/Home_V';
import restaurantReducer from '@/features/restaurant/restaurantSlice/V/restaurantSlice_V';
import cartReducer from '@/features/cart/cartSlice/V/cartSlice_V';
import uiReducer from '@/features/ui/uiSlice';
import type { Restaurant, FoodItem } from '@/core/types';
import { restaurantApi } from '@/services/api/restaurantApi';

// Mock restaurantApi
vi.mock('@/services/api/restaurantApi', () => ({
  restaurantApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

// Mock useFavorites
vi.mock('@/features/auth/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

// Mock useHideGlobalSearch
vi.mock('@/features/ui/hooks/useHideGlobalSearch', () => ({
  useHideGlobalSearch: vi.fn(),
}));

const mockRestaurantApi = vi.mocked(restaurantApi);

const mockRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Taste of Punjab',
    description: 'Authentic Punjabi Curries',
    cuisine: ['North Indian', 'Curry'],
    rating: 4.7,
    deliveryTime: '20-30 min',
    deliveryFee: 30,
    minOrder: 150,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0',
    address: '10 GT Road',
    location: { lat: 28.61, lng: 77.2 },
    isOpen: true,
    isFeatured: true,
    isVeg: false,
    tags: ['Popular'],
    contact: '9876543210',
    openingHours: [],
  },
  {
    id: 'rest-2',
    name: 'Little Italy Pizzeria',
    description: 'Woodfired Neapolitan Pizza',
    cuisine: ['Italian', 'Pizza'],
    rating: 4.9,
    deliveryTime: '15-25 min',
    deliveryFee: 40,
    minOrder: 200,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    address: '22 Park Street',
    location: { lat: 28.62, lng: 77.21 },
    isOpen: true,
    isFeatured: true,
    isVeg: false,
    tags: ['Artisanal'],
    contact: '9876543211',
    openingHours: [],
  },
];

const mockItemsRest1: FoodItem[] = [
  {
    id: 'dish-1',
    name: 'Dal Makhani',
    description: 'Slow cooked black lentils with cream and butter',
    price: 260,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
    category: 'Mains',
    restaurantId: 'rest-1',
    restaurantName: 'Taste of Punjab',
    isVeg: true,
    isSpicy: false,
    isBestSeller: true,
    isAvailable: true,
    rating: 4.9,
    ingredients: ['Black lentils', 'Butter', 'Cream'],
    dietaryInfo: { calories: 380, protein: 12, carbs: 24, fat: 18 },
  },
];

const createTestStore = (initialRestaurants = mockRestaurants) => {
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
        menuHighlights: {
          status: 'success',
          items: [
            {
              restaurantId: initialRestaurants[0].id,
              restaurantName: initialRestaurants[0].name,
              item: mockItemsRest1[0],
            },
          ],
          error: null,
        },
      },
    },
  });
};

describe('Home_V Data Truthfulness & Structure (S05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestaurantApi.getAll.mockResolvedValue(mockRestaurants);
    mockRestaurantApi.getById.mockImplementation(async (id: string) => {
      if (id === 'rest-1') {
        return { restaurant: mockRestaurants[0], items: mockItemsRest1 };
      }
      return { restaurant: mockRestaurants[1], items: [] };
    });
  });

  const renderHome = () => {
    const store = createTestStore();
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <HomeV2 />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders all truthful section titles and genuine data', async () => {
    renderHome();

    // 1. Featured Restaurants
    expect(screen.getByRole('heading', { name: 'Featured Restaurants' })).toBeInTheDocument();

    // 2. Menu Highlights
    expect(screen.getByRole('heading', { name: 'Menu Highlights' })).toBeInTheDocument();

    // 3. Fastest Delivery
    expect(screen.getByRole('heading', { name: 'Fastest Delivery' })).toBeInTheDocument();

    // 4. Browse by Cuisine
    expect(screen.getByRole('heading', { name: 'Browse by Cuisine' })).toBeInTheDocument();

    // 5. How It Works
    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument();

    // 6. Truthful CTA
    expect(screen.getByRole('heading', { name: 'Ready to Order?' })).toBeInTheDocument();

    // Wait for restaurant and menu highlights to load
    await waitFor(() => {
      expect(screen.getAllByText('Taste of Punjab').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Little Italy Pizzeria').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Dal Makhani')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 30000);

  it('opens conflict dialog when adding dish from different restaurant while cart is not empty', async () => {
    // Preload cart with an item from a different restaurant
    const store = createTestStore();
    store.dispatch({
      type: 'cart/addToCart',
      payload: {
        foodItemId: 'different-dish',
        restaurantId: 'rest-99',
        restaurantName: 'Different Kitchen',
        name: 'Burger',
        price: 150,
        quantity: 1,
        image: '',
        isVeg: false,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <HomeV2 />
        </MemoryRouter>
      </Provider>
    );

    // Wait for Dal Makhani (from rest-1) to appear
    await waitFor(() => {
      expect(screen.getByText('Dal Makhani')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click "Add" button on Dal Makhani
    const addButtons = screen.getAllByRole('button', { name: /^Add$/i });
    fireEvent.click(addButtons[0]);

    // Verify conflict dialog appears with truthful message
    await waitFor(() => {
      expect(screen.getByText('Replace items in cart?')).toBeInTheDocument();
      expect(screen.getByText(/Your cart contains items from/)).toBeInTheDocument();
      expect(screen.getByText('Different Kitchen')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 30000);

  it('FORBIDDEN-TEXT LINT: does not contain fabricated statistics, codes, or fake testimonials', async () => {
    const { container } = renderHome();

    await waitFor(() => {
      expect(screen.getByText('Taste of Punjab')).toBeInTheDocument();
    }, { timeout: 10000 });

    const pageText = container.textContent || '';
    const pageHtml = container.innerHTML;

    // Forbidden fabricated stats
    expect(pageText).not.toMatch(/2500\+/);
    expect(pageText).not.toMatch(/50K\+/);
    expect(pageText).not.toMatch(/100K\+/);

    // Forbidden fake promo codes
    expect(pageText).not.toContain('FIRST50');
    expect(pageText).not.toContain('MEGA40');
    expect(pageText).not.toContain('FREEDELIVERY');

    // Forbidden fabricated testimonials & avatars
    expect(pageText).not.toContain('Sarah Johnson');
    expect(pageText).not.toContain('Rajesh Kumar');
    expect(pageHtml).not.toContain('pravatar.cc');

    // Forbidden scratch notes
    expect(pageText).not.toContain('add more components here');

    // Forbidden fake section headers
    expect(pageText).not.toContain('MOST ORDERED');
    expect(pageText).not.toContain('Quick Commerce');
  }, 30000);
});
