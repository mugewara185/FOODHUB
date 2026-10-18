import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Stack,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  IconButton,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  LocationOn,
  Restaurant,
  Person,
  CenterFocusStrong,
  Chat,
  CheckCircle,
  LocalShipping,
  AccessTime,
  AttachMoney
} from '@mui/icons-material';
import Map from '../../shared/components/maps/Map';
import OrderChat from '../../shared/components/OrderChat/OrderChat';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import {
  selectActiveAssignment,
  selectPartnerLocation,
  selectIsLoading,
  fetchPartnerStateThunk,
  partnerLocationReceived,
  deliveryStatusChangedReceived,
  setActiveAssignment
} from '@features/deliveryPartner/deliveryPartnerSlice';
import { socketService } from '../../services/socket';
import { useDeliverySocket } from '../../features/deliveryPartner/hooks/useDeliverySocket';
import { fetchRoadRoute, calculateDistance, smoothRouteOrigin } from '../../core/utils/location';
import type { Coordinates } from '../../data/types/location';

interface DeliveryStep {
  label: string;
  description: string;
  completed: boolean;
}

const ActiveDelivery: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeAssignment = useAppSelector(selectActiveAssignment);
  const currentLocation = useAppSelector(selectPartnerLocation);
  const isLoading = useAppSelector(selectIsLoading);
  const { user } = useAppSelector((state: any) => state.auth);

  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);
  const [travelledCoords, setTravelledCoords] = useState<Coordinates[]>([]);
  const [routeStatus, setRouteStatus] = useState<'road' | 'direct' | 'none'>('direct');
  const lastRoutedPosRef = useRef<{ lat: number; lng: number; isCustomerLeg: boolean; orderId?: string } | null>(null);

  // Fetch partner state (active delivery + location + status) on mount and socket reconnect.
  useEffect(() => {
    dispatch(fetchPartnerStateThunk());
    const unsubscribe = socketService.onStatusChange?.((connStatus) => {
      if (connStatus === 'connected') {
        dispatch(fetchPartnerStateThunk());
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [dispatch]);

  // Bounded fallback reconciliation poll while delivery is active (only if socket is not connected)
  useEffect(() => {
    if (!activeAssignment || activeAssignment.status === 'delivered') return;

    const interval = setInterval(() => {
      if (!socketService.isConnected) {
        dispatch(fetchPartnerStateThunk());
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [dispatch, activeAssignment?.deliveryId, activeAssignment?.status]);

  // Compute positions
  const pickupPos = activeAssignment?.pickupLocation && (activeAssignment.pickupLocation.lat !== 0 || activeAssignment.pickupLocation.lng !== 0)
    ? activeAssignment.pickupLocation
    : { lat: 12.9716, lng: 77.5946 };

  const dropoffPos = activeAssignment?.dropoffLocation && (activeAssignment.dropoffLocation.lat !== 0 || activeAssignment.dropoffLocation.lng !== 0)
    ? activeAssignment.dropoffLocation
    : { lat: pickupPos.lat + 0.02, lng: pickupPos.lng + 0.02 };

  const partnerPos = currentLocation && (currentLocation.lat !== 0 || currentLocation.lng !== 0)
    ? currentLocation
    : (activeAssignment?.currentLocation && (activeAssignment.currentLocation.lat !== 0 || activeAssignment.currentLocation.lng !== 0)
      ? activeAssignment.currentLocation
      : pickupPos);

  // Reset travelled coordinates when order changes
  useEffect(() => {
    setTravelledCoords([]);
  }, [activeAssignment?.orderId]);

  // Accumulate courier positions into travelled trail
  useEffect(() => {
    if (partnerPos && partnerPos.lat && partnerPos.lng && (partnerPos.lat !== 0 || partnerPos.lng !== 0)) {
      setTravelledCoords((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          if (Math.abs(last.lat - partnerPos.lat) < 1e-6 && Math.abs(last.lng - partnerPos.lng) < 1e-6) {
            return prev;
          }
        }
        return [...prev, partnerPos];
      });
    }
  }, [partnerPos.lat, partnerPos.lng]);

  // Subscribe to order room
  useEffect(() => {
    if (!activeAssignment?.orderId) return;
    socketService.joinOrderRoom(activeAssignment.orderId);

    return () => {
      socketService.unsubscribeFromOrder(activeAssignment.orderId);
    };
  }, [activeAssignment?.orderId]);

  // Socket event listeners
  useDeliverySocket('partner', {
    onLocation: (payload) => {
      if (
        activeAssignment &&
        (String(payload.orderId) === String(activeAssignment.orderId) ||
          String(payload.deliveryId) === String(activeAssignment.deliveryId))
      ) {
        dispatch(
          partnerLocationReceived({
            lat: payload.location.lat,
            lng: payload.location.lng,
            etaSeconds: payload.etaSeconds,
            distanceRemainingMeters: payload.distanceRemainingMeters,
            status: payload.status as any,
          })
        );
        if (payload.status && payload.status !== activeAssignment.status) {
          dispatch(
            deliveryStatusChangedReceived({
              deliveryId: payload.deliveryId || payload.orderId || activeAssignment.deliveryId,
              status: payload.status as any,
            })
          );
        }
      }
    },
    onStatus: (payload) => {
      if (
        activeAssignment &&
        (String(payload.deliveryId) === String(activeAssignment.deliveryId) ||
          String(payload.orderId) === String(activeAssignment.orderId) ||
          String(payload.deliveryId) === String(activeAssignment.orderId))
      ) {
        dispatch(
          deliveryStatusChangedReceived({
            deliveryId: payload.deliveryId || payload.orderId || activeAssignment.deliveryId,
            status: payload.status as any,
          })
        );
      }
    },
  });

  const getStepIndex = () => {
    if (!activeAssignment) return 0;
    switch (activeAssignment.status) {
      case 'partner_assigned': return 0;
      case 'arrived_pickup': return 1;
      case 'picked_up': return 2;
      case 'out_for_delivery': return 3;
      case 'nearby': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const activeStep = getStepIndex();

  // Bounded road route calculation (immediate fallback line + non-blocking road fetch)
  const isCustomerLeg = activeStep >= 2;
  useEffect(() => {
    if (!activeAssignment || activeAssignment.status === 'delivered') {
      setRouteCoords([]);
      setRouteStatus('none');
      lastRoutedPosRef.current = null;
      return;
    }

    let isCancelled = false;
    const startPoint = partnerPos;
    const endPoint = isCustomerLeg ? dropoffPos : pickupPos;

    const orderChanged = !lastRoutedPosRef.current || lastRoutedPosRef.current.orderId !== activeAssignment.orderId;
    const legChanged = lastRoutedPosRef.current?.isCustomerLeg !== isCustomerLeg;
    const distanceMoved = lastRoutedPosRef.current
      ? calculateDistance(partnerPos, { lat: lastRoutedPosRef.current.lat, lng: lastRoutedPosRef.current.lng })
      : Infinity;

    if (orderChanged || legChanged || distanceMoved > 250) {
      // Set immediate direct fallback line for current leg with truthful direct status
      setRouteCoords([startPoint, endPoint]);
      setRouteStatus('direct');
      lastRoutedPosRef.current = {
        lat: partnerPos.lat,
        lng: partnerPos.lng,
        isCustomerLeg,
        orderId: activeAssignment.orderId,
      };

      // Bounded fetch: max 2.5s timeout, never hangs
      fetchRoadRoute(startPoint, endPoint, 2500)
        .then((res) => {
          if (!isCancelled && res.coordinates.length > 1) {
            setRouteCoords(res.coordinates);
            setRouteStatus(res.isRoadRoute ? 'road' : 'direct');
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setRouteStatus('direct');
          }
        });
    } else {
      // Intermediate GPS tick (<= 250m): smooth route start point to partnerPos without network call
      setRouteCoords((prev) => smoothRouteOrigin(prev, partnerPos));
    }

    return () => {
      isCancelled = true;
    };
  }, [
    activeAssignment?.orderId,
    activeAssignment?.status,
    isCustomerLeg,
    partnerPos.lat,
    partnerPos.lng,
    pickupPos.lat,
    pickupPos.lng,
    dropoffPos.lat,
    dropoffPos.lng,
  ]);

  if (isLoading && !activeAssignment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <Typography variant="h6" color="text.secondary">Loading delivery details...</Typography>
      </Box>
    );
  }

  if (!activeAssignment) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          No active delivery
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You don't have a delivery in progress right now.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/partner/dashboard')}>
          Back to Dashboard
        </Button>
      </Paper>
    );
  }

  const steps: DeliveryStep[] = [
    { label: 'Order Assigned', description: 'Accepted — heading to restaurant', completed: activeStep > 0 },
    { label: 'Reached Restaurant', description: 'Arrived — awaiting food handoff', completed: activeStep > 1 },
    { label: 'Order Picked Up', description: 'Food collected from restaurant', completed: activeStep > 2 },
    { label: 'On the Way', description: 'Traveling to customer destination', completed: activeStep > 3 },
    { label: 'Delivered', description: 'Order delivered to customer', completed: activeStep >= 4 },
  ];

  const progress = Math.min(100, Math.round((activeStep / 4) * 100));

  const markers = [
    {
      id: 'restaurant',
      position: pickupPos,
      type: 'restaurant' as const,
      title: activeAssignment.restaurant ? `Pickup: ${activeAssignment.restaurant}` : 'Pickup Location',
      info: activeAssignment.pickupAddress || 'Restaurant'
    },
    {
      id: 'customer',
      position: dropoffPos,
      type: 'customer' as const,
      title: activeAssignment.customer ? `Drop-off: ${activeAssignment.customer}` : 'Drop-off Destination',
      info: activeAssignment.dropAddress || 'Customer Address'
    },
    {
      id: 'partner',
      position: partnerPos,
      type: 'partner' as const,
      title: 'Your Location (Delivery Partner)',
      info: `Status: ${activeAssignment.status.replace(/_/g, ' ').toUpperCase()}`
    }
  ];

  return (
    <Box>
      {/* Page Title & Status Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Active Delivery
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`Order #${activeAssignment.orderId.substring(0, 8)}`} color="primary" sx={{ fontWeight: 700 }} />
            <Chip
              label={activeAssignment.status.replace(/_/g, ' ').toUpperCase()}
              color={activeStep >= 4 ? 'success' : activeStep >= 2 ? 'primary' : 'warning'}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Chat />}
          onClick={() => setChatOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Open Order Chat
        </Button>
      </Box>

      {/* Terminal Delivered Banner */}
      {activeStep >= 4 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText', textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 52, mb: 1, color: 'success.main' }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Delivery Complete!
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Order #{activeAssignment.orderId.substring(0, 8)} has been successfully delivered.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
            You earned ₹{activeAssignment.amount}. No active delivery in progress.
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              dispatch(setActiveAssignment(null));
              navigate('/partner/dashboard');
            }}
            sx={{ fontWeight: 700 }}
          >
            Complete & Return to Dashboard
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Street Map & Progress Stepper */}
        <Grid item xs={12} lg={8}>
          {/* Leaflet Map with Real Street Background */}
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 420, position: 'relative', border: '1px solid', borderColor: 'divider' }}>
            <Map
              center={partnerPos}
              zoom={14}
              markers={markers}
              routeCoordinates={routeCoords}
              travelledCoordinates={travelledCoords}
              isFallbackRoute={routeStatus === 'direct'}
              routeStatus={routeStatus}
              recenterTrigger={recenterTrigger}
              height="100%"
            />
            <IconButton
              onClick={() => setRecenterTrigger((prev) => prev + 1)}
              title="Recenter Map View"
              sx={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                bgcolor: 'background.paper',
                boxShadow: 3,
                zIndex: 1000,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <CenterFocusStrong />
            </IconButton>
          </Paper>

          {/* Stepper & Progress */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Delivery Progress
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4, mb: 3 }}
            />

            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step) => (
                <Step key={step.label} completed={step.completed}>
                  <StepLabel>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Column: Live Status, Locations, Earnings */}
        <Grid item xs={12} lg={4}>
          {/* Simulator Status Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocalShipping color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                {activeStep >= 4 ? 'Delivery Completed' : activeStep >= 2 ? 'In Transit to Customer' : 'Traveling to Restaurant'}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              {activeStep >= 4
                ? 'Delivery is finished. Great job!'
                : activeStep === 1
                ? 'Waiting for restaurant owner to hand off the order.'
                : 'Simulator coordinates are updating live on your street map.'}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<Chat />}
              onClick={() => setChatOpen(true)}
            >
              Chat with Customer / Restaurant
            </Button>
          </Paper>

          {/* Location Details Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            {/* Restaurant Pickup */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                <Restaurant />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {activeAssignment.restaurant || 'Restaurant'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pickup Location
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, ml: 1, mb: 2 }}>
              <LocationOn fontSize="small" color="action" sx={{ mt: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                {activeAssignment.pickupAddress || 'Restaurant Address'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Customer Drop-off */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {activeAssignment.customer || 'Customer'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Drop-off Destination
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, ml: 1 }}>
              <LocationOn fontSize="small" color="action" sx={{ mt: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                {activeAssignment.dropAddress || 'Customer Delivery Address'}
              </Typography>
            </Box>
          </Paper>

          {/* Order & Earnings Card */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Summary
            </Typography>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Estimated Time</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <AccessTime fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={600}>
                    {activeAssignment.status === 'delivered'
                      ? 'Delivered'
                      : activeAssignment.status === 'arrived_pickup'
                      ? 'At restaurant (awaiting handoff)'
                      : activeAssignment.estimatedTime || '15 mins'}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Distance</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {activeAssignment.status === 'delivered'
                    ? '0.0 km'
                    : activeAssignment.status === 'arrived_pickup'
                    ? '0m (At restaurant)'
                    : activeAssignment.distance || '2.5 km'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Live Position</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {partnerPos.lat.toFixed(4)}, {partnerPos.lng.toFixed(4)}
                </Typography>
              </Box>
            </Stack>

            {activeAssignment.items && activeAssignment.items.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Items to deliver:
                </Typography>
                {activeAssignment.items.map((item: any, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity || 1}x {item.name || item.title || 'Item'}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Your Earnings
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AttachMoney color="success" />
                <Typography variant="h6" fontWeight={800} color="success.main">
                  ₹{activeAssignment.amount || 0}
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          {activeAssignment && user && (
            <OrderChat 
              orderId={activeAssignment.orderId}
              currentUserId={user.id}
              currentUserRole="partner"
              currentUserName={user.name || 'Delivery Partner'}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ActiveDelivery;