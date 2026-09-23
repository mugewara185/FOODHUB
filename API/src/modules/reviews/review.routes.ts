import { Router } from 'express';
import { createReview } from './review.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', createReview);

export default router;
