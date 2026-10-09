import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { toLatLng } from '../../utils/geo';
import { Order } from '../orders/order.model';
import { transitionOrderStatus } from '../orders/order.service';
import { emitDeliveryAssigned } from './delivery.events';
import { Restaurant } from '../restaurants/restaurant.model';
import { startDeliverySimulation } from './delivery.simulator';
const router = Router();

/**
 * Get the authenticated partner's own state.
 * Resolves partner from req.user.id (JWT).
 */
router.get(
  '/me',
  protect,
  authorize('partner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user!.id });
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner profile not found' });
      }

      // Active delivery for this partner, if any
      const activeDelivery = await Delivery.findOne({
        partnerId: partner._id,
        status: { $ne: 'delivered' },
      });

      res.json({
        success: true,
        data: {
          name: partner.name,
          phone: partner.phone,
          vehicle: partner.vehicle,
          rating: partner.rating,
          completedDeliveries: (partner as any).completedDeliveries || 0,
          status: partner.status,
          isOnline: partner.status === 'available' || partner.status === 'on_delivery',
          currentLocation: partner.currentLocation ? toLatLng(partner.currentLocation) : null,
          activeAssignment: activeDelivery
            ? {
              deliveryId: activeDelivery._id.toString(),
              orderId: activeDelivery.orderId.toString(),
              partnerId: partner._id.toString(),
              status: activeDelivery.status,
              pickupLocation: toLatLng(activeDelivery.pickupLocation),
              dropoffLocation: toLatLng(activeDelivery.destinationLocation),
              currentLocation: activeDelivery.currentLocation
                ? toLatLng(activeDelivery.currentLocation)
                : null,
            }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update the authenticated partner's availability.
 * - Cannot go offline while assigned / on_delivery.
 * - Only 'available' | 'offline' are accepted.
 * - Partner is resolved from JWT; no partner ID accepted from the client.
 */
router.patch(
  '/me/status',
  protect,
  authorize('partner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status?: string };

      if (!status || !['available', 'offline'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Expected "available" or "offline".',
        });
      }

      const partner = await DeliveryPartner.findOne({ userId: req.user!.id });
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner profile not found' });
      }

      if (status === 'offline' && ['assigned', 'on_delivery'].includes(partner.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot go offline while on delivery',
        });
      }

      partner.status = status;
      await partner.save();

      return res.json({ success: true, data: partner });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:orderId/accept',
  protect,
  authorize('partner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user!.id });
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner profile not found' });
      }

      if (partner.status !== 'available') {
        return res.status(400).json({ success: false, message: 'Partner is not available for new assignments' });
      }

      const { orderId } = req.params;

      // Atomic lock
      const order = await Order.findOneAndUpdate(
        { _id: orderId, status: 'awaiting_partner' },
        { status: 'partner_assigned' },
        { new: true }
      );
      if (!order) {
        return res.status(409).json({ success: false, message: 'already_assigned or invalid state' });
      }

      // We already atomically transitioned the order to 'partner_assigned'.
      // Now we just run the side effects by re-calling transitionOrderStatus, 
      // but wait, transitionOrderStatus expects current status to be awaiting_partner!
      // So we must manually emit the event, or revert it if we want to use transitionOrderStatus.
      // Alternatively, we revert it back to 'awaiting_partner' in memory, and let transitionOrderStatus handle it? No, if we revert it, another request could grab it.
      // Let's just restore it, wait no, let's use transitionOrderStatus on the ALREADY assigned order? It will fail validation.
      
      // Let's manually emit the order:status_changed event to match transitionOrderStatus:
      const io = require('../../socket').getIO();
      const restaurant = await Restaurant.findById(order.restaurantId);
      
      io.to(order._id.toString()).emit('order_status_update', { orderId: order._id, status: 'partner_assigned' });
      if (restaurant?.ownerId) {
        io.to(restaurant.ownerId.toString()).emit('order:status_changed', { orderId: order._id, status: 'partner_assigned', actorRole: 'system' });
      }
      io.to(order.userId.toString()).emit('order:status_changed', { orderId: order._id, status: 'partner_assigned', actorRole: 'system' });
      io.to('admin_fleet').emit('order:status_changed', { orderId: order._id, status: 'partner_assigned', actorRole: 'system' });
      
      const updated = order;

      const rLat = restaurant?.location?.lat || 12.9716;
      const rLng = restaurant?.location?.lng || 77.5946;

      const pickupCoords: [number, number] = [rLng, rLat];
      const destCoords: [number, number] = [rLng + 0.02, rLat + 0.02];
      const startCoords: [number, number] = partner.currentLocation?.coordinates?.length === 2 
          ? [partner.currentLocation.coordinates[0], partner.currentLocation.coordinates[1]] 
          : [rLng - 0.01, rLat - 0.01];

      // Create a Delivery record
      const delivery = new Delivery({
        orderId: updated._id,
        partnerId: partner._id,
        status: 'partner_assigned',
        pickupLocation: { type: 'Point', coordinates: pickupCoords },
        destinationLocation: { type: 'Point', coordinates: destCoords },
        currentLocation: { type: 'Point', coordinates: startCoords }
      });
      await delivery.save();

      partner.status = 'assigned';
      partner.currentAssignedDelivery = delivery._id as any;
      partner.currentLocation = { type: 'Point', coordinates: startCoords };
      await partner.save();

      emitDeliveryAssigned({
        deliveryId: delivery._id.toString(),
        orderId: updated._id.toString(),
        partnerId: partner._id.toString(),
        partnerUserId: partner.userId.toString(),
        customerUserId: updated.userId.toString(),
        partnerName: partner.name || 'Partner',
        partnerPhone: partner.phone || '9999999999',
        status: 'partner_assigned'
      });

      startDeliverySimulation(delivery._id.toString());

      return res.json({ success: true, data: delivery });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:orderId/reject',
  protect,
  authorize('partner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user!.id });
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner profile not found' });
      }

      return res.json({ success: true, message: 'skipped' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
