import { Request, Response, NextFunction } from 'express';
import { Review } from './review.model';
import { Order } from '../orders/order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { DeliveryPartner } from '../delivery/delivery-partner.model';
import { transitionOrderStatus } from '../orders/order.service';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';

function getActorRole(req: AuthRequest): string {
  if (req.user!.roles.includes('admin')) return 'admin';
  if (req.user!.roles.includes('owner')) return 'owner';
  return req.user!.roles[0];
}

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId, restaurantRating, partnerRating, comment } = req.body;
    const userId = req.user!.id;

    if (!orderId || typeof restaurantRating !== 'number' || typeof partnerRating !== 'number') {
      throw new AppError('Missing required fields', 400);
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new AppError('Order not found or does not belong to user', 404);
    }

    if (order.status !== 'delivered') {
      throw new AppError('Order must be delivered before it can be reviewed', 400);
    }

    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      throw new AppError('Order has already been reviewed', 400);
    }

    // Assuming we can get the partnerId from the Delivery model... 
    // Wait, Order does not have partnerId directly. It is in the Delivery model.
    const { Delivery } = require('../delivery/delivery.model');
    const delivery = await Delivery.findOne({ orderId: order._id });
    const partnerId = delivery ? delivery.partnerId : null;

    if (!partnerId) {
      throw new AppError('No delivery partner found for this order', 400);
    }

    const review = await Review.create({
      orderId,
      userId,
      restaurantId: order.restaurantId,
      partnerId,
      restaurantRating,
      partnerRating,
      comment
    });

    // Aggregate restaurant rating
    const restAgg = await Review.aggregate([
      { $match: { restaurantId: order.restaurantId } },
      { $group: { _id: null, avgRating: { $avg: '$restaurantRating' }, count: { $sum: 1 } } }
    ]);
    if (restAgg.length > 0) {
      await Restaurant.findByIdAndUpdate(order.restaurantId, {
        rating: Math.round(restAgg[0].avgRating * 10) / 10,
        totalRatings: restAgg[0].count
      });
    }

    // Aggregate partner rating
    const partAgg = await Review.aggregate([
      { $match: { partnerId } },
      { $group: { _id: null, avgRating: { $avg: '$partnerRating' } } }
    ]);
    if (partAgg.length > 0) {
      await DeliveryPartner.findByIdAndUpdate(partnerId, {
        rating: Math.round(partAgg[0].avgRating * 10) / 10
      });
    }

    // Transition order to reviewed
    const updatedOrder = await transitionOrderStatus(orderId, 'reviewed', { id: userId, role: getActorRole(req) });

    sendSuccess({ res, message: 'Review created successfully', data: review, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};
