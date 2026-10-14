import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RestaurantsCard } from '../RestaurantCard_V';
import type { Restaurant } from '../../../../../core/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useFavorites
vi.mock('@/features/auth/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

describe('RestaurantCard_V', () => {
  const baseRestaurant: Restaurant = {
    id: 'r1',
    name: 'Burger Palace',
    description: 'Juicy burgers',
    cuisine: ['American', 'Burgers'],
    rating: 4.6,
    deliveryTime: '25-35 min',
    deliveryFee: 40,
    minOrder: 150,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
    address: '42 Main St',
    isOpen: true,
    isFeatured: true,
    tags: ['Popular'],
    location: { lat: 12.97, lng: 77.59 },
  };

  it('transforms Unsplash image URL with query params', () => {
    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={baseRestaurant} />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Burger Palace') as HTMLImageElement;
    expect(img.src).toBe(
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=225&fit=crop&q=80'
    );
  });

  it('correctly formats Unsplash image URL that already contains query parameters', () => {
    const restaurantWithQuery: Restaurant = {
      ...baseRestaurant,
      image: 'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=800',
    };

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={restaurantWithQuery} />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Burger Palace') as HTMLImageElement;
    expect(img.src).toBe(
      'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=400&h=225&fit=crop&q=80'
    );
    expect(img.src).not.toContain('?w=800?');
  });

  it('does not add Unsplash parameters to an external image host', () => {
    const externalRestaurant: Restaurant = {
      ...baseRestaurant,
      image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    };

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={externalRestaurant} />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Burger Palace') as HTMLImageElement;
    expect(img.src).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
  });

  it('falls back to embedded placeholder when image is missing or empty', () => {
    const noImageRestaurant: Restaurant = {
      ...baseRestaurant,
      image: '',
    };

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={noImageRestaurant} />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Burger Palace') as HTMLImageElement;
    expect(img.src).toContain('data:image/png;base64');
  });

  it('resolves image from un-normalized imageUrl property if image is missing', () => {
    const unnormalizedRestaurant = {
      ...baseRestaurant,
      image: '',
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    } as unknown as Restaurant;

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={unnormalizedRestaurant} />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Burger Palace') as HTMLImageElement;
    expect(img.src).toBe(
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=225&fit=crop&q=80'
    );
  });

  it('displays "New" when rating is 0 or unrated', () => {
    const unratedRestaurant: Restaurant = {
      ...baseRestaurant,
      rating: 0,
    };

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={unratedRestaurant} />
      </MemoryRouter>
    );

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders up to 2 cuisine chips and shows +N chip for extras', () => {
    const multiCuisineRestaurant: Restaurant = {
      ...baseRestaurant,
      cuisine: ['American', 'Burgers', 'Fast Food', 'Beverages'],
    };

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={multiCuisineRestaurant} />
      </MemoryRouter>
    );

    expect(screen.getByText('American')).toBeInTheDocument();
    expect(screen.getByText('Burgers')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('safely handles missing tags and undefined cuisines without error', () => {
    const sparseRestaurant = {
      ...baseRestaurant,
      cuisine: undefined,
      tags: undefined,
      address: undefined,
      deliveryTime: 'undefined-NaN min',
    } as unknown as Restaurant;

    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={sparseRestaurant} />
      </MemoryRouter>
    );

    expect(screen.getByText('Burger Palace')).toBeInTheDocument();
    expect(screen.getByText('Local area')).toBeInTheDocument();
    expect(screen.getByText('25-35 min')).toBeInTheDocument();
  });

  it('supports accessibility attributes and keyboard navigation on Enter', () => {
    render(
      <MemoryRouter>
        <RestaurantsCard restaurant={baseRestaurant} />
      </MemoryRouter>
    );

    const card = screen.getByRole('article', { name: 'Burger Palace' });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/restaurants/r1');
  });
});

