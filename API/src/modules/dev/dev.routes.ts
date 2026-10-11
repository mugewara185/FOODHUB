import { Router } from 'express';
import { seedFactoryData, assignPartner, getDbInfo } from './dev.controller';

const router = Router();

router.get('/db-info', getDbInfo);
router.post('/seed-factory-data', seedFactoryData);
router.post('/assign-partner', assignPartner);

export default router;
