import { Router } from 'express';
import { createReview, getReviewsByRestaurant } from './review.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/restaurant/:restaurantId', getReviewsByRestaurant);
router.post('/', protect, createReview);

export default router;
