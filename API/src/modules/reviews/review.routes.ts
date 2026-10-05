import { Router } from 'express';
import { createReview, getRestaurantReviews, getReviewEligibility, createReviewSchema } from './review.controller';
import { protect } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';

const router = Router();

// Public route
router.get('/restaurant/:restaurantId', getRestaurantReviews);

// Protected routes
router.use(protect);
router.get('/eligibility/:restaurantId', getReviewEligibility);
router.post('/', validateRequest(createReviewSchema), createReview);

export default router;
