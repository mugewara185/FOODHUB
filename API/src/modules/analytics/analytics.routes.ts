import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { protect, authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', analyticsController.getDashboard);

export const analyticsRoutes = router;
