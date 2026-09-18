import { useEffect, useState } from 'react';
import { socketService } from '../../../services/socket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '../../../core/types/socket.events';

interface DeliverySocketCallbacks {
  onAssigned?: (payload: DeliveryAssignedPayload) => void;
  onStatus?: (payload: DeliveryStatusPayload) => void;
  onLocation?: (payload: DeliveryLocationPayload) => void;
}

export const useDeliverySocket = (role: 'customer' | 'partner' | 'admin', callbacks?: DeliverySocketCallbacks) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Note: Connection management (socketService.connect/disconnect) is exclusively handled by App.tsx
    
    const handleConnectionChange = (status: 'connected' | 'reconnecting' | 'disconnected') => {
      setConnectionStatus(status);
    };

    socketService.onConnectionChange(handleConnectionChange);

    if (callbacks?.onAssigned) socketService.onDeliveryAssigned(callbacks.onAssigned);
    if (callbacks?.onStatus) socketService.onDeliveryStatus(callbacks.onStatus);
    if (callbacks?.onLocation) socketService.onDeliveryLocation(callbacks.onLocation);

    // If role is admin, we also explicitly join the admin fleet room
    if (role === 'admin') {
      socketService.joinAdminFleet();
    }

    return () => {
      socketService.offConnectionChange(handleConnectionChange);
      
      if (callbacks?.onAssigned) socketService.offDeliveryAssigned(callbacks.onAssigned);
      if (callbacks?.onStatus) socketService.offDeliveryStatus(callbacks.onStatus);
      if (callbacks?.onLocation) {
        (socketService as any).socket?.off('delivery:location', callbacks.onLocation);
      }
      if (role === 'admin') {
        socketService.leaveAdminFleet();
      }
    };
  }, [role, callbacks]);

  return { connectionStatus };
};
