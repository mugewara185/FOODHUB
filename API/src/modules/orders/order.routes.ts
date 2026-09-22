import { Router } from 'express';
import { createOrder, getUserOrders, getOwnerOrders, getOrderById, cancelOrder, acceptOrder, rejectOrder, markPreparing, markReady } from './order.controller';
import { protect, authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/owned', authorize('owner', 'admin'), getOwnerOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

router.patch('/:id/accept',    authorize('owner', 'admin'), acceptOrder);
router.patch('/:id/reject',    authorize('owner', 'admin'), rejectOrder);
router.patch('/:id/preparing', authorize('owner', 'admin'), markPreparing);
router.patch('/:id/ready',     authorize('owner', 'admin'), markReady);

export default router;
