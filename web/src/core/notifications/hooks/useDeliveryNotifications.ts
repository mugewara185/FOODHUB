import { useAppDispatch } from '../../../app/store/hooks';
import { useDeliverySocket } from '../../../features/deliveryPartner/hooks/useDeliverySocket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload } from '../../../core/types/socket.events';
import { useEffect } from 'react';
import { socketService } from '@/services/socket';

type NotificationRole = 'customer' | 'partner' | 'admin' | 'owner';

export const useDeliveryNotifications = (role: NotificationRole) => {
  // Phase 6: Notification generation is now owned by the backend.
  // The global App.tsx listener handles the canonical 'notification' Socket.IO event.
  // We no longer synthesize notifications from raw domain events here.

  useDeliverySocket(role, {
    onAssigned: (payload: DeliveryAssignedPayload) => {
      // Reserved for operational tracking side-effects, not notifications.
    },
    onStatus: (payload: DeliveryStatusPayload) => {
      // Reserved for operational tracking side-effects, not notifications.
    }
  });

  useEffect(() => {
    // Legacy frontend-driven notifications removed.
    // The backend now persists and emits proper 'notification' events.
  }, [role]);
};
