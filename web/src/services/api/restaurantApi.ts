/**
 * restaurantApi.ts
 *
 * API service for the restaurant domain.
 * Used ONLY when VITE_DATA_SOURCE=api.
 *
 * Follows the same fetch-based pattern as authApi.ts and reviewApi.ts.
 * All Backend→Frontend normalization is isolated here.
 */

import { APP_CONFIG } from '../../core/config/app.config';
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
  // Backend uses imageUrl as primary; the seed controller also copies it to 'image'
  image: dto.imageUrl || dto.image || '',
  bannerImage: dto.coverImageUrl || dto.bannerImage,
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
 * Map embedded menu items from a restaurant document to frontend FoodItem[].
 * Fields absent from the backend are filled with safe defaults so the
 * existing UI (which checks isVeg, addons, variants, etc.) doesn't break.
 */
export const normalizeMenuItems = (
  menuItems: MenuItemApiDTO[],
  restaurantId: string,
  restaurantName: string,
): FoodItem[] =>
  menuItems.map((item, index) => ({
    // Sub-documents get a MongoDB _id; fall back to a positional key if absent
    id: item._id ?? `${restaurantId}-item-${index}`,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.imageUrl ?? '',
    isAvailable: item.isAvailable,
    restaurantId,
    restaurantName,
    // Fields not stored in the backend — safe defaults
    isVeg: false,
    isSpicy: false,
    isBestSeller: false,
    rating: 0,
    addons: [],
    variants: [],
  }));

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper — same minimal pattern as authApi.ts / reviewApi.ts
// ─────────────────────────────────────────────────────────────────────────────

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const { headers: customHeaders, ...restInit } = init || {};
  const response = await fetch(`${APP_CONFIG.API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...customHeaders },
    ...restInit,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> | T;

  if (!response.ok) {
    const msg =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      (payload as { message?: string }).message
        ? String((payload as { message?: string }).message)
        : `Request failed (${response.status})`;
    throw new Error(msg);
  }

  // Unwrap the { success, data } envelope if present
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const restaurantApi = {
  /**
   * GET /api/restaurants
   * Returns all restaurants normalized to the frontend Restaurant type.
   * Uses a large limit so client-side Redux filters/pagination work as normal.
   */
  async getAll(): Promise<Restaurant[]> {
    const data = await request<RestaurantListData>('/restaurants?limit=200');
    return data.restaurants.map(normalizeRestaurant);
  },

  /**
   * GET /api/restaurants/:id
   * Returns the restaurant + its embedded menu items, both normalized.
   */
  async getById(id: string): Promise<{ restaurant: Restaurant; items: FoodItem[] }> {
    const dto = await request<RestaurantApiDTO>(`/restaurants/${id}`);
    const restaurant = normalizeRestaurant(dto);
    const items = normalizeMenuItems(dto.menu ?? [], restaurant.id, restaurant.name);
    return { restaurant, items };
  },
};
