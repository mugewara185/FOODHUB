import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Order } from './order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  deliveryAddress: z.string().min(5),
  paymentMethod: z.enum(['cash', 'card', 'upi']).optional(),
  note: z.string().optional(),
});

export async function createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createOrderSchema.parse(req.body);

    const restaurant = await Restaurant.findById(body.restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (!restaurant.isOpen) throw new AppError('Restaurant is currently closed', 400);

    const totalAmount = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      userId: req.user!.id,
      restaurantId: body.restaurantId,
      restaurantName: restaurant.name,
      items: body.items,
      totalAmount,
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod ?? 'cash',
      note: body.note,
    });

    sendSuccess({ res, statusCode: 201, message: 'Order placed successfully', data: order });
  } catch (err) {
    next(err);
  }
}

export async function getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await Order.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'name imageUrl city');

    sendSuccess({ res, message: 'Orders fetched', data: orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId', 'name imageUrl address phone');
    if (!order) throw new AppError('Order not found', 404);

    if (order.userId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to view this order', 403);
    }

    sendSuccess({ res, message: 'Order fetched', data: order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError('Order not found', 404);

    if (order.userId.toString() !== req.user!.id) {
      throw new AppError('Not authorized', 403);
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    order.status = 'cancelled';
    await order.save();

    sendSuccess({ res, message: 'Order cancelled', data: order });
  } catch (err) {
    next(err);
  }
}
