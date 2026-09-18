import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { startDeliverySimulation } from './delivery.simulator';
import { Order } from '../orders/order.model';
import { Types } from 'mongoose';
import { getIO } from '../../socket';
import { assertValidTransition, DeliveryStatus } from './delivery.state';

export async function assignDelivery(orderId: string, restaurantLocation: [number, number], customerLocation: [number, number]) {
  // 1. Find nearest available partner (for demo, just find any available)
  const partner = await DeliveryPartner.findOne({ status: 'available' });
  if (!partner) {
    console.warn(`No available partners for order ${orderId}`);
    return null;
  }

  // Set partner starting location slightly away from restaurant for demo
  const partnerStart: [number, number] = [restaurantLocation[0] - 0.005, restaurantLocation[1] - 0.005];
  
  partner.status = 'assigned';
  partner.currentLocation = { type: 'Point', coordinates: partnerStart };
  
  // 2. Create Delivery
  const delivery = new Delivery({
    orderId,
    partnerId: partner._id,
    pickupLocation: { type: 'Point', coordinates: restaurantLocation },
    destinationLocation: { type: 'Point', coordinates: customerLocation },
    currentLocation: { type: 'Point', coordinates: partnerStart },
    status: 'pending', // Starts at pending before transitioning to assigned
    timestamps: {}
  });

  // assert valid transition logic via service layer
  assertValidTransition(delivery.status, 'assigned');
  delivery.status = 'assigned';
  delivery.timestamps.assignedAt = new Date();

  await delivery.save();
  partner.currentAssignedDelivery = delivery._id as any;
  await partner.save();

  // 3. Emit assignment
  const io = getIO();
  io.to(orderId).emit('delivery:assigned', {
    deliveryId: delivery.id,
    partner: {
      id: partner.id,
      name: partner.name,
      phone: partner.phone,
      vehicle: partner.vehicle,
      rating: partner.rating
    }
  });

  // 4. Start Simulator
  startDeliverySimulation(delivery.id);

  return delivery;
}

export async function updateDeliveryStatus(deliveryId: string, newStatus: DeliveryStatus) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error('Delivery not found');

  assertValidTransition(delivery.status, newStatus);
  delivery.status = newStatus;

  if (newStatus === 'picked_up') delivery.timestamps.pickedUpAt = new Date();
  if (newStatus === 'delivered') delivery.timestamps.deliveredAt = new Date();
  if (newStatus === 'cancelled') delivery.timestamps.cancelledAt = new Date();

  await delivery.save();
  return delivery;
}

export async function cancelDeliveryForOrder(orderId: string) {
  const delivery = await Delivery.findOne({ orderId, status: { $ne: 'delivered' } });
  if (!delivery) return;

  assertValidTransition(delivery.status, 'cancelled');
  delivery.status = 'cancelled';
  delivery.timestamps.cancelledAt = new Date();
  await delivery.save();

  if (delivery.partnerId) {
    const partner = await DeliveryPartner.findById(delivery.partnerId);
    if (partner) {
      partner.status = 'available';
      partner.currentAssignedDelivery = undefined;
      await partner.save();
    }
  }

  const io = getIO();
  io.to(orderId).emit('delivery:cancelled', { deliveryId: delivery.id });
  io.to('admin_fleet').emit('delivery:cancelled', { deliveryId: delivery.id });
}
