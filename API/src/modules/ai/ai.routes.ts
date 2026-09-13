import { Router } from 'express';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { aiController } from './ai.controller';

const router = Router();

// Protect all AI routes
router.use(protect);
router.use(authorize('admin'));

router.post('/chat', aiController.chat);
router.post('/investigations', aiController.createInvestigation);

export default router;
