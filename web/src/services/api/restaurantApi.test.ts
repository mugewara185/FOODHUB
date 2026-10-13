import { describe, it, expect } from 'vitest';
import { normalizeRestaurant, normalizeMenuItems } from './restaurantApi';

describe('normalizeRestaurant (characterization)', () => {
  const baseDto = {
    _id: 'rest-123',
    name: 'Spice Junction',
    description: 'Fine Indian dining',
    cuisine: ['Indian', 'Curry'],
    address: '42 MG Road',
    city: 'Bangalore',
    rating: 4.6,
    totalRatings: 120,
    priceRange: 2,
    imageUrl: 'https://example.com/primary.jpg',
    isOpen: true,
    deliveryTime: 30,
    minOrder: 250,
    phone: '+919876543210',
  };

  it('normalizes numeric deliveryTime to "X-(X+10) min" format', () => {
    const restaurant = normalizeRestaurant({
      ...baseDto,
      deliveryTime: 30,
    });
    expect(restaurant.deliveryTime).toBe('30-40 min');

    const fastRestaurant = normalizeRestaurant({
      ...baseDto,
      deliveryTime: 20,
    });
    expect(fastRestaurant.deliveryTime).toBe('20-30 min');
  });

  it('defaults missing deliveryFee to 0 when undefined', () => {
    const withoutFee = normalizeRestaurant({
      ...baseDto,
      deliveryFee: undefined,
    });
    expect(withoutFee.deliveryFee).toBe(0);

    const withFee = normalizeRestaurant({
      ...baseDto,
      deliveryFee: 49,
    });
    expect(withFee.deliveryFee).toBe(49);
  });

  it('handles imageUrl vs image fallback priority', () => {
    // When imageUrl is provided, it is preferred
    const withBoth = normalizeRestaurant({
      ...baseDto,
      imageUrl: 'https://example.com/primary.jpg',
      image: 'https://example.com/legacy.jpg',
    });
    expect(withBoth.image).toBe('https://example.com/primary.jpg');

    // When imageUrl is empty, falls back to image
    const fallbackToImage = normalizeRestaurant({
      ...baseDto,
      imageUrl: '',
      image: 'https://example.com/legacy.jpg',
    });
    expect(fallbackToImage.image).toBe('https://example.com/legacy.jpg');

    // When both are empty/missing, defaults to empty string
    const emptyImages = normalizeRestaurant({
      ...baseDto,
      imageUrl: '',
      image: undefined,
    });
    expect(emptyImages.image).toBe('');
  });

  it('handles bannerImage from coverImageUrl or bannerImage', () => {
    const withCover = normalizeRestaurant({
      ...baseDto,
      coverImageUrl: 'https://example.com/cover.jpg',
      bannerImage: 'https://example.com/banner.jpg',
    });
    expect(withCover.bannerImage).toBe('https://example.com/cover.jpg');

    const fallbackBanner = normalizeRestaurant({
      ...baseDto,
      coverImageUrl: undefined,
      bannerImage: 'https://example.com/banner.jpg',
    });
    expect(fallbackBanner.bannerImage).toBe('https://example.com/banner.jpg');
  });

  it('leaves isVeg undefined because backend schema lacks this field (D-13 root cause)', () => {
    const restaurant = normalizeRestaurant(baseDto);
    expect(restaurant.isVeg).toBeUndefined();
  });

  it('maps _id to id and defaults isFeatured to false when absent', () => {
    const unfeatured = normalizeRestaurant({
      ...baseDto,
      isFeatured: undefined,
    });
    expect(unfeatured.id).toBe('rest-123');
    expect(unfeatured.isFeatured).toBe(false);

    const featured = normalizeRestaurant({
      ...baseDto,
      isFeatured: true,
    });
    expect(featured.isFeatured).toBe(true);
  });
});

describe('normalizeMenuItems (characterization)', () => {
  it('maps backend menu items and injects safe defaults for absent fields', () => {
    const rawItems = [
      {
        _id: 'item-1',
        name: 'Butter Chicken',
        description: 'Creamy gravy chicken',
        price: 320,
        category: 'Main Course',
        imageUrl: 'https://example.com/bc.jpg',
        isAvailable: true,
      },
    ];

    const normalized = normalizeMenuItems(rawItems, 'rest-123', 'Spice Junction');
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toEqual({
      id: 'item-1',
      name: 'Butter Chicken',
      description: 'Creamy gravy chicken',
      price: 320,
      category: 'Main Course',
      image: 'https://example.com/bc.jpg',
      isAvailable: true,
      restaurantId: 'rest-123',
      restaurantName: 'Spice Junction',
      isVeg: false,
      isSpicy: false,
      isBestSeller: false,
      rating: 0,
      addons: [],
      variants: [],
    });
  });
});
