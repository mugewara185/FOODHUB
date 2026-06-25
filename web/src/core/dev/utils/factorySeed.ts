import type {
  FoodItemFactoryInput,
  OrderFactoryInput,
  ReviewFactoryInput,
  RestaurantFactoryInput,
  UserFactoryInput,
  FactoryInput,
} from '@core/types';
import { generateAllDummyData } from '../../../data/factories/unifiedFactory';

export type FactorySeedTarget = 'restaurants' | 'foodItems' | 'users' | 'orders' | 'reviews';

export interface FactorySeedConfig {
  restaurants?: RestaurantFactoryInput;
  foodItems?: FoodItemFactoryInput;
  users?: UserFactoryInput;
  orders?: OrderFactoryInput;
  reviews?: ReviewFactoryInput;
}

export interface FactoryRestaurantSeedEntry {
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
}

export interface FactoryFoodItemSeedEntry {
  factoryRestaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface FactoryUserSeedEntry {
  factoryId: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
}

export interface FactoryOrderSeedEntry {
  factoryId: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: Array<{ menuItemId: string; name: string; price: number; quantity: number }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  note?: string;
  createdAt?: string;
}

export interface FactoryReviewSeedEntry {
  factoryId: string;
  userId: string;
  restaurantId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt?: string;
}

export interface FactorySeedPayload {
  schemaVersion: 'factory-types-v1';
  targets: FactorySeedTarget[];
  config?: FactorySeedConfig;
  data: {
    restaurants: FactoryRestaurantSeedEntry[];
    foodItems: FactoryFoodItemSeedEntry[];
    users: FactoryUserSeedEntry[];
    orders: FactoryOrderSeedEntry[];
    reviews: FactoryReviewSeedEntry[];
  };
}

type GeneratedRestaurant = {
  id: string;
  name: string;
  description: string;
  cuisine: string[] | string;
  address: string;
  rating: number;
  deliveryTime: string | number | undefined;
  deliveryFee: number;
  minOrder: number;
  image?: string;
  bannerImage?: string;
  isOpen: boolean;
  isFeatured: boolean;
  tags: string[];
  contact?: { phone?: string; email?: string };
  location?: { lat: number; lng: number };
  openingHours?: Array<{ day: string; open: string; close: string }>;
};

type GeneratedFoodItem = {
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  image?: string;
  isAvailable: boolean;
};

type GeneratedUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string;
  address?: string;
};

type GeneratedOrder = {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName?: string;
  items?: Array<{ name: string; price: number; quantity?: number }>;
  total?: number;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};

type GeneratedReview = {
  id: string;
  userId: string;
  restaurantId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt?: string;
};

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

export const buildFactorySeedPayload = (
  restaurantCount = 12,
  options: { targets?: FactorySeedTarget[]; config?: FactorySeedConfig } = {}
): FactorySeedPayload => {
  const targets = (options.targets?.length ? options.targets : ['restaurants', 'foodItems', 'users', 'orders', 'reviews']) as FactorySeedTarget[];
  const config = options.config ?? {};
  const shouldGenerateOrderData = targets.includes('orders') || Boolean(config.orders?.count);
  const shouldGenerateReviewData = targets.includes('reviews') || Boolean(config.reviews?.count);
  const orderCount = config.orders?.count ?? (shouldGenerateOrderData ? 16 : 0);
  const reviewCount = config.reviews?.count ?? (shouldGenerateReviewData ? 12 : 0);
  const requestedRestaurantCount = Math.max(config.restaurants?.count ?? restaurantCount, shouldGenerateOrderData || shouldGenerateReviewData ? Math.max(orderCount, reviewCount) : 0);
  const requestedUserCount = Math.max(config.users?.count ?? 8, shouldGenerateOrderData || shouldGenerateReviewData ? Math.max(orderCount, reviewCount) : 0);

  const generated = generateAllDummyData({
    restaurants: config.restaurants
      ? { ...config.restaurants, count: Math.max(config.restaurants.count ?? restaurantCount, requestedRestaurantCount) }
      : { count: requestedRestaurantCount },
    foodItems: config.foodItems ?? { count: Math.max(20, requestedRestaurantCount * 6) },
    users: config.users
      ? { ...config.users, count: Math.max(config.users.count ?? 8, requestedUserCount) }
      : { count: requestedUserCount, includeTestAccounts: true },
    orders: config.orders ?? (shouldGenerateOrderData ? { count: orderCount } : { count: 0 }),
    reviews: config.reviews ?? (shouldGenerateReviewData ? { count: reviewCount } : { count: 0 }),
  } as Partial<FactoryInput>);

  const restaurants = (generated.restaurants as GeneratedRestaurant[]).map((restaurant) => ({
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
    imageUrl: restaurant.image ?? '',
    coverImageUrl: restaurant.bannerImage,
    isOpen: restaurant.isOpen,
    isFeatured: restaurant.isFeatured,
    tags: restaurant.tags,
    phone: restaurant.contact?.phone || '+91 9000000000',
    location: restaurant.location,
    contact: restaurant.contact ? { phone: restaurant.contact.phone || '+91 9000000000', email: restaurant.contact.email } : undefined,
    openingHours: restaurant.openingHours,
  }));

  const foodItems = (generated.foodItems as GeneratedFoodItem[]).map((menuItem) => ({
    factoryRestaurantId: menuItem.restaurantId,
    name: menuItem.name,
    description: menuItem.description,
    price: menuItem.price,
    category: menuItem.category || 'General',
    imageUrl: menuItem.image,
    isAvailable: menuItem.isAvailable,
  }));

  const users = (generated.users as GeneratedUser[]).map((user) => ({
    factoryId: user.id,
    name: user.name,
    email: user.email,
    password: user.password ?? 'Password123!',
    role: (user.role === 'admin' ? 'admin' : 'user') as FactoryUserSeedEntry['role'],
    phone: user.phone,
    address: user.address,
  }));

  const orders = (generated.orders as GeneratedOrder[]).map((order) => ({
    factoryId: order.id,
    userId: order.userId,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName ?? 'Demo Restaurant',
    items: (order.items ?? []).map((item) => ({
      menuItemId: `${item.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item',
      name: item.name,
      price: item.price,
      quantity: item.quantity ?? 1,
    })),
    totalAmount: order.total ?? order.totalAmount ?? 0,
    status: (order.status === 'completed' ? 'delivered' : (order.status ?? 'pending')) as FactoryOrderSeedEntry['status'],
    deliveryAddress: 'Demo delivery address',
    paymentMethod: 'cash' as FactoryOrderSeedEntry['paymentMethod'],
    note: 'Seeded via dev console',
    createdAt: order.createdAt,
  }));

  const reviews = (generated.reviews as GeneratedReview[]).map((review) => ({
    factoryId: review.id,
    userId: review.userId,
    restaurantId: review.restaurantId,
    rating: review.rating,
    comment: review.comment,
    userName: review.userName,
    createdAt: review.createdAt,
  }));

  return {
    schemaVersion: 'factory-types-v1',
    targets,
    config,
    data: {
      restaurants: targets.includes('restaurants') || targets.includes('foodItems') || targets.includes('orders') || targets.includes('reviews') ? restaurants : [],
      foodItems: targets.includes('foodItems') ? foodItems : [],
      users: targets.includes('users') || targets.includes('orders') || targets.includes('reviews') ? users : [],
      orders: targets.includes('orders') ? orders : [],
      reviews: targets.includes('reviews') ? reviews : [],
    },
  };
};
