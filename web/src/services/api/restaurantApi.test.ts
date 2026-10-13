import { describe, it, expect } from 'vitest';
import { normalizeRestaurant } from './restaurantApi';

describe('normalizeRestaurant', () => {
  const baseDto = {
    _id: 'rest-123',
    name: 'Spice Hub',
    description: 'Authentic spices',
    cuisine: ['Indian'],
    address: '123 Market St',
    city: 'Bangalore',
    rating: 4.5,
    totalRatings: 120,
    priceRange: 2,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    isOpen: true,
    deliveryTime: 30,
    minOrder: 200,
    phone: '+91 9999999999',
  };

  it('maps backend imageUrl to frontend image property', () => {
    const restaurant = normalizeRestaurant(baseDto);
    expect(restaurant.image).toBe(baseDto.imageUrl);
    expect(restaurant.id).toBe('rest-123');
    expect(restaurant.name).toBe('Spice Hub');
    expect(restaurant.deliveryTime).toBe('30-40 min');
  });

  it('falls back to image field if imageUrl is empty string or whitespace', () => {
    const dtoWithImage = {
      ...baseDto,
      imageUrl: '   ',
      image: 'https://example.com/fallback-image.jpg',
    };
    const restaurant = normalizeRestaurant(dtoWithImage);
    expect(restaurant.image).toBe('https://example.com/fallback-image.jpg');
  });

  it('defaults image to empty string when neither imageUrl nor image is provided', () => {
    const dtoWithoutImages = {
      ...baseDto,
      imageUrl: '',
      image: undefined,
    };
    const restaurant = normalizeRestaurant(dtoWithoutImages);
    expect(restaurant.image).toBe('');
  });

  it('maps coverImageUrl to bannerImage with fallback', () => {
    const restaurant = normalizeRestaurant(baseDto);
    expect(restaurant.bannerImage).toBe(baseDto.coverImageUrl);

    const dtoWithBanner = {
      ...baseDto,
      coverImageUrl: undefined,
      bannerImage: 'https://example.com/banner.jpg',
    };
    const restaurantWithBanner = normalizeRestaurant(dtoWithBanner);
    expect(restaurantWithBanner.bannerImage).toBe('https://example.com/banner.jpg');
  });
});
