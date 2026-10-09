import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../app/store/hooks';
import { socketService } from '../../../services/socket';
import { orderStatusChanged, orderReceived, deliveryStatusChanged } from '../ownerOrderSlice';

export function useOwnerSocket() {
  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    setIsConnected(socketService.isConnected);
    console.log('[useOwnerSocket] mounting. isConnected =', socketService.isConnected);
    const handleConnection = (status: string) => {
      setIsConnected(status === 'connected');
    };
    socketService.onConnectionChange(handleConnection);
    return () => socketService.offConnectionChange(handleConnection);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const handleChanged = (payload: any) => {
      dispatch(orderStatusChanged(payload));
    };
    const handleNew = (payload: any) => {
      dispatch(orderReceived(payload));
    };
    const handleDeliveryStatus = (payload: any) => {
      dispatch(deliveryStatusChanged({ orderId: payload.orderId, status: payload.status }));
    };

    socketService.onOrderStatusChanged(handleChanged);
    socketService.onOrderNew(handleNew);
    socketService.onDeliveryStatusChanged(handleDeliveryStatus);
    
    return () => {
      socketService.offOrderStatusChanged(handleChanged);
      socketService.offOrderNew(handleNew);
      socketService.offDeliveryStatusChanged(handleDeliveryStatus);
    };
  }, [dispatch, isConnected]);
}
