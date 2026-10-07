import { useAppSelector } from '../../../../app/store/hooks';
import { selectLiveTracking } from '../orderSlice';

export const useDeliveryTracking = () => {
  const liveTracking = useAppSelector(selectLiveTracking);
  return liveTracking || {
    partner: null,
    location: null,
    status: 'created',
    etaSeconds: 0,
    distance: 0,
    chatMessages: [],
    unreadCount: 0
  };
};
