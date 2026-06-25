import { Router } from 'express';
import { seedFactoryData } from './dev.controller';

const router = Router();

router.post('/seed-factory-data', seedFactoryData);

export default router;
