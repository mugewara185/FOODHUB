import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { toLatLng } from '../../utils/geo';

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

export default router;
