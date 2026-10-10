import { getDistance } from 'geolib';
import { Delivery, IDelivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getIO } from '../../socket';
import { Types } from 'mongoose';
import { Order } from '../orders/order.model';
import { evaluateRisk } from './risk.engine';
import { config } from '../../config/env';

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
      const isPickedUp = ['picked_up', 'out_for_delivery', 'nearby'].includes(delivery.status);
      const target = isPickedUp ? dest : pickup;

      // Distance remaining
      const distanceRemaining = getDistance(
        { latitude: current[1], longitude: current[0] },
        { latitude: target[1], longitude: target[0] }
      );

      // Speed ~ 25 km/h = 6.9 m/s. Interval is 3s -> ~21m per tick.
      const stepMeters = config.deliverySimulator.stepMeters;

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
        if (delivery.status === 'partner_assigned') {
          delivery.status = 'arrived_pickup';
          statusChanged = true;
        }
        // Do not automatically transition to picked_up. 
        // Owner must manually confirm handoff to change status to picked_up.
      } else if (isPickedUp) {
        if (newDistance < 10) {
          delivery.status = 'delivered';
          delivery.timestamps.deliveredAt = new Date();
          partner.status = 'available';
          partner.currentAssignedDelivery = undefined;
          partner.completedDeliveries = (partner.completedDeliveries || 0) + 1;
          statusChanged = true;
          stopDeliverySimulation(deliveryId);
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
      if (delivery.partnerId) {
        try {
          const partner = await DeliveryPartner.findById(delivery.partnerId);
          if (partner && partner.userId) {
            io.to(partner.userId.toString()).emit('delivery:location', payload);
          }
        } catch(e) {}
      }

      let ownerIdStr = '';
      try {
        const order = await Order.findById(delivery.orderId);
        if (order) {
          const { Restaurant } = require('../restaurants/restaurant.model');
          const restaurant = await Restaurant.findById(order.restaurantId);
          if (restaurant?.ownerId) {
            ownerIdStr = restaurant.ownerId.toString();
            io.to(ownerIdStr).emit('delivery:location', payload);
          }
        }
      } catch (e) {
        // Ignore
      }

      if (statusChanged) {
        io.to(delivery.orderId.toString()).emit('delivery:status', { ...payload, prevStatus });
        io.to('admin_fleet').emit('delivery:status', { ...payload, prevStatus });
        if (ownerIdStr) {
          io.to(ownerIdStr).emit('delivery:status', { ...payload, prevStatus });
        }
        if (delivery.partnerId) {
          try {
            const partner = await DeliveryPartner.findById(delivery.partnerId);
            if (partner && partner.userId) {
              io.to(partner.userId.toString()).emit('delivery:status', { ...payload, prevStatus });
            }
          } catch(e) {}
        }
        
        try {
          const { transitionOrderStatus } = await import('../orders/order.service');
          // Only sync order status if it's one of the canonical mapping states
          if (['picked_up', 'out_for_delivery', 'delivered'].includes(delivery.status)) {
            await transitionOrderStatus(delivery.orderId.toString(), delivery.status, { id: 'system', role: 'system' });
          }
        } catch (e) {
          console.error('[simulator] Failed to transition order status:', e);
        }
      }

      // Trigger risk evaluation
      await evaluateRisk(delivery);

    } catch (err) {
      console.error('Simulator error for delivery', deliveryId, err);
    }
  }, config.deliverySimulator.intervalMs);

  activeSimulators.set(deliveryId, timer);
}

export function stopDeliverySimulation(deliveryId: string) {
  const timer = activeSimulators.get(deliveryId);
  if (timer) {
    clearInterval(timer);
    activeSimulators.delete(deliveryId);
  }
}
