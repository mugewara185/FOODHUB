import { Router } from 'express';
import {
  launchLiveOrderDemo,
  getActiveDemoOrder,
  confirmDemoHandoff,
} from '../dev/dev.controller';

const router = Router();

// Public Demonstration Endpoints (Production-Safe & Strictly Isolated)
router.get('/active-order', getActiveDemoOrder);
router.post('/launch-live-order', launchLiveOrderDemo);
router.post('/confirm-handoff', confirmDemoHandoff);

export default router;
