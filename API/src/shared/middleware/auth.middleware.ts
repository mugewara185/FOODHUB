import type { Request, Response, NextFunction } from 'express';
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

    // DEV BYPASS LOGIC
    const isDev = config.nodeEnv === 'development' || process.env.NODE_ENV === 'development';
    const isBypassAuth = process.env.DEV_BYPASS_AUTH === 'true' || req.headers['x-dev-bypass-auth'] === 'true';
    
    if (isDev && (isBypassAuth && (!authHeader || !authHeader.startsWith('Bearer ') || req.headers['x-dev-bypass-auth'] === 'true'))) {
      console.log('⚠️ DEV_BYPASS_AUTH is active! Bypassing JWT validation.');
      req.user = { 
        id: (req.headers['x-dev-bypass-user-id'] as string) || '64e8e50f3c5f4a1b8c1a9999',
        email: 'dev@zom2.local', 
        roles: req.headers['x-dev-bypass-role'] ? [(req.headers['x-dev-bypass-role'] as string)] : ['user', 'admin', 'owner', 'partner'], 
        name: 'Dev Bypasser' 
      };
      return next();
    }

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Not authorized, no token', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
    console.log('decoded', decoded);
    const user = await User.findById(decoded.id).select('-password');
    console.log('user', user);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    req.user = { id: user._id.toString(), email: user.email, roles: user.roles, name: user.name };
    next();
    } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(new AppError('Not authorized, token failed', 401));
    } else {
      next(err);
    }
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized, user not found', 401));
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      return next(new AppError(`User role not authorized to access this route`, 403));
    }
    
    next();
  };
}
