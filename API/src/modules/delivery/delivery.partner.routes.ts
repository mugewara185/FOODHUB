import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { toLatLng } from '../../utils/geo';
import { Order } from '../orders/order.model';
import { emitDeliveryAssigned } from './delivery.events';

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

      const { orderId } = req.params;

      const updated = await Order.findOneAndUpdate(
        { _id: orderId, status: 'awaiting_partner' },
        { $set: { status: 'partner_assigned' } },
        { new: true }
      );

      if (!updated) {
        return res.status(409).json({ success: false, message: 'already_assigned' });
      }

      // Create a Delivery record
      const delivery = new Delivery({
        orderId: updated._id,
        partnerId: partner._id,
        status: 'partner_assigned',
        pickupLocation: partner.currentLocation, // Simplified since order has string address
        destinationLocation: partner.currentLocation // We don't have lat/lng in basic order
      });
      await delivery.save();

      partner.status = 'assigned';
      partner.currentAssignedDelivery = delivery._id as any;
      await partner.save();

      emitDeliveryAssigned({
        deliveryId: delivery._id.toString(),
        orderId: updated._id.toString(),
        partnerId: partner._id.toString(),
        partnerUserId: partner.userId.toString(),
        customerUserId: updated.userId.toString(),
        partnerName: partner.vehicleDetails?.plateNumber || 'Partner', // Fallback, could use req.user.name
        partnerPhone: partner.rating.toString(), // We don't have phone in partner model directly, just mock it
        status: 'partner_assigned'
      });

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
