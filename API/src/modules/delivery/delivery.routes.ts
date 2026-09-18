import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getActiveRisks } from './risk.engine';
import { askDeliveryCopilot } from './delivery.ai';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { toLatLng } from '../../utils/geo';

import { setPartnerStatus, updateDeliveryStatus } from './delivery.service';

const router = Router();

router.use(protect);

router.post('/partner/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await setPartnerStatus(req.params.id, req.body.status);
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delivery = await updateDeliveryStatus(req.params.id, req.body.status);
    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.use(authorize('admin'));

router.get('/fleet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await Delivery.find({ status: { $ne: 'delivered' } }).populate('partnerId');
    const partners = await DeliveryPartner.find();
    const risks = getActiveRisks();

    // Map partners to the expected frontend shape, converting GeoJSON to { lat, lng }
    const mappedPartners = partners.map(p => {
      const doc = p.toObject();
      return {
        id: doc._id.toString(),
        name: doc.name,
        phone: doc.phone,
        vehicle: doc.vehicle,
        rating: doc.rating,
        status: doc.status,
        currentLocation: doc.currentLocation ? toLatLng(doc.currentLocation) : null,
        currentAssignedDelivery: doc.currentAssignedDelivery
      };
    });

    res.json({
      success: true,
      data: {
        activeDeliveries: deliveries,
        partners: mappedPartners,
        risks: risks
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/copilot', askDeliveryCopilot);

export default router;
