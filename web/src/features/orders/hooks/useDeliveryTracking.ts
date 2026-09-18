import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket';
import type { Coordinates, DeliveryPartner } from '@/core/types';
import { useAppSelector } from '@/app/store';

export const useDeliveryTracking = (orderId: string, initialStatus: string, restaurantLocation: Coordinates, customerLocation: Coordinates) => {
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<string>(initialStatus);
  const [etaSeconds, setEtaSeconds] = useState<number>(1800);
  const [distance, setDistance] = useState<number>(5000);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    const isMock = import.meta.env.VITE_DATA_SOURCE === 'mock' || !import.meta.env.VITE_DATA_SOURCE;
    if (isMock) {
      let currentLat = restaurantLocation.lat;
      let currentLng = restaurantLocation.lng;
      let currentEta = 1800;
      let step = 0;
      setPartner({
        id: 'mock-partner-1', name: 'Rahul Mock', phone: '+91 9876543210', vehicleType: 'bike',
        currentLocation: { lat: currentLat, lng: currentLng }, status: 'on_delivery', rating: 4.8, completedDeliveries: 420
      });
      setStatus('picked_up');
      setLocation({ lat: currentLat, lng: currentLng });
      const latStep = (customerLocation.lat - restaurantLocation.lat) / 30;
      const lngStep = (customerLocation.lng - restaurantLocation.lng) / 30;
      const interval = setInterval(() => {
        if (step >= 30) {
          setStatus('delivered'); setEtaSeconds(0); setLocation({ ...customerLocation }); clearInterval(interval); return;
        }
        currentLat += latStep; currentLng += lngStep; currentEta = Math.max(0, currentEta - 60);
        setLocation({ lat: currentLat, lng: currentLng }); setEtaSeconds(currentEta);
        if (step === 15) setStatus('on_the_way');
        if (step === 25) setStatus('nearby');
        step++;
      }, 3000);
      return () => clearInterval(interval);
    } else {
      if (user) socketService.connect(user.id, user.role[0]);
      else socketService.connect();
      
      socketService.subscribeToOrder(orderId, (data) => {});
      socketService.onAdminFleetEvent('delivery:assigned', (data: any) => {
        if (data.orderId === orderId) { setPartner(data.partner); if (data.status) setStatus(data.status); }
      });
      socketService.onAdminFleetEvent('delivery:location', (data: any) => {
        if (data.orderId === orderId) {
          setLocation({ lat: data.location.lat, lng: data.location.lng });
          setEtaSeconds(data.etaSeconds || 0); setDistance(data.distanceRemainingMeters || 0);
          if (data.status) setStatus(data.status);
        }
      });
      socketService.onAdminFleetEvent('delivery:status', (data: any) => {
        if (data.orderId === orderId) setStatus(data.status);
      });
      return () => { socketService.unsubscribeFromOrder(orderId); };
    }
  }, [orderId, restaurantLocation, customerLocation, user]);

  return { partner, location, status, etaSeconds, distance };
};
