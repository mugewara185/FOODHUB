import { io, Socket } from 'socket.io-client';
import { logger } from '../core/utils/logger';
import type { 
  DeliveryAssignedPayload, 
  DeliveryStatusPayload, 
  DeliveryLocationPayload, 
  PartnerLocationUpdatedPayload 
} from '../core/types/socket.events';

class SocketService {
  private socket: Socket | null = null;
  private connectionChangeListeners: Set<(status: 'connected' | 'reconnecting' | 'disconnected') => void> = new Set();

  connect(userId?: string, role?: string) {
    if (this.socket) return this.socket;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id, role ? `(Role: ${role})` : '');
      this.notifyConnectionState('connected');
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.notifyConnectionState('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.notifyConnectionState('reconnecting');
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.notifyConnectionState('reconnecting');
    });

    return this.socket;
  }

  private notifyConnectionState(status: 'connected' | 'reconnecting' | 'disconnected') {
    this.connectionChangeListeners.forEach(listener => listener(status));
  }

  onConnectionChange(callback: (status: 'connected' | 'reconnecting' | 'disconnected') => void) {
    this.connectionChangeListeners.add(callback);
    // Immediately invoke with current status if socket exists
    if (this.socket) {
      if (this.socket.connected) callback('connected');
      else callback('disconnected'); // or reconnecting, but disconnected is safer
    }
  }

  offConnectionChange(callback: (status: 'connected' | 'reconnecting' | 'disconnected') => void) {
    this.connectionChangeListeners.delete(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notifyConnectionState('disconnected');
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
      this.socket?.on('delivery:assigned', callback);
      this.socket?.on('delivery:location', callback);
      this.socket?.on('delivery:status', callback);
    }
  }

  unsubscribeFromOrder(orderId: string, callback?: (data: any) => void) {
    this.socket?.emit('leave_order_room', orderId);
    if (callback) {
      this.socket?.off('order_status_update', callback);
      this.socket?.off('order:status_changed', callback);
      this.socket?.off('partner:location_updated', callback);
      this.socket?.off('delivery:assigned', callback);
      this.socket?.off('delivery:location', callback);
      this.socket?.off('delivery:status', callback);
    } else {
      this.socket?.off('order_status_update');
      this.socket?.off('order:status_changed');
      this.socket?.off('partner:location_updated');
      this.socket?.off('delivery:assigned');
      this.socket?.off('delivery:location');
      this.socket?.off('delivery:status');
    }
  }

  joinAdminFleet() {
    this.socket?.emit('join_admin_fleet');
  }

  leaveAdminFleet() {
    this.socket?.emit('leave_admin_fleet');
    this.socket?.off('delivery:location');
    this.socket?.off('delivery:status');
    this.socket?.off('delivery:risk');
    this.socket?.off('delivery:risk_cleared');
  }
  
  onAdminFleetEvent(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  updatePartnerLocation(orderId: string, location: { lat: number; lng: number }) {
    // For legacy compat with ActiveDelivery.tsx without touching it
    this.socket?.emit('partner:location_updated', { orderId, location });
  }

  // Legacy fallback to be refactored eventually
  updateOrderStatus(orderId: string, status: string, location?: any) {
    this.socket?.emit('order_status_update', { orderId, status, location });
  }

  // Type-safe listeners
  onDeliveryAssigned(callback: (payload: DeliveryAssignedPayload) => void) {
    this.socket?.on('delivery:assigned', callback);
  }
  
  onDeliveryStatus(callback: (payload: DeliveryStatusPayload) => void) {
    this.socket?.on('delivery:status', callback);
  }

  onDeliveryLocation(callback: (payload: DeliveryLocationPayload) => void) {
    this.socket?.on('delivery:location', callback);
  }

  onPartnerLocationUpdated(callback: (payload: PartnerLocationUpdatedPayload) => void) {
    this.socket?.on('partner:location_updated', callback);
  }

  offDeliveryAssigned(callback?: (payload: DeliveryAssignedPayload) => void) {
    this.socket?.off('delivery:assigned', callback);
  }
  
  offDeliveryStatus(callback?: (payload: DeliveryStatusPayload) => void) {
    this.socket?.off('delivery:status', callback);
  }

  // Others
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

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();