import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { startDeliverySimulation } from './delivery.simulator';
import { Order } from '../orders/order.model';
import { Types } from 'mongoose';
import { getIO } from '../../socket';
import { assertValidTransition, DeliveryStatus } from './delivery.state';
import { emitDeliveryAssigned, emitDeliveryStatus } from './delivery.events';

export async function assignDelivery(orderId: string, restaurantLocation: [number, number], customerLocation: [number, number]) {
  // 1. Find nearest available partner (for demo, just find any available)
  const partner = await DeliveryPartner.findOne({ status: 'available' });
  if (!partner) {
    console.warn(`No available partners for order ${orderId}`);
    return null;
  }

  const partnerStart: [number, number] = [restaurantLocation[0] - 0.005, restaurantLocation[1] - 0.005];
  
  partner.status = 'assigned';
  partner.currentLocation = { type: 'Point', coordinates: partnerStart };
  
  const delivery = new Delivery({
    orderId,
    partnerId: partner._id,
    pickupLocation: { type: 'Point', coordinates: restaurantLocation },
    destinationLocation: { type: 'Point', coordinates: customerLocation },
    currentLocation: { type: 'Point', coordinates: partnerStart },
    status: 'pending',
    timestamps: {}
  });

  assertValidTransition(delivery.status, 'assigned');
  delivery.status = 'assigned';
  delivery.timestamps.assignedAt = new Date();

  await delivery.save();
  partner.currentAssignedDelivery = delivery._id as any;
  await partner.save();

  // 3. Emit assignment via type-safe emitter
  emitDeliveryAssigned({
    deliveryId: delivery.id.toString(),
    orderId: delivery.orderId.toString(),
    partnerId: delivery.partnerId?.toString() || partner.id.toString(),
    status: 'assigned',
    partnerName: partner.name,
    partnerPhone: partner.phone
  });

  // 4. Start Simulator
  startDeliverySimulation(delivery.id.toString());

  return delivery;
}

export async function setPartnerStatus(partnerId: string, status: 'offline' | 'available') {
  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) throw new Error('Partner not found');

  if (status === 'offline' && ['assigned', 'on_delivery'].includes(partner.status)) {
    throw new Error('Cannot go offline while on delivery');
  }

  partner.status = status;
  await partner.save();
  return partner;
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

  // Emit status change via type-safe emitter
  if (delivery.partnerId) {
    emitDeliveryStatus({
      deliveryId: delivery.id.toString(),
      orderId: delivery.orderId.toString(),
      partnerId: delivery.partnerId.toString(),
      status: newStatus,
      timestamp: new Date()
    });
  }

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

  // Cancelled is a state transition too, but we can emit a status event for it.
  if (delivery.partnerId) {
    emitDeliveryStatus({
      deliveryId: delivery.id.toString(),
      orderId: delivery.orderId.toString(),
      partnerId: delivery.partnerId.toString(),
      status: 'cancelled',
      timestamp: new Date()
    });
  }
}
