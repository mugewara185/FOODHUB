import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { AppError } from './errorHandler';
import { User } from '../../modules/auth/auth.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

export async function protect(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Not authorized, no token', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
}
