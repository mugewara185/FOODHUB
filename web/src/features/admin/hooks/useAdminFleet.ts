import { useState, useEffect } from 'react';
import type { DeliveryPartner } from '../../../core/types';
import { useDeliverySocket } from '../../deliveryPartner/hooks/useDeliverySocket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '../../../core/types/socket.events';
import { api } from '../../../core/utils/api';

export const useAdminFleet = () => {
  const [fleet, setFleet] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial Snapshot Fetch
  useEffect(() => {
    let mounted = true;
    
    const fetchFleet = async () => {
      try {
        setLoading(true);
        // GET /api/delivery/fleet returns activeDeliveries, partners, risks
        const response = await api.get('/delivery/fleet');
        
        if (mounted && response.data?.success) {
          // Fallback map in case the backend hasn't updated its output structure,
          // though we did fix the backend to return exactly what we need.
          setFleet(response.data.data.partners as DeliveryPartner[]);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to fetch fleet snapshot');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFleet();
    return () => { mounted = false; };
  }, []);

  // Socket Subscription
  const { connectionStatus } = useDeliverySocket('admin', {
    onAssigned: (payload: DeliveryAssignedPayload) => {
      setFleet(prev => prev.map(partner => {
        if (partner.id === payload.partnerId) {
          return {
            ...partner,
            status: 'assigned',
            currentAssignedDelivery: payload.deliveryId
          };
        }
        return partner;
      }));
    },
    onLocation: (payload: DeliveryLocationPayload) => {
      setFleet(prev => prev.map(partner => {
        if (partner.id === payload.partnerId) {
          return {
            ...partner,
            currentLocation: payload.location
          };
        }
        return partner;
      }));
    },
    onStatus: (payload: DeliveryStatusPayload) => {
      setFleet(prev => prev.map(partner => {
        if (partner.id === payload.partnerId) {
          // If the delivery is complete, reset the partner to available
          if (payload.status === 'delivered' || payload.status === 'cancelled') {
            return {
              ...partner,
              status: 'available',
              currentAssignedDelivery: undefined
            };
          }
          // Otherwise simply update their status
          return {
            ...partner,
            status: payload.status as DeliveryPartner['status']
          };
        }
        return partner;
      }));
    }
  });

  return {
    fleet,
    connectionStatus,
    loading,
    error
  };
};
