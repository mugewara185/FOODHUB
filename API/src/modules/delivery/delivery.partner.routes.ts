import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { toLatLng } from '../../utils/geo';
import { Order } from '../orders/order.model';
import { getIO } from '../../socket';
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

      let availableAssignments: any[] = [];
      if (partner.status === 'available') {
        const orders = await Order.find({ status: 'awaiting_partner' }).populate('restaurantId', 'name');
        availableAssignments = orders.map((order: any) => ({
          orderId: order._id.toString(),
          restaurantName: order.restaurantId?.name || 'Restaurant',
          deliveryAddress: order.deliveryAddress,
          totalAmount: order.totalAmount,
          items: order.items,
          createdAt: order.createdAt
        }));
      }

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
          availableAssignments,
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
    let session: any;
    let order: any;
    let delivery: any;
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user!.id });
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner profile not found' });
      }

      if (partner.status !== 'available') {
        return res.status(400).json({ success: false, message: 'Partner is not available for new assignments' });
      }

      const { orderId } = req.params;

      const mongoose = require('mongoose');
      session = await mongoose.startSession();
      
      try {
        session.startTransaction();
        order = await Order.findOneAndUpdate(
          { _id: orderId, status: 'awaiting_partner' },
          { status: 'partner_assigned' },
          { new: true, session }
        );
      } catch (err: any) {
        if (err.codeName === 'IllegalOperation') {
          // Standalone DB fallback for tests
          session.endSession();
          session = null;
          order = await Order.findOneAndUpdate(
            { _id: orderId, status: 'awaiting_partner' },
            { status: 'partner_assigned' },
            { new: true }
          );
        } else {
          throw err;
        }
      }

      if (!order) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(409).json({ success: false, message: 'already_assigned or invalid state' });
      }

      const restaurant = session ? await Restaurant.findById(order.restaurantId).session(session) : await Restaurant.findById(order.restaurantId);
      const rLat = restaurant?.location?.lat || 12.9716;
      const rLng = restaurant?.location?.lng || 77.5946;

      const pickupCoords: [number, number] = [rLng, rLat];
      const destCoords: [number, number] = [rLng + 0.02, rLat + 0.02];
      const startCoords: [number, number] = partner.currentLocation?.coordinates?.length === 2 
          ? [partner.currentLocation.coordinates[0], partner.currentLocation.coordinates[1]] 
          : [rLng - 0.01, rLat - 0.01];

      // Create a Delivery record
      delivery = new Delivery({
        orderId: order._id,
        partnerId: partner._id,
        status: 'partner_assigned',
        pickupLocation: { type: 'Point', coordinates: pickupCoords },
        destinationLocation: { type: 'Point', coordinates: destCoords },
        currentLocation: { type: 'Point', coordinates: startCoords }
      });
      if (session) await delivery.save({ session });
      else await delivery.save();

      partner.status = 'assigned';
      partner.currentAssignedDelivery = delivery._id as any;
      partner.currentLocation = { type: 'Point', coordinates: startCoords };
      
      if (session) await partner.save({ session });
      else await partner.save();

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      // Emit events only after successful commit
      const io = getIO();
      io.to(order._id.toString()).emit('order_status_update', { orderId: order._id, status: 'partner_assigned' });
      if (restaurant?.ownerId) {
        io.to(restaurant.ownerId.toString()).emit('order:status_changed', { orderId: order._id, status: 'partner_assigned', actorRole: 'system' });
      }
      io.to(order.userId.toString()).emit('order:status_changed', { orderId: order._id, status: 'partner_assigned', actorRole: 'system' });
      io.to('admin_fleet').emit('order:status_changed', { orderId: order._id, status: 'partner_assigned', actorRole: 'system' });

      emitDeliveryAssigned({
        deliveryId: delivery._id.toString(),
        orderId: order._id.toString(),
        partnerId: partner._id.toString(),
        partnerUserId: partner.userId.toString(),
        customerUserId: order.userId.toString(),
        partnerName: partner.name || 'Partner',
        partnerPhone: partner.phone || '9999999999',
        status: 'partner_assigned'
      });

      startDeliverySimulation(delivery._id.toString());

      return res.json({ success: true, data: delivery });
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      } else {
        if (order) await Order.findByIdAndUpdate(order._id, { status: 'awaiting_partner' });
        if (delivery && delivery._id) await Delivery.findByIdAndDelete(delivery._id);
      }
      console.error('Accept Error:', error);
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
