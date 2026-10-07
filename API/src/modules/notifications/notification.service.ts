import { Types } from 'mongoose';
import { Notification, INotification } from './notification.model';
import { getIO } from '../../socket';

export interface CreateNotificationParams {
  userId: Types.ObjectId | string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  orderId?: Types.ObjectId | string;
}

export class NotificationService {
  async createNotification(params: CreateNotificationParams): Promise<INotification> {
    const notification = await Notification.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      orderId: params.orderId,
      isRead: false,
    });

    // Format for frontend
    const payload = {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      orderId: notification.orderId?.toString(),
    };

    // Emit to private user room
    try {
      getIO().to(params.userId.toString()).emit('notification', payload);
    } catch (err) {
      console.error('[NotificationService] Socket emit failed:', err);
    }

    return notification;
  }
}

export const notificationService = new NotificationService();
