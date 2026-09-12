import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Order } from './order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { getIO } from '../../socket';

// Helper to simulate order progression for demonstration of real-time tracking
const simulateOrderProgression = async (orderId: string, userId: string) => {
  const statuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  let delay = 10000; // 10s between states

  for (const status of statuses) {
    setTimeout(async () => {
      try {
        const order = await Order.findById(orderId);
        if (order && order.status !== 'cancelled') {
          order.status = status as any;
          await order.save();
          
          const io = getIO();
          // Emit to the specific order tracking room
          io.to(orderId).emit('order_status_update', { orderId, status });
          // Emit a notification to the user's personal room
          io.to(userId).emit('notification', { 
            title: 'Order Update', 
            message: `Your order is now ${status.replace('_', ' ')}`,
            orderId,
            status 
          });
        }
      } catch (err) {
        console.error('Simulation error:', err);
      }
    }, delay);
    delay += 10000;
  }
};

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
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod ?? 'cash',
      note: body.note,
    });

    // Start background simulation
    simulateOrderProgression(order.id, req.user!.id);

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

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    order.status = 'cancelled';
    await order.save();

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
