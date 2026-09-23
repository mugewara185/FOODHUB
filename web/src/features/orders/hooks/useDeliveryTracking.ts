import { useState, useEffect } from 'react';
import type { Coordinates, DeliveryPartner } from '@/core/types';
import { useDeliverySocket } from '@/features/deliveryPartner/hooks/useDeliverySocket';
import { estimateStraightLineETA, calculateDistance } from '@/core/utils/location';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '@/core/types/socket.events';
import { socketService } from '@/services/socket';

export const useDeliveryTracking = (orderId: string, initialStatus: string, restaurantLocation: Coordinates, customerLocation: Coordinates) => {
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<string>(initialStatus);
  const [etaSeconds, setEtaSeconds] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  useDeliverySocket('customer', {
    onAssigned: (payload: DeliveryAssignedPayload) => {
      if (payload.orderId === orderId) {
        setPartner({
          id: payload.partnerId,
          name: payload.partnerName,
          phone: payload.partnerPhone,
          vehicleType: 'bike',
          currentLocation: restaurantLocation,
          status: payload.status,
          rating: 4.8, // Mocked for now until added to payload
          completedDeliveries: 420
        });
        setStatus(payload.status);
      }
    },
    onStatus: (payload: DeliveryStatusPayload) => {
      if (payload.orderId === orderId) {
        setStatus(payload.status);
      }
    },
    onLocation: (payload: DeliveryLocationPayload) => {
      if (payload.orderId === orderId) {
        setLocation(payload.location);
        
        // Use straight-line ETA to customer destination
        const eta = estimateStraightLineETA(payload.location, customerLocation);
        const dist = calculateDistance(payload.location, customerLocation);
        
        setEtaSeconds(eta);
        setDistance(dist);
      }
    }
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    setIsConnected(socketService.isConnected);
    const handleConnection = (status: "connected" | "reconnecting" | "disconnected") => {
      setIsConnected(status === 'connected');
    };
    socketService.onConnectionChange(handleConnection);
    return () => socketService.offConnectionChange(handleConnection);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    socketService.joinOrderRoom(orderId);

    const handleOrderStatusChanged = (payload: { orderId: string; status: string }) => {
      if (payload.orderId === orderId) {
        setStatus(payload.status);
      }
    };

    socketService.onOrderStatusChanged(handleOrderStatusChanged);

    return () => {
      socketService.offOrderStatusChanged(handleOrderStatusChanged);
      socketService.unsubscribeFromOrder(orderId);
    };
  }, [orderId, isConnected]);

  return { partner, location, status, etaSeconds, distance };
};
