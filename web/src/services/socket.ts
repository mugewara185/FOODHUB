import { io, Socket } from 'socket.io-client';
import { logger } from '../core/dev/logger';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string) {
    if (this.socket) return this.socket;

    logger.info('SOCKET', 'Connecting to socket server', { event: 'CONNECT.START', source: 'socketService' });

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      logger.info('SOCKET', `Socket connected: ${this.socket?.id}`, { event: 'CONNECT.SUCCESS', source: 'socketService' });
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('SOCKET', 'Socket connection error', { event: 'CONNECT.ERROR', error, source: 'socketService' });
    });

    this.socket.on('disconnect', () => {
      logger.info('SOCKET', 'Socket disconnected', { event: 'DISCONNECT', source: 'socketService' });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      logger.info('SOCKET', 'Disconnecting socket', { event: 'DISCONNECT', source: 'socketService' });
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinUserRoom(userId: string) {
    logger.debug('SOCKET', 'Joining user room', { event: 'USER_ROOM.JOIN', data: { userIdPresent: !!userId }, source: 'socketService' });
    this.socket?.emit('join_user_room', userId);
  }

  joinOrderRoom(orderId: string) {
    logger.debug('SOCKET', `Joining order room: ${orderId}`, { event: 'ORDER_ROOM.JOIN', data: { orderId }, source: 'socketService' });
    this.socket?.emit('join_order_room', orderId);
  }

  onOrderStatusUpdate(callback: (data: { orderId: string; status: string }) => void) {
    this.socket?.on('order_status_update', (data) => {
      logger.info('SOCKET', `Order status update received: ${data.orderId}`, { event: 'ORDER.STATUS.UPDATE.RECEIVED', data, source: 'socketService' });
      callback(data);
    });
  }

  onNotification(callback: (data: { title: string; message: string; orderId: string; status: string }) => void) {
    this.socket?.on('notification', (data) => {
      logger.info('SOCKET', `Notification received: ${data.title}`, { event: 'NOTIFICATION.RECEIVED', data: { title: data.title, hasOrderId: !!data.orderId }, source: 'socketService' });
      callback(data);
    });
  }

  onOrderStatusChanged(callback: (data: any) => void) {
    this.socket?.on('order:status_changed', callback);
  }

  onPartnerLocationUpdated(callback: (data: any) => void) {
    this.socket?.on('partner:location_updated', callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();