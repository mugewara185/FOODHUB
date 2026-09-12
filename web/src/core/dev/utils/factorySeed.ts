import type {
  FactoryInput,
} from '@core/types';
import { generateAllDummyData } from '../../../data/factories/unifiedFactory';
import { generateObjectId } from '../../data/factories/Factory';

export type FactorySeedTarget = 'restaurants' | 'foodItems' | 'users' | 'orders' | 'reviews';
export interface FactorySeedConfig {
  restaurants?: any;
  foodItems?: any;
  users?: any;
  orders?: any;
  reviews?: any;
}


export interface SeedCollectionPayload {
  modelName: string;
  documents: any[];
  clearFirst?: boolean;
}

export interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
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

export const buildFactorySeedPayload = (
  restaurantCount = 12,
  options: { targets?: string[]; config?: any } = {}
): FactorySeedPayload => {
  const targets = (options.targets?.length ? options.targets : ['restaurants', 'foodItems', 'users', 'orders', 'reviews']);
  const config = options.config ?? {};

  const generated = generateAllDummyData({
    restaurants: config.restaurants ?? { count: restaurantCount },
    foodItems: config.foodItems ?? { count: Math.max(20, restaurantCount * 6) },
    users: config.users ?? { count: 8, includeTestAccounts: true },
    orders: config.orders ?? { count: 16 },
    reviews: config.reviews ?? { count: 12 },
  } as Partial<FactoryInput>);

  // ID translation map
  const idMap = new Map<string, string>();
  const resolveId = (oldId: string | undefined): string => {
    if (!oldId) return generateObjectId();
    if (!idMap.has(oldId)) {
      idMap.set(oldId, generateObjectId());
    }
    return idMap.get(oldId)!;
  };

  const collections: SeedCollectionPayload[] = [];

  if (targets.includes('restaurants') || targets.includes('foodItems')) {
    const documents = (generated.restaurants as any[]).map((restaurant) => {
      const restaurantMenu = (generated.foodItems as any[])
        .filter((item) => item.restaurantId === restaurant.id)
        .map((menuItem) => ({
          _id: generateObjectId(),
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          category: menuItem.category || 'General',
          imageUrl: menuItem.image,
          isAvailable: menuItem.isAvailable,
        }));

      return {
        _id: resolveId(restaurant.id),
        name: restaurant.name,
        description: restaurant.description,
        cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine],
        address: restaurant.address,
        city: restaurant.address?.split(',').pop()?.trim() || 'Bangalore',
        rating: restaurant.rating,
        totalRatings: 120,
        priceRange: 2,
        imageUrl: restaurant.image ?? '',
        coverImageUrl: restaurant.bannerImage,
        isOpen: restaurant.isOpen,
        deliveryTime: parseDeliveryTime(restaurant.deliveryTime),
        minOrder: restaurant.minOrder,
        deliveryFee: restaurant.deliveryFee,
        image: restaurant.image ?? '',
        bannerImage: restaurant.bannerImage,
        isFeatured: restaurant.isFeatured,
        tags: restaurant.tags,
        phone: restaurant.contact?.phone || '+91 9000000000',
        location: restaurant.location,
        contact: restaurant.contact ? { phone: restaurant.contact.phone || '+91 9000000000', email: restaurant.contact.email } : undefined,
        openingHours: restaurant.openingHours,
        menu: restaurantMenu,
      };
    });
    
    collections.push({
      modelName: 'Restaurant',
      documents,
      clearFirst: true,
    });
  }

  if (targets.includes('users')) {
    const documents = (generated.users as any[]).map((user) => ({
      _id: resolveId(user.id),
      name: user.name,
      email: user.email,
      password: user.password ?? 'Password123!',
      roles: user.roles?.length ? user.roles : ['user'],
      phone: user.phone,
      addresses: user.address ? [{
        name: 'Home',
        phone: user.phone || '9999999999',
        street: user.address,
        type: 'home',
        isDefault: true
      }] : []
    }));

    collections.push({
      modelName: 'User',
      documents,
      clearFirst: true,
    });
  }

  if (targets.includes('orders')) {
    const documents = (generated.orders as any[]).map((order) => ({
      _id: resolveId(order.id),
      userId: resolveId(order.userId),
      restaurantId: resolveId(order.restaurantId),
      restaurantName: order.restaurantName ?? 'Demo Restaurant',
      items: (order.items ?? []).map((item: any) => ({
        menuItemId: generateObjectId(),
        name: item.name,
        price: item.price,
        quantity: item.quantity ?? 1,
      })),
      totalAmount: order.total ?? order.totalAmount ?? 0,
      status: order.status === 'completed' ? 'delivered' : (order.status ?? 'pending'),
      deliveryAddress: 'Demo delivery address',
      paymentMethod: 'cash',
      note: 'Seeded via dev console',
      createdAt: order.createdAt,
    }));

    collections.push({
      modelName: 'Order',
      documents,
      clearFirst: true,
    });
  }

  if (targets.includes('reviews')) {
    const documents = (generated.reviews as any[]).map((review) => ({
      _id: resolveId(review.id),
      userId: resolveId(review.userId),
      restaurantId: resolveId(review.restaurantId),
      rating: review.rating,
      comment: review.comment,
      userName: review.userName,
      createdAt: review.createdAt,
    }));

    collections.push({
      modelName: 'Review',
      documents,
      clearFirst: true,
    });
  }

  return { collections };
};
