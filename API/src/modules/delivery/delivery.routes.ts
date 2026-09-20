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