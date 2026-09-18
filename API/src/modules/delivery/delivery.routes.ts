import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getActiveRisks } from './risk.engine';
import { askDeliveryCopilot } from './delivery.ai';
import { protect, authorize } from '../../shared/middleware/auth.middleware';

import { setPartnerStatus } from './delivery.service';

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

router.use(authorize('admin'));

router.get('/fleet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await Delivery.find({ status: { $ne: 'delivered' } }).populate('partnerId');
    const partners = await DeliveryPartner.find();
    const risks = getActiveRisks();

    res.json({
      success: true,
      data: {
        activeDeliveries: deliveries,
        partners: partners,
        risks: risks
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/copilot', askDeliveryCopilot);

export default router;
