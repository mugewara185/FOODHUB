import { Router, Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getActiveRisks } from './risk.engine';
import { askDeliveryCopilot } from './delivery.ai';
import { protect, authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(protect);
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
