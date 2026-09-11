import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string) {
    if (this.socket) return this.socket;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinUserRoom(userId: string) {
    this.socket?.emit('join_user_room', userId);
  }

  joinOrderRoom(orderId: string) {
    this.socket?.emit('join_order_room', orderId);
  }

  onOrderStatusUpdate(callback: (data: { orderId: string; status: string }) => void) {
    this.socket?.on('order_status_update', callback);
  }

  onNotification(callback: (data: { title: string; message: string; orderId: string; status: string }) => void) {
    this.socket?.on('notification', (data) => {
      logger.info('SOCKET', `Notification received: ${data.title}`, { event: 'NOTIFICATION.RECEIVED', data: { title: data.title, hasOrderId: !!data.orderId }, source: 'socketService' });
      callback(data);
    });
  }

  offNotification(callback?: (data: any) => void) {
    this.socket?.off('notification', callback);
  }

  offOrderStatusUpdate(callback?: (data: any) => void) {
    this.socket?.off('order_status_update', callback);
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