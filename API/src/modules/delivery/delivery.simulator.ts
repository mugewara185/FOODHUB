import { getDistance } from 'geolib';
import { Delivery, IDelivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getIO } from '../../socket';
import { Types } from 'mongoose';
import { Order } from '../orders/order.model';
import { evaluateRisk } from './risk.engine';

const activeSimulators = new Map<string, NodeJS.Timeout>();

export async function startDeliverySimulation(deliveryId: string) {
  if (activeSimulators.has(deliveryId)) {
    return; // Already running
  }

  // Define steps
  // 1. Move to restaurant (picked up)
  // 2. Move to destination (delivered)

  let timer = setInterval(async () => {
    try {
      const delivery = await Delivery.findById(deliveryId);
      if (!delivery || delivery.status === 'delivered' || delivery.status === 'cancelled') {
        stopDeliverySimulation(deliveryId);
        return;
      }

      if (!delivery.partnerId) return;
      const partner = await DeliveryPartner.findById(delivery.partnerId);
      if (!partner) return;

      const pickup = delivery.pickupLocation.coordinates; // [lng, lat]
      const dest = delivery.destinationLocation.coordinates;
      let current = delivery.currentLocation?.coordinates || partner.currentLocation?.coordinates;

      if (!current) current = [pickup[0] + 0.005, pickup[1] + 0.005]; // Fallback start location

      // Logic: Move towards target (pickup if not picked up, dest if picked up)
      const isPickedUp = ['picked_up', 'on_the_way', 'nearby'].includes(delivery.status);
      const target = isPickedUp ? dest : pickup;

      // Distance remaining
      const distanceRemaining = getDistance(
        { latitude: current[1], longitude: current[0] },
        { latitude: target[1], longitude: target[0] }
      );

      // Speed ~ 25 km/h = 6.9 m/s. Interval is 3s -> ~21m per tick.
      const stepMeters = 21;

      let nextLng = current[0];
      let nextLat = current[1];
      let newDistance = distanceRemaining;

      if (distanceRemaining > stepMeters) {
        // Interpolate
        const fraction = stepMeters / distanceRemaining;
        nextLng = current[0] + (target[0] - current[0]) * fraction;
        nextLat = current[1] + (target[1] - current[1]) * fraction;
        newDistance = distanceRemaining - stepMeters;
      } else {
        nextLng = target[0];
        nextLat = target[1];
        newDistance = 0;
      }

      // Update location
      delivery.currentLocation = { type: 'Point', coordinates: [nextLng, nextLat] };
      partner.currentLocation = { type: 'Point', coordinates: [nextLng, nextLat] };
      delivery.distanceRemainingMeters = newDistance;
      // ETA: distance / speed (6.9 m/s)
      delivery.etaSeconds = Math.round(newDistance / 6.9);

      // Status updates
      let statusChanged = false;
      const prevStatus = delivery.status;

      if (!isPickedUp && newDistance < 10) {
        delivery.status = 'picked_up';
        delivery.timestamps.pickedUpAt = new Date();
        statusChanged = true;
      } else if (isPickedUp) {
        if (newDistance < 10) {
          delivery.status = 'delivered';
          delivery.timestamps.deliveredAt = new Date();
          partner.status = 'available';
          partner.currentAssignedDelivery = undefined;
          statusChanged = true;
          stopDeliverySimulation(deliveryId);

          const order = await Order.findById(delivery.orderId);
          if (order) {
            order.status = 'delivered';
            await order.save();
          }
        } else if (newDistance < 500 && delivery.status !== 'nearby') {
          delivery.status = 'nearby';
          statusChanged = true;
        } else if (delivery.status === 'picked_up') {
          delivery.status = 'out_for_delivery';
          statusChanged = true;
        }
      }

      await delivery.save();
      await partner.save();

      // Emit events
      const io = getIO();
      const payload = {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        location: { lat: nextLat, lng: nextLng },
        etaSeconds: delivery.etaSeconds,
        distanceRemainingMeters: delivery.distanceRemainingMeters,
        status: delivery.status,
      };

      io.to(delivery.orderId.toString()).emit('delivery:location', payload);
      io.to('admin_fleet').emit('delivery:location', payload);

      if (statusChanged) {
        io.to(delivery.orderId.toString()).emit('delivery:status', { ...payload, prevStatus });
        io.to('admin_fleet').emit('delivery:status', { ...payload, prevStatus });
        
        // Also emit legacy order status for compatibility with old UI if needed
        io.to(delivery.orderId.toString()).emit('order_status_update', { orderId: delivery.orderId, status: delivery.status });

        const order = await Order.findById(delivery.orderId);
        if (order) {
            io.to(order.userId.toString()).emit('notification', {
                title: 'Delivery Update',
                message: `Your order is now ${delivery.status.replace('_', ' ')}`,
                orderId: delivery.orderId.toString(),
                status: delivery.status
            });
        }
      }

      // Trigger risk evaluation
      await evaluateRisk(delivery);

    } catch (err) {
      console.error('Simulator error for delivery', deliveryId, err);
    }
  }, 3000);

  activeSimulators.set(deliveryId, timer);
}

export function stopDeliverySimulation(deliveryId: string) {
  const timer = activeSimulators.get(deliveryId);
  if (timer) {
    clearInterval(timer);
    activeSimulators.delete(deliveryId);
  }
}
