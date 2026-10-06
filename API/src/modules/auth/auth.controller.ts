import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from './auth.model';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
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
  try {
    const body = req.body;
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
    const body = req.body;
    console.log("body", body);
    const user = await User.findOne({ email: new RegExp(`^${body.email}$`) })
      .select('+password');
    console.log('User found:', user);

    if (!user) {
      console.log('user not found!!')
      throw new AppError('Invalid email', 401);
    }
    if (!(await user.comparePassword(body.password))) {
      throw new AppError('Invalid password', 401);
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
    const body = req.body;
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
    const body = req.body;

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
    const userId = (req as any).user.id;
    console.log('GET ME CALLED WITH USER ID:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log('USER NOT FOUND IN DB:', userId);
      const allUsers = await User.find();
      console.log('ALL USERS IN DB:', allUsers.map(u => u._id.toString()));
      throw new AppError('User not found', 404);
    }

    sendSuccess({ res, message: 'User fetched', data: user });
  } catch (err) {
    next(err);
  }
}
