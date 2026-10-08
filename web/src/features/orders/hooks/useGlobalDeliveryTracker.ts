import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { socketService } from '@/services/socket';
import {
  selectLiveTracking,
  setLiveTrackingOrder,
  updateLiveTrackingLocation,
  updateLiveTrackingPartner,
  addLiveTrackingChatMessage
} from '../orderSlice';
import { estimateStraightLineETA, calculateDistance } from '@/core/utils/location';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload, OrderChatMessage } from '../../../../core/types/socket.events';
import { selectOrders } from '../orderSlice';

export const FALLBACK_RESTAURANT = { lat: 12.9716, lng: 77.5946 };
export const FALLBACK_CUSTOMER = { lat: 12.9916, lng: 77.6146 };

export const activeStatuses = [
  'pending_owner',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'awaiting_partner',
  'partner_assigned',
  'picked_up',
  'out_for_delivery',
  'nearby'
];

export const useGlobalDeliveryTracker = () => {
  const dispatch = useAppDispatch();
  const liveTracking = useAppSelector(selectLiveTracking);
  const orders = useAppSelector(selectOrders);

  // 1. Detect active order and start tracking
  useEffect(() => {
    // Find the first order that is active
    const activeOrder = orders.find(o => activeStatuses.includes(o.status));

    if (activeOrder) {
      dispatch(setLiveTrackingOrder({ orderId: activeOrder.id, status: activeOrder.status }));
    }
  }, [orders, dispatch]);

  // 2. Manage Socket connection for the active order
  useEffect(() => {
    if (!liveTracking || !socketService.isConnected) return;

    const orderId = liveTracking.orderId;
    socketService.joinOrderRoom(orderId);

    const handleAssigned = (payload: DeliveryAssignedPayload) => {
      if (payload.orderId === orderId) {
        dispatch(updateLiveTrackingPartner({
          id: payload.partnerId,
          name: payload.partnerName,
          phone: payload.partnerPhone,
          vehicleType: 'bike',
          currentLocation: FALLBACK_RESTAURANT,
          status: payload.status,
          rating: 4.8,
          completedDeliveries: 420
        }));
        dispatch(setLiveTrackingOrder({ orderId, status: payload.status }));
      }
    };

    const handleStatus = (payload: DeliveryStatusPayload) => {
      if (payload.orderId === orderId) {
        dispatch(setLiveTrackingOrder({ orderId, status: payload.status }));
      }
    };

    const handleLocation = (payload: DeliveryLocationPayload) => {
      if (payload.orderId === orderId) {
        const eta = estimateStraightLineETA(payload.location, FALLBACK_CUSTOMER);
        const dist = calculateDistance(payload.location, FALLBACK_CUSTOMER);
        dispatch(updateLiveTrackingLocation({ location: payload.location, etaSeconds: eta, distance: dist }));
      }
    };

    const handleChatMessage = (msg: OrderChatMessage) => {
      if (msg.orderId === orderId) {
        dispatch(addLiveTrackingChatMessage({ message: msg, isChatOpen: false }));
      }
    };

    socketService.onDeliveryAssigned(handleAssigned);
    socketService.onDeliveryStatus(handleStatus);
    socketService.onDeliveryLocation(handleLocation);
    socketService.onOrderChatMessage(handleChatMessage);

    return () => {
      socketService.offDeliveryAssigned(handleAssigned);
      socketService.offDeliveryStatus(handleStatus);
      socketService.offDeliveryLocation(handleLocation);
      socketService.offOrderChatMessage(handleChatMessage);
    };
  }, [liveTracking?.orderId, dispatch]);

  return liveTracking;
};
