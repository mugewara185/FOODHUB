import { Router } from 'express';
import { addAddress, removeAddress, toggleFavorite } from './user.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:addressId', protect, removeAddress);
router.post('/favorites/:restaurantId', protect, toggleFavorite);

export default router;

