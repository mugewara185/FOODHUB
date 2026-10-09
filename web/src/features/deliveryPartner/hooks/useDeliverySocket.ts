import { useEffect, useState, useRef } from 'react';
import { socketService } from '../../../services/socket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '../../../core/types/socket.events';

interface DeliverySocketCallbacks {
  onAssigned?: (payload: DeliveryAssignedPayload) => void;
  onStatus?: (payload: DeliveryStatusPayload) => void;
  onLocation?: (payload: DeliveryLocationPayload) => void;
}

export const useDeliverySocket = (role: 'customer' | 'partner' | 'admin' | 'owner', callbacks?: DeliverySocketCallbacks) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  useEffect(() => {
    // 1. Read current state synchronously
    setConnectionStatus(socketService.isConnected ? 'connected' : 'disconnected');
    
    // 2. Subscribe to transitions
    const handleConnectionChange = (status: 'connected' | 'reconnecting' | 'disconnected') => {
      setConnectionStatus(status);
    };

    socketService.onConnectionChange(handleConnectionChange);

    return () => {
      socketService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const handleAssigned = (payload: DeliveryAssignedPayload) => callbacksRef.current?.onAssigned?.(payload);
    const handleStatus = (payload: DeliveryStatusPayload) => callbacksRef.current?.onStatus?.(payload);
    const handleLocation = (payload: DeliveryLocationPayload) => callbacksRef.current?.onLocation?.(payload);

    socketService.onDeliveryAssigned(handleAssigned);
    socketService.onDeliveryStatus(handleStatus);
    socketService.onDeliveryLocation(handleLocation);

    // If role is admin, we also explicitly join the admin fleet room
    if (role === 'admin') {
      socketService.joinAdminFleet();
    }

    return () => {
      socketService.offDeliveryAssigned(handleAssigned);
      socketService.offDeliveryStatus(handleStatus);
      socketService.offDeliveryLocation(handleLocation);
      
      if (role === 'admin') {
        socketService.leaveAdminFleet();
      }
    };
  }, [role, connectionStatus]);

  return { connectionStatus };
};
