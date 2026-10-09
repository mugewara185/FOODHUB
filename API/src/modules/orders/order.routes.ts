import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOwnerOrders,
  getOrderById,
  getOrderChat,
  cancelOrder,
  acceptOrder,
  rejectOrder,
  markPreparing,
  markReady,
  markPickedUp,
  createOrderSchema,
  getAllOrders
} from './order.controller';
import { protect, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';

const router = Router();

router.use(protect);

router.post('/', validateRequest(createOrderSchema), createOrder);
router.get('/', getUserOrders);
router.get('/owned', authorize('owner', 'admin'), getOwnerOrders);
router.get('/all', authorize('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.get('/:id/chat', getOrderChat);
router.patch('/:id/cancel', cancelOrder);

router.patch('/:id/accept',    authorize('owner', 'admin'), acceptOrder);
router.patch('/:id/reject',    authorize('owner', 'admin'), rejectOrder);
router.patch('/:id/preparing', authorize('owner', 'admin'), markPreparing);
router.patch('/:id/ready',     authorize('owner', 'admin'), markReady);
router.patch('/:id/picked_up', authorize('owner', 'admin'), markPickedUp);

export default router;
