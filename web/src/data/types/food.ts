// ============================================================================
// FOOD & RESTAURANT TYPES (Re-exported from core)
// ============================================================================
// This file is deprecated. All types are now centralized in src/core/types/index.ts
// Use imports from core/types directly instead:
//   import type { Restaurant, FoodItem, Cart, Order } from '@/core/types'

export {
  type Restaurant,
  type FoodItem,
  type MenuItem,
  type Category,
  type Addon,
  type Variant,
  type DietaryInfo,
  type Cart,
  type CartItem,
  type CustomizedCartItem,
  type Order,
  type OrderItem,
  type DeliveryInfo,
  type OrderStatus,
  type Review,
  type Coordinates,
  type OpeningHours,
  type ContactInfo,
  type DeliveryPartner,
  type LiveTracking,
} from '../../core/types';
//   total: number;
//   status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
//   paymentMethod: 'cod' | 'card' | 'upi' | 'wallet';
//   paymentStatus: 'pending' | 'paid' | 'failed';
//   deliveryAddress: Address;
//   deliveryInstructions?: string;
//   createdAt: string;
//   estimatedDelivery: string;
// }

// export interface Address {
//   id: string;
//   name: string;
//   phone: string;
//   street: string;
//   city: string;
//   state: string;
//   zipCode: string;
//   isDefault: boolean;
//   type: 'home' | 'work' | 'other';
// }

// export interface Review {
//   id: string;
//   userId: string;
//   userName: string;
//   userAvatar?: string;
//   restaurantId?: string;
//   foodItemId?: string;
//   rating: number;
//   comment: string;
//   images?: string[];
//   createdAt: string;
// }

export interface Cuisine {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface FilterOptions {
  cuisine: string[];
  minOrder: number;
  deliveryTime: string;
  rating: number;
  isVeg: boolean;
  isOpen: boolean;
  sortBy: 'rating' | 'deliveryTime' | 'price' | 'name';
}