import { Router } from 'express';
import { getAllRestaurants, getRestaurantById, getMineRestaurant } from './restaurant.controller';
import { protect, authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/', getAllRestaurants);
router.get('/mine', protect, authorize('owner', 'admin'), getMineRestaurant as any);
router.get('/:id', getRestaurantById);

export default router;
