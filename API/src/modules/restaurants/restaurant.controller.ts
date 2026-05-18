import { Request, Response, NextFunction } from 'express';
import { Restaurant } from './restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';

export async function getAllRestaurants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { city, cuisine, search, page = '1', limit = '10' } = req.query;

    const query: Record<string, unknown> = {};

    if (city) query.city = { $regex: city as string, $options: 'i' };
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (search) query.$text = { $search: search as string };

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query).select('-menu').skip(skip).limit(limitNum).sort({ rating: -1 }),
      Restaurant.countDocuments(query),
    ]);

    sendSuccess({
      res,
      message: 'Restaurants fetched',
      data: {
        restaurants,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRestaurantById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    sendSuccess({ res, message: 'Restaurant fetched', data: restaurant });
  } catch (err) {
    next(err);
  }
}
