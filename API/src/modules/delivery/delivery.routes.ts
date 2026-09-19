import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getActiveRisks } from './risk.engine';
import { askDeliveryCopilot } from './delivery.ai';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { toLatLng, toGeoJSON } from '../../utils/geo';

import { setPartnerStatus, updateDeliveryStatus } from './delivery.service';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────
// PARTNER ROUTES — authenticated partner session
// ─────────────────────────────────────────────────────────────────────────

/**
 * Get the authenticated partner's own state.
 * Resolves partner from req.user.id (JWT).
 */
router.get(
  '/partner/me',
  protect,
  authorize('delivery_partner'),
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
  '/partner/me/status',
  protect,
  authorize('delivery_partner'),
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

// ─────────────────────────────────────────────────────────────────────────
// DELIVERY STATUS — kept for the partner "start/pickup/delivered" flow
// (currently reachable without auth per the existing convention;
//  TODO: re-enable protect + authorize once the frontend sends the token)
// ─────────────────────────────────────────────────────────────────────────

router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delivery = await updateDeliveryStatus(req.params.id, req.body.status);
    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — everything below requires the 'admin' role
// ─────────────────────────────────────────────────────────────────────────

router.use(authorize('admin'));

/**
 * Fleet snapshot for the admin dashboard.
 * Returns all partners + all active deliveries + open risks.
 */
router.get('/fleet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await Delivery.find({ status: { $ne: 'delivered' } }).populate('partnerId');
    const partners = await DeliveryPartner.find();
    const risks = getActiveRisks();

    const mappedPartners = partners.map((p) => {
      const doc = p.toObject();
      return {
        id: doc._id.toString(),
        userId: doc.userId ? doc.userId.toString() : null,
        name: doc.name,
        phone: doc.phone,
        vehicle: doc.vehicle,
        rating: doc.rating,
        status: doc.status,
        currentLocation: doc.currentLocation ? toLatLng(doc.currentLocation) : null,
        currentAssignedDelivery: doc.currentAssignedDelivery,
      };
    });

    res.json({
      success: true,
      data: {
        activeDeliveries: deliveries,
        partners: mappedPartners,
        risks,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/copilot', askDeliveryCopilot);

export default router;