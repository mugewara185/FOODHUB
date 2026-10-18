import { Router } from 'express';
import {
  seedFactoryData,
  assignPartner,
  getDbInfo,
  launchLiveOrderDemo,
  getActiveDemoOrder,
  confirmDemoHandoff,
} from './dev.controller';

const router = Router();

router.get('/db-info', getDbInfo);
router.post('/seed-factory-data', seedFactoryData);
router.post('/assign-partner', assignPartner);

// One-Click Live-Order Demo endpoints
router.get('/demo/active-order', getActiveDemoOrder);
router.post('/demo/launch-live-order', launchLiveOrderDemo);
router.post('/demo/confirm-handoff', confirmDemoHandoff);

export default router;
