import { useEffect } from 'react';
import { useAppDispatch } from '../../../app/store/hooks';
import { socketService } from '../../../services/socket';
import { orderStatusChanged, orderReceived } from '../ownerOrderSlice';

export function useOwnerSocket() {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
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
  }, [dispatch]);
}
