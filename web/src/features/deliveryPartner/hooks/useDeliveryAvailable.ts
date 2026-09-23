import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../app/store';
import { socketService } from '../../../services/socket';
import { assignmentBroadcastReceived } from '../deliveryPartnerSlice';

export const useDeliveryAvailable = () => {
  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    setIsConnected(socketService.isConnected);
    const handleConnection = (status: 'connected' | 'reconnecting' | 'disconnected') => {
      setIsConnected(status === 'connected');
    };
    socketService.onConnectionChange(handleConnection);
    return () => socketService.offConnectionChange(handleConnection);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const handleDeliveryAvailable = (payload: any) => {
      dispatch(assignmentBroadcastReceived(payload));
    };

    socketService.onDeliveryAvailable(handleDeliveryAvailable);

    return () => {
      socketService.offDeliveryAvailable(handleDeliveryAvailable);
    };
  }, [isConnected, dispatch]);
};
