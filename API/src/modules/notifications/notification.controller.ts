import { Request, Response, NextFunction } from 'express';
import { Notification } from './notification.model';
import { sendSuccess } from '../../shared/utils/response';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    sendSuccess({
      res,
      message: 'Notifications retrieved',
      data: { notifications },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const notificationId = req.params.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    
    sendSuccess({
      res,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    sendSuccess({
      res,
      message: 'All notifications marked as read',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
