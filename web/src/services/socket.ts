import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string, userType: 'customer' | 'partner' | 'admin') {
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      query: {
        userId,
        userType,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
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

  // Order tracking events
  subscribeToOrder(orderId: string, callback: (data: any) => void) {
    this.socket?.on(`order:${orderId}:location`, callback);
  }

  unsubscribeFromOrder(orderId: string) {
    this.socket?.off(`order:${orderId}:location`);
  }

  // Partner location updates
  updatePartnerLocation(partnerId: string, location: { lat: number; lng: number }) {
    this.socket?.emit('partner:location', { partnerId, location });
  }

  // Order status updates
  updateOrderStatus(orderId: string, status: string, location?: any) {
    this.socket?.emit('order:status', { orderId, status, location });
  }

  // Driver assignment
  assignDriver(orderId: string, driverId: string) {
    this.socket?.emit('order:assign', { orderId, driverId });
  }

  // Event listeners
  onOrderAssigned(callback: (data: any) => void) {
    this.socket?.on('order:assigned', callback);
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