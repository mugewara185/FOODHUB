import { Response, NextFunction } from 'express';
import { transitionOrderStatus } from './order.service';
import { z } from 'zod';
import { Order } from './order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { getIO } from '../../socket';

import { assignDelivery, releaseDeliveryForOrder } from '../delivery/delivery.service';

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

    // Securely calculate total amount using authoritative menu prices
    let totalAmount = 0;
    const validatedItems = body.items.map(item => {
      const menuItem = restaurant.menu.find(m => (m as any)._id?.toString() === item.menuItemId);
      if (!menuItem) {
        throw new AppError(`Menu item ${item.menuItemId} not found in restaurant`, 400);
      }
      totalAmount += menuItem.price * item.quantity;
      return {
        ...item,
        price: menuItem.price // Overwrite client price with authoritative price
      };
    });

    const order = await Order.create({
      userId: req.user!.id,
      restaurantId: body.restaurantId,
      restaurantName: restaurant.name,
      items: validatedItems,
      totalAmount,
      status: 'pending_owner',
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod ?? 'cash',
      paymentStatus: 'pending',
      note: body.note,
    });

    const io = getIO();
    const ownerRoom = restaurant.ownerId?.toString();
    if (ownerRoom) {
      io.to(ownerRoom).emit('order:new', order.toObject());
    }

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

export async function getOwnerOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) {
      throw new AppError('No restaurant linked to this owner', 404);
    }

    let statuses = ['pending_owner', 'confirmed', 'preparing'];
    if (req.query.status) {
      const parsedStatuses = (req.query.status as string).split(',');
      const validStatuses = [
        'created', 'pending_owner', 'rejected', 'confirmed', 'preparing',
        'ready_for_pickup', 'awaiting_partner', 'partner_assigned', 'picked_up',
        'out_for_delivery', 'delivered', 'completed', 'reviewed', 'cancelled'
      ];
      for (const s of parsedStatuses) {
        if (!validStatuses.includes(s)) {
          throw new AppError(`Invalid status: ${s}`, 400);
        }
      }
      statuses = parsedStatuses;
    }

    const orders = await Order.find({ restaurantId: restaurant._id, status: { $in: statuses } })
      .sort({ createdAt: -1 });

    sendSuccess({ res, message: 'Owner orders fetched', data: orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId', 'name imageUrl address phone');
    if (!order) throw new AppError('Order not found', 404);

    if (order.userId.toString() !== req.user!.id && !req.user!.roles.includes('admin')) {
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

    if (!['created', 'pending_owner', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    order.status = 'cancelled';
    await order.save();

    await releaseDeliveryForOrder(order.id);

    const io = getIO();
    io.to(order.id).emit('order_status_update', { orderId: order.id, status: 'cancelled' });
    io.to(req.user!.id).emit('notification', { 
      title: 'Order Cancelled', 
      message: `Your order from ${order.restaurantName} was cancelled.`,
      orderId: order.id,
      status: 'cancelled' 
    });

    sendSuccess({ res, message: 'Order cancelled', data: order });
  } catch (err) {
    next(err);
  }
}

function getActorRole(req: AuthRequest): string {
  if (req.user!.roles.includes('admin')) return 'admin';
  if (req.user!.roles.includes('owner')) return 'owner';
  return req.user!.roles[0];
}

export async function acceptOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedOrder = await transitionOrderStatus(req.params.id, 'confirmed', { id: req.user!.id, role: getActorRole(req) });
    sendSuccess({ res, message: 'Order accepted', data: updatedOrder });
  } catch (err) {
    next(err);
  }
}

export async function rejectOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedOrder = await transitionOrderStatus(req.params.id, 'rejected', { id: req.user!.id, role: getActorRole(req) });
    sendSuccess({ res, message: 'Order rejected', data: updatedOrder });
  } catch (err) {
    next(err);
  }
}

export async function markPreparing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedOrder = await transitionOrderStatus(req.params.id, 'preparing', { id: req.user!.id, role: getActorRole(req) });
    sendSuccess({ res, message: 'Order marked as preparing', data: updatedOrder });
  } catch (err) {
    next(err);
  }
}

export async function markReady(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedOrder = await transitionOrderStatus(req.params.id, 'ready_for_pickup', { id: req.user!.id, role: getActorRole(req) });
    sendSuccess({ res, message: 'Order marked as ready', data: updatedOrder });
  } catch (err) {
    next(err);
  }
}
