import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RestaurantsCard } from '../RestaurantCard_V';
import type { Restaurant } from '../../../../../core/types';

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
});
