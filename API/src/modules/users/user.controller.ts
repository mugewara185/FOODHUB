import { Request, Response, NextFunction } from 'express';
import { User } from '../auth/auth.model';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../shared/middleware/errorHandler';
import { Types } from 'mongoose';

export async function addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const newAddress = {
      ...req.body,
      id: new Types.ObjectId().toString(),
    };
    
    // If it's the first address or explicitly default, unset others
    if (newAddress.isDefault || user.addresses.length === 0) {
      newAddress.isDefault = true;
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    user.addresses.push(newAddress);
    await user.save();
    
    sendSuccess({ res, data: { addresses: user.addresses }, message: 'Address added' });
  } catch (err) { next(err); }
}

export async function removeAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    user.addresses = user.addresses.filter((a: any) => a._id?.toString() !== req.params.addressId && a.id !== req.params.addressId);
    await user.save();
    sendSuccess({ res, data: { addresses: user.addresses }, message: 'Address removed' });
  } catch (err) { next(err); }
}

export async function toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    const restaurantIdStr = req.params.restaurantId;
    const exists = user.favoriteRestaurants.some((id: any) => id.toString() === restaurantIdStr);
    
    if (exists) {
      user.favoriteRestaurants = user.favoriteRestaurants.filter((id: any) => id.toString() !== restaurantIdStr);
    } else {
      user.favoriteRestaurants.push(new Types.ObjectId(restaurantIdStr) as any);
    }
    
    await user.save();
    sendSuccess({ res, data: { favoriteRestaurants: user.favoriteRestaurants }, message: 'Favorites updated' });
  } catch (err) { next(err); }
}

