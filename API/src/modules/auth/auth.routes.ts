import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './auth.controller';
import { protect } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

export default router;
