import { Router } from 'express';
import { addAddress, removeAddress, toggleFavorite, toggleFoodFavorite, updateProfile, getAllUsers, getUserById, updateUserAdmin, deleteUserAdmin } from './user.controller';
import { protect, authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:addressId', protect, removeAddress);

// CRITICAL: /favorites/food/:foodItemId must be registered BEFORE /favorites/:restaurantId
// otherwise Express will match 'food' as the restaurantId parameter.
router.post('/favorites/food/:foodItemId', protect, toggleFoodFavorite);
router.post('/favorites/:restaurantId', protect, toggleFavorite);

router.patch('/profile', protect, updateProfile);

// Admin routes
router.get('/admin', protect, authorize('admin'), getAllUsers);
router.get('/admin/:id', protect, authorize('admin'), getUserById);
router.patch('/admin/:id', protect, authorize('admin'), updateUserAdmin);
router.delete('/admin/:id', protect, authorize('admin'), deleteUserAdmin);

export default router;
