import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { AppError } from './errorHandler';
import { User } from '../../modules/auth/auth.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
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

    req.user = { id: user._id.toString(), email: user.email, roles: user.roles, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles.some(role => allowedRoles.includes(role))) {
      return next(new AppError(`Not authorized, must be one of: ${allowedRoles.join(', ')}`, 403));
    }
    next();
  };
}
