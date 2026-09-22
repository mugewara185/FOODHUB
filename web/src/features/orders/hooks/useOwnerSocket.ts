import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../app/store/hooks';
import { socketService } from '../../../services/socket';
import { orderStatusChanged, orderReceived } from '../ownerOrderSlice';

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

    socketService.onOrderStatusChanged(handleChanged);
    socketService.onOrderNew(handleNew);
    
    return () => {
      socketService.offOrderStatusChanged(handleChanged);
      socketService.offOrderNew(handleNew);
    };
  }, [dispatch, isConnected]);
}
