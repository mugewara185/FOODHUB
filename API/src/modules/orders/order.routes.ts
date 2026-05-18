import { Router } from 'express';
import { createOrder, getUserOrders, getOrderById, cancelOrder } from './order.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

export default router;
