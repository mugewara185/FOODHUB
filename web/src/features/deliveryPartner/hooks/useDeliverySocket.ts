import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { updateAssignmentStatus } from '../deliveryPartnerSlice';
import { socketService } from '../../../services/socket';

export const useDeliverySocket = () => {
  const isOnline = useAppSelector(state => state.deliveryPartner.isOnline);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isOnline) {
      socketService.connect('partner-123', 'partner');
      // Subscribe to all incoming events
      socketService.onDeliveryStatus((payload) => {
        dispatch(updateAssignmentStatus(payload.status as any));
      });
    } else {
      socketService.disconnect();
    }
    return () => {
      socketService.offDeliveryStatus();
    };
  }, [isOnline, dispatch]);
};
