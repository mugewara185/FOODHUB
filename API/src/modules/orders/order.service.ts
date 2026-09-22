import { Order, OrderStatus, IOrder } from './order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { getIO } from '../../socket';

export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actor: { id: string; role: string }
): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 3. Validate transition
  const validTransitions: Record<string, string[]> = {
    'pending_owner': ['confirmed', 'rejected'],
    'confirmed': ['preparing'],
    'preparing': ['ready_for_pickup'],
  };

  const allowedNext = validTransitions[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new AppError(`Invalid state transition from ${order.status} to ${newStatus}`, 400);
  }

  // 4. Validate authorization
  if (actor.role === 'admin') {
    // allow
  } else if (actor.role === 'owner') {
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }
    if (restaurant.ownerId?.toString() !== actor.id) {
      throw new AppError('Not authorized to manage this restaurant', 403);
    }
  } else {
    throw new AppError('Not authorized', 403);
  }

  // 5. Sets order.status = newStatus
  order.status = newStatus;
  
  // 6. Saves the order
  await order.save();

  const io = getIO();
  // 7. Emits order_status_update to the order room (existing pattern)
  io.to(order.id).emit('order_status_update', { orderId: order.id, status: newStatus });
  
  // 8. Emits order:status_changed to owner room and admin_fleet
  const restaurant = await Restaurant.findById(order.restaurantId);
  if (restaurant?.ownerId) {
    io.to(restaurant.ownerId.toString()).emit('order:status_changed', {
      orderId: order.id,
      status: newStatus,
      actorRole: actor.role,
    });
  }
  io.to('admin_fleet').emit('order:status_changed', {
    orderId: order.id,
    status: newStatus,
    actorRole: actor.role,
  });

  // 9. Returns the updated order
  return order;
}
