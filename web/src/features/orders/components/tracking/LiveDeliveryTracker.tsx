import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Chip, LinearProgress, Avatar, Divider, Stack, Button, Dialog, DialogContent } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, RadioButtonChecked, Cancel, Star, LocalShipping, LocationOn, AccessTime, Phone, Person, Message } from '@mui/icons-material';
import { formatDuration } from '../../../../core/utils/location';
import Map from '../../../../shared/components/maps/Map';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';
import { useAppSelector } from '../../../../app/store/hooks';
import { selectCurrentOrder } from '../../orderSlice';

import OrderChat from '../../../../shared/components/OrderChat/OrderChat';
import { useAuth } from '../../../../contexts/AuthContext';
import type { Coordinates } from '@/core/types/location';

interface LiveDeliveryTrackerProps {
  orderId: string;
  orderStatus: string;
  restaurantLocation?: Coordinates;
  customerLocation?: Coordinates;
  rejectionReason?: string;
}

const statusStepsList = [
  'pending_owner',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'awaiting_partner',
  'partner_assigned',
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

import { socketService } from '../../../../services/socket';

const useLocalDeliveryTracking = (orderId: string, initialStatus: string) => {
  const globalState = useDeliveryTracking();
  const [location, setLocation] = useState<Coordinates | null>(globalState.location);
  const [partner, setPartner] = useState<any>(globalState.partner);
  const [status, setStatus] = useState<string>(globalState.status === 'created' ? initialStatus : globalState.status);
  const [etaSeconds, setEtaSeconds] = useState(globalState.etaSeconds || 0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(globalState.lastUpdatedAt || Date.now());

  useEffect(() => {
    if (!orderId) return;

    const handleLoc = (p: any) => {
      if (p.orderId === orderId) {
        setLocation(p.location);
        setEtaSeconds(p.etaSeconds || 0);
        setLastUpdatedAt(Date.now());
      }
    };
    const handleStatus = (p: any) => {
      if (p.orderId === orderId) {
        setStatus(p.status);
        setLastUpdatedAt(Date.now());
      }
    };
    const handleAssigned = (p: any) => {
      if (p.orderId === orderId) {
        setPartner({ name: p.partnerName, phone: p.partnerPhone });
        setLastUpdatedAt(Date.now());
      }
    };

    socketService.onDeliveryLocation(handleLoc);
    socketService.onDeliveryStatus(handleStatus);
    socketService.onDeliveryAssigned(handleAssigned);

    return () => {
      socketService.offDeliveryLocation(handleLoc);
      socketService.offDeliveryStatus(handleStatus);
      socketService.offDeliveryAssigned(handleAssigned);
    };
  }, [orderId]);

  // Sync with global state separately to avoid rebinding sockets
  useEffect(() => {
    if (globalState && (globalState as any).orderId === orderId) {
      setLocation(globalState.location);
      setPartner(globalState.partner);
      setStatus(globalState.status);
      setEtaSeconds(globalState.etaSeconds);
    }
  }, [
    orderId,
    (globalState as any).orderId,
    globalState.location,
    globalState.partner,
    globalState.status,
    globalState.etaSeconds
  ]);

  return { partner, location, status, etaSeconds, distance: globalState.distance, lastUpdatedAt };
};

const LiveDeliveryTracker: React.FC<LiveDeliveryTrackerProps> = ({ orderId, orderStatus, restaurantLocation, customerLocation, rejectionReason }) => {
  const { partner, location, status, etaSeconds, distance, lastUpdatedAt } = useLocalDeliveryTracking(orderId, orderStatus);
  const { user } = useAuth();
  const currentOrder = useAppSelector(selectCurrentOrder);

  const [liveEta, setLiveEta] = useState(etaSeconds);
  const [chatTarget, setChatTarget] = useState<'owner' | 'partner' | null>(null);

  useEffect(() => {
    setLiveEta(etaSeconds);
  }, [etaSeconds]);

  useEffect(() => {
    if (etaSeconds <= 0) return;

    // Update live ETA every second based on last socket update
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
    if (['picked_up', 'partner_assigned', 'awaiting_partner', 'ready_for_pickup', 'preparing'].includes(s)) return 'warning';
    if (['rejected'].includes(s)) return 'error';
    if (['cancelled'].includes(s)) return 'default';
    return 'info';
  };

  const resLoc = restaurantLocation || { lat: 12.9716, lng: 77.5946 };
  const cusLoc = customerLocation || { lat: resLoc.lat + 0.02, lng: resLoc.lng + 0.02 };
  const markers = [
    { id: 'restaurant', type: 'restaurant', position: resLoc, title: 'Restaurant' },
    { id: 'customer', type: 'customer', position: cusLoc, title: 'You' },
  ];
  if (location) markers.push({ id: 'partner', type: 'partner', position: location, title: partner?.name || 'Partner' });

  // Map follows partner if tracking is active
  const mapCenter = location || resLoc;
  const routeCoordinates = location ? [location, cusLoc] : [resLoc, cusLoc];

  const renderEtaText = () => {
    if (['delivered', 'completed', 'reviewed'].includes(status)) {
      if (currentOrder?.createdAt && currentOrder?.updatedAt) {
        const duration = (new Date(currentOrder.updatedAt).getTime() - new Date(currentOrder.createdAt).getTime()) / 1000;
        return `Delivered in ${formatDuration(duration)}`;
      }
      return 'Delivered';
    }
    if (liveEta > 0) return formatDuration(liveEta);
    if (location) return 'Calculating...';
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
            <Map center={mapCenter} zoom={15}  markers={markers} routeCoordinates={routeCoordinates} />
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
                      <Typography variant="body2">{partner.rating}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping color="primary" />
                    <Typography variant="body2">{partner.vehicleType}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" />
                    <Typography variant="body2">Distance: {distance > 0 ? `${Math.round(distance)}m` : 'Calculating...'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime color="primary" />
                    <Typography variant="body2">ETA: {renderEtaText()}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2}>
                  <Button fullWidth variant="contained" startIcon={<Phone />} href={`tel:${partner.phone}`}>Call</Button>
                  <Button fullWidth variant="outlined" startIcon={<Message />} onClick={() => setChatTarget('partner')}>Chat</Button>
                </Stack>
              </>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">{status === 'pending_owner' ? 'Waiting for restaurant to accept the order' : status === 'awaiting_partner' ? 'Finding a delivery partner...' : 'Waiting for partner assignment...'}</Typography>
                <Button sx={{ mt: 2 }} variant="outlined" startIcon={<Message />} onClick={() => setChatTarget('owner')}>Chat with Restaurant</Button>
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
              orderId={orderId}
              currentUserId={user.id}
              currentUserRole="user"
              currentUserName={user.name || 'Customer'}
              targetRole={chatTarget}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
export default LiveDeliveryTracker;




