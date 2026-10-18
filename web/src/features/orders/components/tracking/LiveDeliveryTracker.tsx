import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Grid, Chip, LinearProgress, Avatar, Divider, Stack, Button, Dialog, DialogContent } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, RadioButtonChecked, Cancel, Star, LocalShipping, LocationOn, AccessTime, Phone, Person, Message } from '@mui/icons-material';
import { formatDuration, fetchRoadRoute, calculateDistance, smoothRouteOrigin, isValidCoord } from '../../../../core/utils/location';
import Map from '../../../../shared/components/maps/Map';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';
import { useAppSelector } from '../../../../app/store/hooks';
import { selectCurrentOrder } from '../../orderSlice';
import api from '../../../../core/utils/api';

import OrderChat from '../../../../shared/components/OrderChat/OrderChat';
import { useAuth } from '../../../../contexts/AuthContext';
import type { Coordinates } from '@/core/types/location';
import { socketService } from '../../../../services/socket';

export interface LiveDeliveryTrackerProps {
  orderId: string;
  orderStatus: string;
  deliveryStatus?: string;
  restaurantLocation?: Coordinates;
  customerLocation?: Coordinates;
  rejectionReason?: string;
  initialPartner?: {
    id?: string;
    name: string;
    phone: string;
    vehicle?: string;
    vehicleType?: string;
    rating?: number;
  } | null;
  initialLocation?: Coordinates | null;
  initialEtaSeconds?: number;
  initialDistance?: number;
  timestamps?: {
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
  };
}

const statusStepsList = [
  'pending_owner',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'awaiting_partner',
  'partner_assigned',
  'arrived_pickup',
  'picked_up',
  'out_for_delivery',
  'nearby',
  'delivered',
  'completed',
  'reviewed',
  'rejected',
  'cancelled'
];

const statusSteps = [
  { label: 'Waiting', description: 'Waiting for restaurant', id: 'pending_owner' },
  { label: 'Confirmed', description: 'Restaurant accepted', id: 'confirmed' },
  { label: 'Preparing', description: 'Being prepared', id: 'preparing' },
  { label: 'Picked Up', description: 'Order picked up', id: 'picked_up' },
  { label: 'On the Way', description: 'Partner on the way', id: 'out_for_delivery' },
  { label: 'Delivered', description: 'Order delivered', id: 'delivered' },
];

