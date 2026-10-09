import { notificationService } from '../notifications/notification.service';
import { Order, OrderStatus, IOrder } from './order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { getIO } from '../../socket';
import { DeliveryPartner } from '../delivery/delivery-partner.model';
import { Delivery } from '../delivery/delivery.model';
import { emitDeliveryAvailable } from '../delivery/delivery.events';

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
    'ready_for_pickup': ['awaiting_partner'],
    'awaiting_partner': ['partner_assigned'],
    'partner_assigned': ['picked_up'],
    'picked_up': ['out_for_delivery', 'delivered'],
    'out_for_delivery': ['delivered'],
    'delivered': ['reviewed'],
  };

  const allowedNext = validTransitions[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new AppError(`Invalid state transition from ${order.status} to ${newStatus}`, 400);
  }

  // 4. Validate authorization
  const restaurant = await Restaurant.findById(order.restaurantId);
  if (actor.role === 'system') {
    // System transitions are only called from internal services
    // (delivery.service) that already validated the flow. Skip
    // ownership check.
  } else if (actor.role === 'admin') {
    // allow
  } else if (actor.role === 'owner') {
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }
    if (restaurant.ownerId?.toString() !== actor.id) {
      throw new AppError('Not authorized to manage this restaurant', 403);
    }
  } else if (actor.role === 'user') {
    if (order.userId.toString() !== actor.id) {
      throw new AppError('Not authorized to modify this order', 403);
    }
  } else {
    throw new AppError('Not authorized', 403);
  }

  // 5. Sets order.status = newStatus
  const prevStatus = order.status;
  order.status = newStatus;
  
  // 6. Saves the order
  await order.save();

  // Create persistent customer notification for key transitions
  if (['confirmed', 'preparing', 'delivered', 'rejected'].includes(newStatus)) {
    let title = 'Order Update';
    let message = `Your order is now ${newStatus.replace('_', ' ')}.`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    if (newStatus === 'confirmed') title = 'Order Confirmed';
    if (newStatus === 'preparing') title = 'Being Prepared';
    if (newStatus === 'delivered') {
      title = 'Order Delivered';
      message = 'Your order has been delivered! Enjoy your meal.';
      type = 'success';
    }
    if (newStatus === 'rejected') {
      title = 'Order Rejected';
      type = 'error';
    }

    try {
      await notificationService.createNotification({
        userId: order.userId,
        title,
        message,
        type,
        orderId: order.id,
      });
    } catch (e) {
      console.error('Failed to create notification', e);
    }
  }

  const io = getIO();
  // 7. Emits order_status_update to the order room (existing pattern)
  io.to(order.id).emit('order_status_update', { orderId: order.id, status: newStatus });
  
  // 8. Emits order:status_changed to owner room, admin_fleet, and customer user room
  if (restaurant?.ownerId) {
    io.to(restaurant.ownerId.toString()).emit('order:status_changed', {
      orderId: order.id,
      status: newStatus,
      actorRole: actor.role,
    });
  }
  
  // Emit to customer's user room
  io.to(order.userId.toString()).emit('order:status_changed', {
    orderId: order.id,
    status: newStatus,
    actorRole: actor.role,
  });

  io.to('admin_fleet').emit('order:status_changed', {
    orderId: order.id,
    status: newStatus,
    actorRole: actor.role,
  });

  // If transitioning to ready_for_pickup, automatically transition to awaiting_partner
  if (newStatus === 'ready_for_pickup') {
    return transitionOrderStatus(orderId, 'awaiting_partner', actor);
  }

  // If transitioning to picked_up, update the active Delivery so simulator moves to customer
  if (newStatus === 'picked_up') {
    try {
      const deliveries = await Delivery.find({ orderId: order._id, status: 'arrived_pickup' });
      for (const d of deliveries) {
        d.status = 'picked_up';
        d.timestamps = d.timestamps || {};
        d.timestamps.pickedUpAt = new Date();
        await d.save();

        const payload = {
          deliveryId: d.id,
          orderId: d.orderId,
          location: d.currentLocation || { lat: 0, lng: 0 },
          etaSeconds: d.etaSeconds,
          distanceRemainingMeters: d.distanceRemainingMeters,
          status: 'picked_up'
        };
        io.to(d.orderId.toString()).emit('delivery:status', { ...payload, prevStatus: 'arrived_pickup' });
        io.to('admin_fleet').emit('delivery:status', { ...payload, prevStatus: 'arrived_pickup' });
        if (restaurant?.ownerId) {
          io.to(restaurant.ownerId.toString()).emit('delivery:status', { ...payload, prevStatus: 'arrived_pickup' });
        }
      }
    } catch (err) {
      console.error('Failed to sync delivery status for picked_up', err);
      // Rollback order status to previous
      order.status = prevStatus;
      await order.save();
      throw new AppError('Failed to sync delivery status. Order state rolled back.', 500);
    }
  }

  // If transitioning to awaiting_partner, broadcast delivery:available
  if (newStatus === 'awaiting_partner') {
    const partners = await DeliveryPartner.find({ status: 'available' });
    const payload = {
      orderId: order._id.toString(),
      restaurantName: restaurant?.name || 'Restaurant',
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt
    };
    
    for (const partner of partners) {
      if (partner.userId) {
        emitDeliveryAvailable(partner.userId.toString(), payload);
      }
    }
  }

  // 9. Returns the updated order
  return order;
}
