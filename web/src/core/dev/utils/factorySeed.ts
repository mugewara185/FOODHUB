import { generateRestaurants } from '../../../data/factories/restaurants';
import { generateMenus } from '../../../data/factories/menus';

export interface FactorySeedPayload {
  restaurants: Array<{
    factoryId: string;
    name: string;
    description: string;
    cuisine: string[];
    address: string;
    city: string;
    rating: number;
    deliveryTime: number;
    deliveryFee: number;
    minOrder: number;
    imageUrl: string;
    coverImageUrl?: string;
    isOpen: boolean;
    isFeatured: boolean;
    tags: string[];
    phone: string;
    location?: { lat: number; lng: number };
    contact?: { phone: string; email?: string };
    openingHours?: Array<{ day: string; open: string; close: string }>;
  }>;
  menus: Array<{
    factoryRestaurantId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
  }>;
}

const parseDeliveryTime = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  return 30;
};

export const buildFactorySeedPayload = (restaurantCount = 12): FactorySeedPayload => {
  const restaurants = generateRestaurants(restaurantCount).map((restaurant) => ({
    factoryId: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine],
    address: restaurant.address,
    city: restaurant.address?.split(',').pop()?.trim() || 'Bangalore',
    rating: restaurant.rating,
    deliveryTime: parseDeliveryTime(restaurant.deliveryTime),
    deliveryFee: restaurant.deliveryFee,
    minOrder: restaurant.minOrder,
    imageUrl: restaurant.image,
    coverImageUrl: restaurant.bannerImage,
    isOpen: restaurant.isOpen,
    isFeatured: restaurant.isFeatured,
    tags: restaurant.tags,
    phone: restaurant.contact?.phone || '+91 9000000000',
    location: restaurant.location,
    contact: restaurant.contact,
    openingHours: restaurant.openingHours,
  }));

  const selectedFactoryIds = new Set(restaurants.map((restaurant) => restaurant.factoryId));
  const menus = generateMenus()
    .filter((menuItem) => selectedFactoryIds.has(menuItem.restaurantId))
    .map((menuItem) => ({
      factoryRestaurantId: menuItem.restaurantId,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      category: 'General',
      imageUrl: menuItem.image,
      isAvailable: true,
    }));

  return {
    restaurants,
    menus,
  };
};
