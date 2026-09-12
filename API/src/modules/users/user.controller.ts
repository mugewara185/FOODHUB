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

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.avatar !== undefined) (user as any).avatar = req.body.avatar;
    
    await user.save();
    
    sendSuccess({ res, data: { user }, message: 'Profile updated successfully' });
  } catch (err) { next(err); }
}

// Admin controllers
export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.role && req.query.role !== 'all') {
      // Maps UI roles to backend roles
      const roleMap: any = {
        'customer': 'user',
        'restaurant_owner': 'owner',
        'delivery_partner': 'partner',
        'admin': 'admin'
      };
      const backendRole = roleMap[req.query.role as string] || req.query.role;
      query.roles = backendRole;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

    sendSuccess({ res, data: { users, total, page, limit }, message: 'Users retrieved' });
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess({ res, data: { user }, message: 'User retrieved' });
  } catch (err) { next(err); }
}

export async function updateUserAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess({ res, data: { user }, message: 'User updated' });
  } catch (err) { next(err); }
}

export async function deleteUserAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess({ res, data: null, message: 'User deleted' });
  } catch (err) { next(err); }
}
