import { io, Socket } from 'socket.io-client';
import { logger } from '../core/utils/logger';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string, role?: string) {
    if (this.socket) return this.socket;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id, role ? `(Role: ${role})` : '');
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

  subscribeToOrder(orderId: string, callback?: (data: any) => void) {
    this.joinOrderRoom(orderId);
    if (callback) {
      this.socket?.on('order_status_update', callback);
      this.socket?.on('order:status_changed', callback);
      this.socket?.on('partner:location_updated', callback);
    }
  }

  unsubscribeFromOrder(orderId: string, callback?: (data: any) => void) {
    this.socket?.emit('leave_order_room', orderId);
    if (callback) {
      this.socket?.off('order_status_update', callback);
      this.socket?.off('order:status_changed', callback);
      this.socket?.off('partner:location_updated', callback);
    } else {
      this.socket?.off('order_status_update');
      this.socket?.off('order:status_changed');
      this.socket?.off('partner:location_updated');
    }
  }

  updatePartnerLocation(partnerId: string, location: { lat: number; lng: number }) {
    this.socket?.emit('partner:location_updated', { partnerId, location });
  }

  updateOrderStatus(orderId: string, status: string, location?: any) {
    this.socket?.emit('order_status_update', { orderId, status, location });
  }

  onOrderStatusUpdate(callback: (data: { orderId: string; status: string }) => void) {
    this.socket?.on('order_status_update', callback);
  }

  onNotification(callback: (data: { title: string; message: string; orderId: string; status: string }) => void) {
    this.socket?.on('notification', (data) => {
      logger.log(`[SOCKET] Notification received: ${data.title}`);
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