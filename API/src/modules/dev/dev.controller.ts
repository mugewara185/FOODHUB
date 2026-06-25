import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import { Restaurant } from '../restaurants/restaurant.model';

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

interface FactoryMenuPayload {
  factoryRestaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface FactorySeedPayload {
  restaurants: FactoryRestaurantPayload[];
  menus: FactoryMenuPayload[];
}

export async function seedFactoryData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (config.nodeEnv === 'production') {
      throw new AppError('Factory seeding is disabled in production.', 403);
    }

    const payload = req.body as Partial<FactorySeedPayload>;
    const restaurants = Array.isArray(payload.restaurants) ? payload.restaurants : [];
    const menus = Array.isArray(payload.menus) ? payload.menus : [];

    if (!restaurants.length) {
      throw new AppError('No factory restaurants were provided.', 400);
    }

    await Restaurant.deleteMany({});

    const createdRestaurants = [] as Array<{ id: string; name: string }>;

    for (const restaurant of restaurants) {
      const restaurantMenu = menus
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
    }

    sendSuccess({
      res,
      statusCode: 201,
      message: `Seeded ${createdRestaurants.length} restaurants and ${menus.length} menu items.`,
      data: {
        restaurantsCreated: createdRestaurants.length,
        menuItemsCreated: menus.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