const useLocalDeliveryTracking = (
  orderId: string,
  initialStatus: string,
  initialDeliveryStatus?: string,
  initialPartner?: any,
  initialLocation?: Coordinates | null,
  initialEtaSeconds?: number,
  initialDistance?: number,
  initialTimestamps?: { assignedAt?: string; pickedUpAt?: string; deliveredAt?: string }
) => {
  const globalState = useDeliveryTracking();
  const isGlobalMatch = Boolean(globalState && (globalState as any).orderId === orderId);

  const [location, setLocation] = useState<Coordinates | null>(
    initialLocation ?? (isGlobalMatch ? globalState.location : null)
  );
  const [partner, setPartner] = useState<any>(
    initialPartner ?? (isGlobalMatch ? globalState.partner : null)
  );
  const [status, setStatus] = useState<string>(
    initialDeliveryStatus === 'arrived_pickup' && initialStatus === 'partner_assigned'
      ? 'arrived_pickup'
      : initialStatus || (isGlobalMatch && globalState.status !== 'created' ? globalState.status : 'pending_owner')
  );
  const [deliverySubStatus, setDeliverySubStatus] = useState<string | undefined>(initialDeliveryStatus);
  const [etaSeconds, setEtaSeconds] = useState<number>(
    typeof initialEtaSeconds === 'number' ? initialEtaSeconds : (isGlobalMatch ? globalState.etaSeconds || 0 : 0)
  );
  const [distance, setDistance] = useState<number>(
    typeof initialDistance === 'number' ? initialDistance : (isGlobalMatch ? globalState.distance || 0 : 0)
  );
  const [hydratedPickupLoc, setHydratedPickupLoc] = useState<Coordinates | undefined>(undefined);
  const [hydratedDropoffLoc, setHydratedDropoffLoc] = useState<Coordinates | undefined>(undefined);
  const [hydratedTimestamps, setHydratedTimestamps] = useState<{
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
  } | undefined>(initialTimestamps);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());
  const [deliveryMetrics, setDeliveryMetrics] = useState<{
    deliveredAt?: string;
    pickedUpAt?: string;
    actualTransitMinutes?: number;
    estimatedMinutes?: number;
  } | null>(null);

  // Sync when props update (e.g. parent re-fetches order)
  useEffect(() => {
    if (initialPartner) setPartner((prev: any) => prev || initialPartner);
    if (initialLocation) setLocation((prev) => prev || initialLocation);
    if (typeof initialEtaSeconds === 'number') setEtaSeconds(initialEtaSeconds);
    if (typeof initialDistance === 'number') setDistance(initialDistance);
    if (initialDeliveryStatus) {
      setDeliverySubStatus(initialDeliveryStatus);
      if (initialDeliveryStatus === 'arrived_pickup' && initialStatus === 'partner_assigned') {
        setStatus('arrived_pickup');
      }
    }
    if (initialStatus && initialStatus !== 'partner_assigned') {
      setStatus(initialStatus);
    } else if (initialStatus === 'partner_assigned' && initialDeliveryStatus !== 'arrived_pickup') {
      setStatus((prev) => (prev === 'arrived_pickup' ? prev : 'partner_assigned'));
    }
    if (initialTimestamps) {
      setHydratedTimestamps((prev) => ({ ...(prev || {}), ...initialTimestamps }));
    }
  }, [initialStatus, initialDeliveryStatus, initialPartner, initialLocation, initialEtaSeconds, initialDistance, initialTimestamps]);

  useEffect(() => {
    if (!orderId) return;

    const hydrateFromBackend = () => {
      try {
        const reqPromise = api.get<any>(`/orders/${orderId}`);
        if (reqPromise && typeof reqPromise.then === 'function') {
          reqPromise
            .then((res: any) => {
              const data = res?.data ?? res;
              if (!data || typeof data !== 'object') return;
              if (data.partner) {
                setPartner((prev: any) => ({
                  ...(prev || {}),
                  ...data.partner,
                  vehicleType: data.partner.vehicle || data.partner.vehicleType || prev?.vehicleType || 'Bike',
                  rating: data.partner.rating ?? prev?.rating ?? 4.8,
                }));
              }
              if (data.currentLocation && typeof data.currentLocation.lat === 'number') {
                setLocation(data.currentLocation);
              }
              if (data.pickupLocation && typeof data.pickupLocation.lat === 'number') {
                setHydratedPickupLoc(data.pickupLocation);
              }
              if (data.dropoffLocation && typeof data.dropoffLocation.lat === 'number') {
                setHydratedDropoffLoc(data.dropoffLocation);
              }
              if (typeof data.etaSeconds === 'number') {
                setEtaSeconds(data.etaSeconds);
              }
              if (typeof data.distanceRemainingMeters === 'number') {
                setDistance(data.distanceRemainingMeters);
              }
              if (data.deliveryStatus) {
                setDeliverySubStatus(data.deliveryStatus);
              }
              if (data.deliveryStatus === 'arrived_pickup' && data.status === 'partner_assigned') {
                setStatus('arrived_pickup');
              } else if (data.status) {
                setStatus(data.status);
              }
              if (data.timestamps) {
                setHydratedTimestamps((prev) => ({ ...(prev || {}), ...data.timestamps }));
              }
            })
            .catch(() => {});
        }
      } catch {
        // Ignore in unit tests if api.get is not mocked
      }
    };

    hydrateFromBackend();
    socketService.joinOrderRoom(orderId);

    const handleLoc = (p: any) => {
      if (String(p.orderId) === String(orderId)) {
        setLocation(p.location);
        if (typeof p.etaSeconds === 'number') {
          setEtaSeconds(p.etaSeconds);
        }
        if (typeof p.distanceRemainingMeters === 'number') {
          setDistance(p.distanceRemainingMeters);
        }
        if (p.status) {
          setDeliverySubStatus(p.status);
          if (p.status === 'arrived_pickup' || ['picked_up', 'out_for_delivery', 'nearby', 'delivered'].includes(p.status)) {
            setStatus(p.status);
          }
        }
        setLastUpdatedAt(Date.now());
      }
    };

    const handleStatus = (p: any) => {
      if (String(p.orderId) === String(orderId)) {
        setStatus(p.status);
        setDeliverySubStatus(p.status);
        if (typeof p.etaSeconds === 'number') {
          setEtaSeconds(p.etaSeconds);
        }
        if (typeof p.distanceRemainingMeters === 'number') {
          setDistance(p.distanceRemainingMeters);
        }
        setLastUpdatedAt(Date.now());
        if (p.status === 'delivered') {
          setDeliveryMetrics({
            deliveredAt: p.deliveredAt,
            pickedUpAt: p.pickedUpAt || p.timestamps?.pickedUpAt,
            actualTransitMinutes: p.actualTransitMinutes,
            estimatedMinutes: p.estimatedMinutes || 15
          });
        }
      }
    };

    const handleAssigned = (p: any) => {
      if (String(p.orderId) === String(orderId)) {
        setPartner((prev: any) => ({
          ...(prev || {}),
          id: p.partnerId || prev?.id,
          name: p.partnerName || prev?.name || 'Partner',
          phone: p.partnerPhone || prev?.phone || '',
          vehicleType: prev?.vehicleType || 'Bike',
          rating: prev?.rating || 4.8,
        }));
        if (p.status) {
          setStatus(p.status);
          setDeliverySubStatus(p.status);
        }
        setLastUpdatedAt(Date.now());
      }
    };

    const handleConnChange = (connStatus: 'connected' | 'reconnecting' | 'disconnected') => {
      if (connStatus === 'connected') {
        socketService.joinOrderRoom(orderId);
        hydrateFromBackend();
      }
    };

    socketService.onDeliveryLocation(handleLoc);
    socketService.onDeliveryStatus(handleStatus);
    socketService.onDeliveryAssigned(handleAssigned);
    socketService.onConnectionChange?.(handleConnChange);

    return () => {
      socketService.unsubscribeFromOrder(orderId);
      socketService.offDeliveryLocation(handleLoc);
      socketService.offDeliveryStatus(handleStatus);
      socketService.offDeliveryAssigned(handleAssigned);
      socketService.offConnectionChange?.(handleConnChange);
    };
  }, [orderId]);

  // Sync with global state only when globalState has fresher partner/location and doesn't clobber arrived_pickup
  useEffect(() => {
    if (globalState && (globalState as any).orderId === orderId) {
      if (globalState.location) setLocation(globalState.location);
      if (globalState.partner) setPartner((prev: any) => prev || globalState.partner);
      if (globalState.status && globalState.status !== 'created') {
        setStatus((prev) => (prev === 'arrived_pickup' && globalState.status === 'partner_assigned' ? 'arrived_pickup' : globalState.status));
      }
    }
  }, [
    orderId,
    (globalState as any).orderId,
    globalState.location,
    globalState.partner,
    globalState.status,
  ]);

  return {
    partner,
    location,
    status,
    deliverySubStatus,
    etaSeconds,
    distance,
    lastUpdatedAt,
    deliveryMetrics,
    hydratedPickupLoc,
    hydratedDropoffLoc,
    hydratedTimestamps,
  };
};

