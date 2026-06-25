import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review } from './review.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { Request } from 'express';

const createReviewSchema = z.object({
  restaurantId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
});

export async function createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createReviewSchema.parse(req.body);

    const restaurant = await Restaurant.findById(body.restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const review = await Review.create({
      userId: req.user!.id,
      restaurantId: body.restaurantId,
      rating: body.rating,
      comment: body.comment,
      userName: req.user!.name || req.user!.email.split('@')[0],
    });

    // Recalculate restaurant rating
    const allReviews = await Review.find({ restaurantId: body.restaurantId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Restaurant.findByIdAndUpdate(body.restaurantId, {
      rating: Math.round(avgRating * 10) / 10,
      totalRatings: allReviews.length,
    });

    sendSuccess({ res, statusCode: 201, message: 'Review submitted', data: review });
  } catch (err) {
    next(err);
  }
}

export async function getReviewsByRestaurant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurantId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ restaurantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name'),
      Review.countDocuments({ restaurantId }),
    ]);

    sendSuccess({
      res,
      message: 'Reviews fetched',
      data: {
        reviews,
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
