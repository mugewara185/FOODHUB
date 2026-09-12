import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from './auth.model';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  token: z.string().min(1),
});

function signToken(id: string): string {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  // console.log('Registering user with data:', req.body);
  try {
    const body = registerSchema.parse(req.body);
    // const body= req.body
    const existing = await User.findOne({ email: body.email });
    if (existing) throw new AppError('Email already in use', 409);

    const user = await User.create(body);
    const token = signToken(user._id.toString());

    sendSuccess({
      res,
      statusCode: 201,
      message: 'Registration successful',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
      },
    });
  } catch (err) {
    console.error('Error during registration:', err);
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const user = await User.findOne({ email: body.email }).select('+password');
    if (!user || !(await user.comparePassword(body.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken(user._id.toString());

    sendSuccess({
      res,
      message: 'Login successful',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: body.email });

    if (user) {
      const resetToken = signToken(user._id.toString());
      sendSuccess({ res, message: 'If an account exists, a reset link has been generated.', data: { resetToken } });
      return;
    }

    sendSuccess({ res, message: 'If an account exists, a reset link has been generated.', data: { resetToken: null } });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = resetPasswordSchema.parse(req.body);

    if (body.password !== body.confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const decoded = jwt.verify(body.token, config.jwt.secret) as { id?: string };
    if (!decoded.id) {
      throw new AppError('Invalid reset token', 400);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.password = body.password;
    await user.save();

    sendSuccess({ res, message: 'Password reset successful', data: { success: true } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById((req as any).user.id);
    if (!user) throw new AppError('User not found', 404);

    sendSuccess({ res, message: 'User fetched', data: user });
  } catch (err) {
    next(err);
  }
}
