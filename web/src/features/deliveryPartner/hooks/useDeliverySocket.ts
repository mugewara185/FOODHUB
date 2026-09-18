import { useEffect } from 'react';
import { socketService } from '../../../services/socket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '../../../core/types/socket.events';

interface DeliverySocketCallbacks {
  onAssigned?: (payload: DeliveryAssignedPayload) => void;
  onStatus?: (payload: DeliveryStatusPayload) => void;
  onLocation?: (payload: DeliveryLocationPayload) => void;
}

export const useDeliverySocket = (role: 'customer' | 'partner' | 'admin', callbacks?: DeliverySocketCallbacks) => {
  useEffect(() => {
    // Note: Connection management (socketService.connect/disconnect) is exclusively handled by App.tsx
    
    if (callbacks?.onAssigned) socketService.onDeliveryAssigned(callbacks.onAssigned);
    if (callbacks?.onStatus) socketService.onDeliveryStatus(callbacks.onStatus);
    if (callbacks?.onLocation) socketService.onDeliveryLocation(callbacks.onLocation);

    return () => {
      if (callbacks?.onAssigned) socketService.offDeliveryAssigned(callbacks.onAssigned);
      if (callbacks?.onStatus) socketService.offDeliveryStatus(callbacks.onStatus);
      // We need to implement offDeliveryLocation in socketService if missing, or use off
      if (callbacks?.onLocation) {
        // cast because socketService might not have offDeliveryLocation yet
        (socketService as any).socket?.off('delivery:location', callbacks.onLocation);
      }
    };
  }, [role, callbacks]);
};