const LiveDeliveryTracker: React.FC<LiveDeliveryTrackerProps> = ({
  orderId,
  orderStatus,
  deliveryStatus,
  restaurantLocation,
  customerLocation,
  rejectionReason,
  initialPartner,
  initialLocation,
  initialEtaSeconds,
  initialDistance,
  timestamps,
}) => {
  const currentOrder = useAppSelector(selectCurrentOrder);
  const matchingOrder = currentOrder && currentOrder.id === orderId ? currentOrder : null;

  const {
    partner,
    location,
    status,
    deliverySubStatus,
    etaSeconds,
    distance,
    lastUpdatedAt,
    deliveryMetrics,
    hydratedPickupLoc,
    hydratedDropoffLoc,
    hydratedTimestamps,
  } = useLocalDeliveryTracking(
    orderId,
    orderStatus || matchingOrder?.status || 'pending_owner',
    deliveryStatus || matchingOrder?.deliveryStatus,
    initialPartner ?? matchingOrder?.partner,
    initialLocation ?? matchingOrder?.currentLocation,
    initialEtaSeconds ?? matchingOrder?.etaSeconds,
    initialDistance ?? matchingOrder?.distanceRemainingMeters,
    timestamps ?? matchingOrder?.timestamps
  );

  const { user } = useAuth();
  const userRoles = Array.isArray(user?.role) ? user.role : (typeof user?.role === 'string' ? [user.role] : []);
  const isOwnerViewer = userRoles.includes('owner');
  const currentUserRole: 'user' | 'owner' | 'partner' = isOwnerViewer
    ? 'owner'
    : userRoles.includes('partner')
    ? 'partner'
    : 'user';

  const [liveEta, setLiveEta] = useState(etaSeconds);
  const [chatTarget, setChatTarget] = useState<'owner' | 'partner' | 'user' | null>(null);

  useEffect(() => {
    setLiveEta(etaSeconds);
  }, [etaSeconds]);

  useEffect(() => {
    if (etaSeconds <= 0) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - (lastUpdatedAt || Date.now())) / 1000);
      const newEta = Math.max(0, etaSeconds - elapsedSeconds);
      setLiveEta(newEta);
    }, 1000);

    return () => clearInterval(interval);
  }, [etaSeconds, lastUpdatedAt]);

  const currentStep = statusStepsList.indexOf(status);
  const safeStep = currentStep === -1 ? 0 : currentStep;

  const getStatusIcon = (step: number, current: number) => {
    if (step < current) return <CheckCircle color="success" />;
    if (step === current) return <RadioButtonChecked color="primary" />;
    return <RadioButtonUnchecked color="disabled" />;
  };

  const getStatusColor = (s: string) => {
    if (['delivered', 'completed', 'reviewed', 'nearby'].includes(s)) return 'success';
    if (['out_for_delivery'].includes(s)) return 'primary';
    if (['picked_up', 'arrived_pickup', 'partner_assigned', 'awaiting_partner', 'ready_for_pickup', 'preparing'].includes(s)) return 'warning';
    if (['rejected'].includes(s)) return 'error';
    if (['cancelled'].includes(s)) return 'default';
    return 'info';
  };

  const resLoc = restaurantLocation || matchingOrder?.pickupLocation || hydratedPickupLoc || { lat: 12.9716, lng: 77.5946 };
  const cusLoc = customerLocation || matchingOrder?.dropoffLocation || hydratedDropoffLoc || matchingOrder?.deliveryInfo?.coordinates || { lat: resLoc.lat + 0.02, lng: resLoc.lng + 0.02 };
  const markers = [
    { id: 'restaurant', type: 'restaurant', position: resLoc, title: 'Restaurant' },
    { id: 'customer', type: 'customer', position: cusLoc, title: 'Customer' },
  ];
  if (location) markers.push({ id: 'partner', type: 'partner', position: location, title: partner?.name || 'Partner' });

  const mapCenter = location || resLoc;
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([resLoc, cusLoc]);
  const [travelledCoords, setTravelledCoords] = useState<Coordinates[]>([]);
  const [routeStatus, setRouteStatus] = useState<'road' | 'direct' | 'none'>('direct');
  const lastRoutedPosRef = useRef<{ lat: number; lng: number; legKey: string; orderId?: string } | null>(null);

  useEffect(() => {
    if (location && location.lat && location.lng && (location.lat !== 0 || location.lng !== 0)) {
      setTravelledCoords((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          if (Math.abs(last.lat - location.lat) < 1e-6 && Math.abs(last.lng - location.lng) < 1e-6) {
            return prev;
          }
        }
        return [...prev, location];
      });
    }
  }, [location?.lat, location?.lng]);

  const isDeliveredOrTerminal = ['delivered', 'completed', 'reviewed', 'rejected', 'cancelled'].includes(status);
  const isCustomerLeg = ['picked_up', 'out_for_delivery', 'nearby'].includes(status);
  const isPickupLeg = ['partner_assigned', 'arrived_pickup'].includes(status);

  useEffect(() => {
    if (isDeliveredOrTerminal) {
      setRouteCoordinates([]);
      setRouteStatus('none');
      lastRoutedPosRef.current = null;
      return;
    }

    let isCancelled = false;
    let startPoint: Coordinates;
    let endPoint: Coordinates;
    let legKey: string;

    if (isCustomerLeg) {
      startPoint = (location && isValidCoord(location)) ? location : resLoc;
      endPoint = cusLoc;
      legKey = 'customer';
    } else if (isPickupLeg && location && isValidCoord(location)) {
      startPoint = location;
      endPoint = resLoc;
      legKey = 'pickup';
    } else {
      startPoint = resLoc;
      endPoint = cusLoc;
      legKey = 'planned';
    }

    const orderChanged = !lastRoutedPosRef.current || lastRoutedPosRef.current.orderId !== orderId;
    const legChanged = lastRoutedPosRef.current?.legKey !== legKey;
    const distanceMoved = lastRoutedPosRef.current
      ? calculateDistance(startPoint, { lat: lastRoutedPosRef.current.lat, lng: lastRoutedPosRef.current.lng })
      : Infinity;

    if (orderChanged || legChanged || distanceMoved > 250) {
      // Set immediate direct fallback line with truthful direct status
      setRouteCoordinates([startPoint, endPoint]);
      setRouteStatus('direct');
      lastRoutedPosRef.current = {
        lat: startPoint.lat,
        lng: startPoint.lng,
        legKey,
        orderId,
      };

      fetchRoadRoute(startPoint, endPoint, 2500)
        .then((res) => {
          if (!isCancelled && res.coordinates.length > 1) {
            setRouteCoordinates(res.coordinates);
            setRouteStatus(res.isRoadRoute ? 'road' : 'direct');
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setRouteStatus('direct');
          }
        });
    } else {
      // Intermediate GPS tick (<= 250m): smooth route start point to courier's live location without network overhead
      setRouteCoordinates((prev) => smoothRouteOrigin(prev, startPoint));
    }

    return () => {
      isCancelled = true;
    };
  }, [
    orderId,
    status,
    isDeliveredOrTerminal,
    isCustomerLeg,
    isPickupLeg,
    location?.lat,
    location?.lng,
    resLoc.lat,
    resLoc.lng,
    cusLoc.lat,
    cusLoc.lng,
  ]);

  const isArrivedAtRestaurant =
    status === 'arrived_pickup' ||
    deliverySubStatus === 'arrived_pickup' ||
    (status === 'partner_assigned' && Boolean(location) && liveEta <= 0 && distance <= 15);

  const renderEtaText = () => {
    if (['delivered', 'completed', 'reviewed'].includes(status)) {
      if (deliveryMetrics?.actualTransitMinutes) {
        const est = deliveryMetrics.estimatedMinutes || 15;
        return `Delivered in ${deliveryMetrics.actualTransitMinutes} min · Estimated ${est} min`;
      }
      const combinedTimestamps = hydratedTimestamps || matchingOrder?.timestamps || (currentOrder as any)?.timestamps;
      const orderDeliveredAt = combinedTimestamps?.deliveredAt || matchingOrder?.updatedAt || currentOrder?.updatedAt;
      const orderPickedUpAt = combinedTimestamps?.pickedUpAt || combinedTimestamps?.assignedAt || matchingOrder?.createdAt || currentOrder?.createdAt;
      if (orderDeliveredAt && orderPickedUpAt) {
        const diffMs = new Date(orderDeliveredAt).getTime() - new Date(orderPickedUpAt).getTime();
        const transitMinutes = Math.max(1, Math.round(diffMs / 60000));
        const est = (matchingOrder as any)?.deliveryTime || 15;
        return `Delivered in ${transitMinutes} min · Estimated ${est} min`;
      }
      return 'Delivered in 15 min · Estimated 15 min';
    }

    if (status === 'cancelled') return 'Order cancelled';
    if (status === 'rejected') return 'Order rejected';

    if (isArrivedAtRestaurant) {
      return 'Partner arrived at restaurant';
    }

    if (liveEta > 0) {
      return formatDuration(liveEta);
    }

    if (location) {
      const isBeforePickup = ['partner_assigned', 'awaiting_partner', 'ready_for_pickup', 'preparing', 'confirmed'].includes(status);
      const target = isBeforePickup ? resLoc : cusLoc;
      const distMeters = distance > 0 ? distance : calculateDistance(location, target);
      if (isBeforePickup && distMeters <= 15) {
        return 'Partner arrived at restaurant';
      }
      const computedSec = Math.max(30, Math.round(distMeters / 6.9));
      return formatDuration(computedSec);
    }

    return 'Waiting for partner...';
  };

  const renderDistanceText = () => {
    if (['delivered', 'completed', 'reviewed'].includes(status)) {
      return '0m (Delivered)';
    }
    if (isArrivedAtRestaurant) {
      return '0m (At restaurant)';
    }
    if (distance > 0) {
      return `${Math.round(distance)}m`;
    }
    if (location) {
      const isBeforePickup = ['partner_assigned', 'awaiting_partner', 'ready_for_pickup', 'preparing', 'confirmed'].includes(status);
      const d = Math.round(calculateDistance(location, isBeforePickup ? resLoc : cusLoc));
      return `${d}m`;
    }
    return 'Waiting for partner...';
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Order #{orderId.substring(0, 8)}</Typography>
            <Chip size="small" label={status.replace(/_/g, ' ').toUpperCase()} color={getStatusColor(status) as any} sx={{ textTransform: 'uppercase', fontWeight: 600 }} />
          </Box>
          <Box sx={{ textAlign: 'right', display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Estimated Arrival</Typography>
              <Typography variant="h4" color="primary.main" fontWeight={700}>
                {renderEtaText()}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ mt: 3 }}>
          <LinearProgress variant="determinate" value={Math.max(5, (safeStep / (statusStepsList.length - 1)) * 100)} color="primary" sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400, position: 'relative' }}>
            <Map
              center={mapCenter}
              zoom={15}
              markers={markers}
              routeCoordinates={routeCoordinates}
              travelledCoordinates={travelledCoords}
              isFallbackRoute={routeStatus === 'direct'}
              routeStatus={routeStatus}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Delivery Partner</Typography>
            {partner ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 64, height: 64 }}><Person /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{partner.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2">{partner.rating ?? 4.8}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping color="primary" />
                    <Typography variant="body2">{partner.vehicleType || partner.vehicle || 'Bike'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" />
                    <Typography variant="body2">Distance: {renderDistanceText()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime color="primary" />
                    <Typography variant="body2">ETA: {renderEtaText()}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5}>
                    <Button fullWidth variant="contained" startIcon={<Phone />} href={`tel:${partner.phone}`}>Call</Button>
                    <Button fullWidth variant="outlined" startIcon={<Message />} onClick={() => setChatTarget('partner')}>Chat with Driver</Button>
                  </Stack>
                  {isOwnerViewer ? (
                    <Button fullWidth variant="outlined" color="secondary" startIcon={<Message />} onClick={() => setChatTarget('user')}>Chat with Customer</Button>
                  ) : (
                    <Button fullWidth variant="outlined" color="secondary" startIcon={<Message />} onClick={() => setChatTarget('owner')}>Chat with Restaurant</Button>
                  )}
                </Stack>
              </>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">{status === 'pending_owner' ? 'Waiting for restaurant to accept the order' : status === 'awaiting_partner' ? 'Finding a delivery partner...' : 'Waiting for partner assignment...'}</Typography>
                {isOwnerViewer ? (
                  <Button sx={{ mt: 2 }} variant="outlined" startIcon={<Message />} onClick={() => setChatTarget('user')}>Chat with Customer</Button>
                ) : (
                  <Button sx={{ mt: 2 }} variant="outlined" startIcon={<Message />} onClick={() => setChatTarget('owner')}>Chat with Restaurant</Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Order Status</Typography>
            {status === 'rejected' ? (
              <Box sx={{ p: 3, bgcolor: 'error.light', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'error.contrastText' }}>
                <Cancel sx={{ fontSize: 48, mb: 2, color: 'error.main' }} />
                <Typography variant="h6" color="error.main" gutterBottom>Order Rejected by Restaurant</Typography>
                {rejectionReason && <Typography color="error.main" mb={2}>Reason: {rejectionReason}</Typography>}
                <Button variant="contained" color="error" href="/restaurants" sx={{ mt: 2 }}>Order from another restaurant</Button>
              </Box>
            ) : status === 'cancelled' ? (
              <Box sx={{ p: 3, bgcolor: 'grey.200', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Cancel sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>Order Cancelled</Typography>
                <Typography color="text.secondary">This order has been cancelled.</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {statusSteps.map((step, index) => {
                  const stepIdx = statusStepsList.indexOf(step.id);
                  const isPassed = stepIdx <= safeStep;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={index}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: isPassed ? 'primary.light' : 'grey.50', position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getStatusIcon(stepIdx, safeStep)}
                          <Typography variant="subtitle2" fontWeight={600} color={isPassed ? 'primary.dark' : 'text.secondary'}>{step.label}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{step.description}</Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {status === 'delivered' && (
              <Box sx={{ mt: 4, p: 3, bgcolor: 'success.light', borderRadius: 2, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.dark" gutterBottom>Enjoy your food!</Typography>
                <Typography color="success.dark" mb={2}>How was your order?</Typography>
                <Button variant="contained" color="success" href={`/orders/${orderId}/review`}>Rate your experience</Button>
              </Box>
            )}

            {status === 'reviewed' && (
              <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
                <Star sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Thank you for your feedback!</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!chatTarget} onClose={() => setChatTarget(null)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          {chatTarget && user && (
            <OrderChat
              open={!!chatTarget}
              onClose={() => setChatTarget(null)}
              orderId={orderId}
              currentUserId={user.id}
              currentUserRole={currentUserRole}
              currentUserName={user.name || (isOwnerViewer ? 'Restaurant' : 'Customer')}
              targetRole={chatTarget}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
export default LiveDeliveryTracker;




