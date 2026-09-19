import { Router } from 'express';
import { seedFactoryData, assignPartner } from './dev.controller';

const router = Router();

router.post('/seed-factory-data', seedFactoryData);
router.post('/assign-partner', assignPartner);

export default router;
