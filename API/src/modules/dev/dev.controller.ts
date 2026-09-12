import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import { User } from '../auth/auth.model';
import { Order } from '../orders/order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { Review } from '../reviews/review.model';

type FactorySeedTarget = 'restaurants' | 'foodItems' | 'users' | 'orders' | 'reviews';

interface FactoryRestaurantPayload {
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

interface FactoryFoodItemPayload {
  factoryRestaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface FactoryUserPayload {
  factoryId: string;
  name: string;
  email: string;
  password: string;
  roles: string[];
  phone?: string;
  address?: string;
}

interface FactoryOrderPayload {
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

interface FactoryReviewPayload {
  factoryId: string;
  userId: string;
  restaurantId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt?: string;
}

interface FactorySeedPayload {
  schemaVersion?: string;
  targets?: FactorySeedTarget[];
  data?: {
    restaurants?: FactoryRestaurantPayload[];
    foodItems?: FactoryFoodItemPayload[];
    users?: FactoryUserPayload[];
    orders?: FactoryOrderPayload[];
    reviews?: FactoryReviewPayload[];
  };
  restaurants?: FactoryRestaurantPayload[];
  menus?: FactoryFoodItemPayload[];
}

export async function seedFactoryData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (config.nodeEnv === 'production') {
      throw new AppError('Factory seeding is disabled in production.', 403);
    }

    const payload = req.body as Partial<FactorySeedPayload>;
    const targets = Array.isArray(payload.targets) && payload.targets.length
      ? payload.targets
      : ['restaurants', 'foodItems'];
    const restaurants = Array.isArray(payload.data?.restaurants)
      ? payload.data.restaurants
      : Array.isArray(payload.restaurants)
        ? payload.restaurants
        : [];
    const foodItems = Array.isArray(payload.data?.foodItems)
      ? payload.data.foodItems
      : Array.isArray(payload.menus)
        ? payload.menus
        : [];
    const users = Array.isArray(payload.data?.users) ? payload.data.users : [];
    const orders = Array.isArray(payload.data?.orders) ? payload.data.orders : [];
    const reviews = Array.isArray(payload.data?.reviews) ? payload.data.reviews : [];

    if (!targets.length) {
      throw new AppError('No factory targets were provided.', 400);
    }

    const cleanupOperations = [] as Array<Promise<unknown>>;
    if (targets.includes('restaurants') || targets.includes('foodItems')) {
      cleanupOperations.push(Restaurant.deleteMany({}));
    }
    if (targets.includes('users')) {
      cleanupOperations.push(User.deleteMany({}));
    }
    if (targets.includes('orders')) {
      cleanupOperations.push(Order.deleteMany({}));
    }
    if (targets.includes('reviews')) {
      cleanupOperations.push(Review.deleteMany({}));
    }

    await Promise.all(cleanupOperations);

    const createdRestaurants = [] as Array<{ id: string; name: string }>;
    const createdUsers = [] as Array<{ id: string; email: string }>;
    const createdRestaurantMap = new Map<string, string>();
    const createdUserMap = new Map<string, string>();

    if (targets.includes('restaurants') || targets.includes('foodItems') || targets.includes('orders') || targets.includes('reviews')) {
      for (const restaurant of restaurants) {
        const restaurantMenu = foodItems
          .filter((menuItem) => menuItem.factoryRestaurantId === restaurant.factoryId)
          .map((menuItem) => ({
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price,
            category: menuItem.category || 'General',
            imageUrl: menuItem.imageUrl,
            isAvailable: menuItem.isAvailable,
          }));

        const createdRestaurant = await Restaurant.create({
          name: restaurant.name,
          description: restaurant.description,
          cuisine: restaurant.cuisine,
          address: restaurant.address,
          city: restaurant.city,
          rating: restaurant.rating,
          totalRatings: 120,
          priceRange: 2,
          imageUrl: restaurant.imageUrl,
          coverImageUrl: restaurant.coverImageUrl,
          isOpen: restaurant.isOpen,
          deliveryTime: restaurant.deliveryTime,
          minOrder: restaurant.minOrder,
          deliveryFee: restaurant.deliveryFee,
          image: restaurant.imageUrl,
          bannerImage: restaurant.coverImageUrl,
          isFeatured: restaurant.isFeatured,
          tags: restaurant.tags,
          phone: restaurant.phone,
          location: restaurant.location,
          contact: restaurant.contact,
          openingHours: restaurant.openingHours,
          menu: restaurantMenu,
        });

        createdRestaurants.push({ id: createdRestaurant._id.toString(), name: createdRestaurant.name });
        createdRestaurantMap.set(restaurant.factoryId, createdRestaurant._id.toString());
      }
    }

    if (targets.includes('users') || targets.includes('orders') || targets.includes('reviews')) {
      for (const user of users) {
        const createdUser = await User.create({
          name: user.name,
          email: user.email,
          password: user.password || 'Password123!',
          roles: user.roles || ['user'],
          phone: user.phone,
          address: user.address,
        });

        createdUsers.push({ id: createdUser._id.toString(), email: createdUser.email });
        createdUserMap.set(user.factoryId, createdUser._id.toString());
      }
    }

    if (targets.includes('orders')) {
      for (const order of orders) {
        const resolvedUserId = createdUserMap.get(order.userId) || order.userId;
        const resolvedRestaurantId = createdRestaurantMap.get(order.restaurantId) || order.restaurantId;

        await Order.create({
          userId: resolvedUserId,
          restaurantId: resolvedRestaurantId,
          restaurantName: order.restaurantName,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          deliveryAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod,
          note: order.note,
          createdAt: order.createdAt ? new Date(order.createdAt) : undefined,
        });
      }
    }

    if (targets.includes('reviews')) {
      for (const review of reviews) {
        const resolvedUserId = createdUserMap.get(review.userId) || review.userId;
        const resolvedRestaurantId = createdRestaurantMap.get(review.restaurantId) || review.restaurantId;

        await Review.create({
          userId: resolvedUserId,
          restaurantId: resolvedRestaurantId,
          rating: review.rating,
          comment: review.comment,
          userName: review.userName,
          createdAt: review.createdAt ? new Date(review.createdAt) : undefined,
        });
      }
    }

    sendSuccess({
      res,
      statusCode: 201,
      message: `Seeded ${targets.join(', ')}.`,
      data: {
        restaurantsCreated: createdRestaurants.length,
        foodItemsCreated: foodItems.length,
        usersCreated: createdUsers.length,
        ordersCreated: orders.length,
        reviewsCreated: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
