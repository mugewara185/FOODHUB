/**
 * restaurantApi.ts
 *
 * API service for the restaurant domain.
 * Used ONLY when VITE_DATA_SOURCE=api.
 *
 * Follows the same fetch-based pattern as authApi.ts and reviewApi.ts.
 * All Backend→Frontend normalization is isolated here.
 */

import { appConfig } from '../../core/config/app.config';
import type { Restaurant, FoodItem } from '../../core/types';

// ─────────────────────────────────────────────────────────────────────────────
// Raw Backend DTO shapes (what the API actually returns)
// ─────────────────────────────────────────────────────────────────────────────

/** A single menu item as stored in the Restaurant.menu embedded array */
interface MenuItemApiDTO {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

/** A restaurant document returned by GET /api/restaurants and GET /api/restaurants/:id */
interface RestaurantApiDTO {
  _id: string;
  name: string;
  description: string;
  cuisine: string[];
  address: string;
  city: string;
  rating: number;
  totalRatings: number;
  priceRange: number;
  imageUrl: string;
  coverImageUrl?: string;
  image?: string;
  bannerImage?: string;
  isOpen: boolean;
  /** Stored as minutes (e.g. 30) in MongoDB */
  deliveryTime: number;
  minOrder: number;
  deliveryFee?: number;
  isFeatured?: boolean;
  tags?: string[];
  location?: { lat: number; lng: number };
  contact?: { phone: string; email?: string };
  openingHours?: Array<{ day: string; open: string; close: string }>;
  menu?: MenuItemApiDTO[];
  phone: string;
}

/** Standard response envelope used by backend's sendSuccess() utility */
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Shape of the data field in GET /api/restaurants */
interface RestaurantListData {
  restaurants: RestaurantApiDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization helpers — Backend DTO → Frontend model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a backend deliveryTime number (minutes) to the string
 * format the frontend Restaurant type and UI expect: "30-40 min".
 */
const formatDeliveryTime = (minutes: number): string =>
  `${minutes}-${minutes + 10} min`;

/**
 * Map a raw backend RestaurantApiDTO to the frontend Restaurant type.
 * All field mismatches are resolved here — components stay untouched.
 */
export const normalizeRestaurant = (dto: RestaurantApiDTO): Restaurant => ({
  id: dto._id,
  name: dto.name,
  description: dto.description,
  cuisine: dto.cuisine,
  rating: dto.rating,
  deliveryTime: formatDeliveryTime(dto.deliveryTime),
  deliveryFee: dto.deliveryFee ?? 0,
  minOrder: dto.minOrder,
  // Backend uses imageUrl as primary; also accepts image if present
  image: (dto.imageUrl && dto.imageUrl.trim()) || (dto.image && dto.image.trim()) || '',
  bannerImage: (dto.coverImageUrl && dto.coverImageUrl.trim()) || (dto.bannerImage && dto.bannerImage.trim()) || undefined,
  address: dto.address,
  location: dto.location ?? { lat: 0, lng: 0 },
  isOpen: dto.isOpen,
  isFeatured: dto.isFeatured ?? false,
  tags: dto.tags ?? [],
  contact: dto.contact,
  openingHours: dto.openingHours,
  // isVeg is not in the backend schema; omit (field is optional on the frontend type)
});

/**
 * Resolves an active, appetizing dish image based on dish title and category
 * when a raw item document lacks an explicit imageUrl.
 */
export const resolveDishImage = (name?: string, category?: string): string => {
  const lowerName = (name || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();

  if (lowerName.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop';
  if (lowerName.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop';
  if (lowerName.includes('biryani') || lowerName.includes('rice')) return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop';
  if (lowerName.includes('butter chicken') || lowerName.includes('chicken')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop';
  if (lowerName.includes('paneer') || lowerName.includes('tikka')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop';
  if (lowerName.includes('dal') || lowerName.includes('curry') || lowerName.includes('rogan')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop';
  if (lowerName.includes('dosa') || lowerName.includes('idli') || lowerName.includes('uttapam')) return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop';
  if (lowerName.includes('naan') || lowerName.includes('bread') || lowerName.includes('roti')) return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop';
  if (lowerName.includes('pasta') || lowerName.includes('spaghetti') || lowerName.includes('penne')) return 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=500&auto=format&fit=crop';
  if (lowerName.includes('noodle') || lowerName.includes('ramen')) return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop';
  if (lowerName.includes('sushi') || lowerName.includes('roll') || lowerName.includes('nigiri')) return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop';
  if (lowerName.includes('taco') || lowerName.includes('burrito') || lowerName.includes('wrap') || lowerName.includes('quesadilla')) return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop';
  if (lowerName.includes('salad')) return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop';
  if (lowerName.includes('fries') || lowerName.includes('rings') || lowerName.includes('chips')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop';
  if (lowerName.includes('dessert') || lowerName.includes('cake') || lowerName.includes('jamun') || lowerName.includes('tiramisu')) return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop';
  if (lowerName.includes('shake') || lowerName.includes('beverage') || lowerName.includes('drink')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop';
  if (lowerName.includes('dim sum') || lowerName.includes('gyoza') || lowerName.includes('edamame')) return 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop';

  if (lowerCat.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop';
  if (lowerCat.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop';
  if (lowerCat.includes('dessert')) return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop';
  if (lowerCat.includes('beverage')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop';
  if (lowerCat.includes('starter') || lowerCat.includes('side')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop';

  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop';
};

/**
 * Map embedded menu items from a restaurant document to frontend FoodItem[].
 * Fields absent from the backend are filled with safe defaults so the
 * existing UI (which checks isVeg, addons, variants, etc.) doesn't break.
 */
export const normalizeMenuItems = (
  menuItems: MenuItemApiDTO[],
  restaurantId: string,
  restaurantName: string,
): FoodItem[] =>
  menuItems.map((item, index) => {
    const rawImage = (item.imageUrl && item.imageUrl.trim()) || ((item as any).image && (item as any).image.trim());
    const finalImage = rawImage || resolveDishImage(item.name, item.category);

    return {
      // Sub-documents get a MongoDB _id; fall back to a positional key if absent
      id: item._id ?? `${restaurantId}-item-${index}`,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: finalImage,
      isAvailable: item.isAvailable,
      restaurantId,
      restaurantName,
      // Fields from backend/factory or safe defaults
      isVeg: Boolean((item as any).isVegetarian ?? (item as any).isVeg),
      isSpicy: false,
      isBestSeller: false,
      rating: 0,
      addons: [],
      variants: [],
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper — same minimal pattern as authApi.ts / reviewApi.ts
// ─────────────────────────────────────────────────────────────────────────────

import api from '../../core/utils/api';

// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const restaurantApi = {
  /**
   * GET /api/restaurants
   * Returns all restaurants normalized to the frontend Restaurant type.
   * Uses a large limit so client-side Redux filters/pagination work as normal.
   */
  async getAll(): Promise<Restaurant[]> {
    const data = await api.request<RestaurantListData>('/restaurants?limit=200');
    return data.restaurants.map(normalizeRestaurant);
  },

  /**
   * GET /api/restaurants/:id
   * Returns the restaurant + its embedded menu items, both normalized.
   */
  async getById(id: string): Promise<{ restaurant: Restaurant; items: FoodItem[] }> {
    const dto = await api.request<RestaurantApiDTO>(`/restaurants/${id}`);
    const restaurant = normalizeRestaurant(dto);
    const items = normalizeMenuItems(dto.menu ?? [], restaurant.id, restaurant.name);
    return { restaurant, items };
  },
};
