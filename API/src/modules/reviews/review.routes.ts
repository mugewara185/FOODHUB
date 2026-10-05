import { Router } from 'express';
import { createReview, getRestaurantReviews, getReviewEligibility } from './review.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

// Public route
router.get('/restaurant/:restaurantId', getRestaurantReviews);

// Protected routes
router.use(protect);
router.get('/eligibility/:restaurantId', getReviewEligibility);
router.post('/', createReview);

export default router;
