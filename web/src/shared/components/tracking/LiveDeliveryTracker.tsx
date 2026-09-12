import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Rating,
} from '@mui/material';
import {
  Phone,
  LocalShipping,
  LocationOn,
  AccessTime,
  CheckCircle,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Circle,
  Person,
  Star,
} from '@mui/icons-material';
import Map from '../maps/Map';
import type { Coordinates, LiveTracking, DeliveryPartner } from '../../../data/types/location';
import { formatDuration } from '../../../core/utils/location';

interface LiveDeliveryTrackerProps {
  orderId: string;
  orderStatus: string;
  restaurantLocation: Coordinates;
  customerLocation: Coordinates;
  onStatusChange?: (status: string) => void;
}

const LiveDeliveryTracker: React.FC<LiveDeliveryTrackerProps> = ({
  orderId,
  orderStatus,
  restaurantLocation,
  customerLocation,
  onStatusChange,
}) => {
  const [tracking, setTracking] = useState<LiveTracking | null>(null);
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [eta, setEta] = useState<string>('');

  useEffect(() => {
    // Mock delivery partner data
    const mockPartner: DeliveryPartner = {
      id: 'DP001',
      name: 'Rahul Sharma',
      avatar: 'https://i.pravatar.cc/150?img=1',
      phone: '+91 98765 43210',
      vehicleType: 'bike',
      vehicleNumber: 'MH 12 AB 1234',
      currentLocation: { lat: 19.0760, lng: 72.8777 },
      status: 'on_delivery',
      rating: 4.8,
      completedDeliveries: 1250,
      lastUpdate: new Date(),
    };
    setPartner(mockPartner);

    const statusToStep: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      out_for_delivery: 3,
      delivered: 4,
      cancelled: 0,
    };
    const currentStep = statusToStep[orderStatus] ?? 0;

    // Map tracking data
    const newTracking: LiveTracking = {
      orderId,
      partnerId: 'DP001',
      partnerLocation: { lat: 19.0760, lng: 72.8777 },
      estimatedArrival: new Date(Date.now() + 25 * 60000), // 25 minutes from now
      currentStep,
      totalSteps: 4,
      status: orderStatus as any,
      lastUpdate: new Date(),
    };
    setTracking(newTracking);
  }, [orderId, orderStatus]);

  // Calculate route when both locations are available
  useEffect(() => {
    if (!restaurantLocation || !customerLocation || !partner?.currentLocation) return;

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const checkAndCalculateRoute = () => {
      if (typeof google !== 'undefined' && google.maps && typeof google.maps.DirectionsService === 'function') {
        try {
          const directionsService = new google.maps.DirectionsService();

          directionsService.route(
            {
              origin: partner.currentLocation,
              destination: restaurantLocation,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (isMounted && status === 'OK' && result) {
                setRoute(result);
                const duration = result.routes[0].legs[0].duration?.text;
                setEta(duration || '');
              }
            }
          );
        } catch (err) {
          console.warn('Google Maps DirectionsService error:', err);
        }
      } else if (isMounted) {
        // Retry shortly if Google Maps JS script is still loading asynchronously
        timer = setTimeout(checkAndCalculateRoute, 500);
      }
    };

    checkAndCalculateRoute();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [partner, restaurantLocation, customerLocation]);

  const getStatusIcon = (step: number, currentStep: number) => {
    if (step < currentStep) {
      return <CheckCircle color="success" />;
    }
    if (step === currentStep) {
      return <RadioButtonChecked color="primary" />;
    }
    return <RadioButtonUnchecked color="disabled" />;
  };

  const getStatusColor = (status: LiveTracking['status']) => {
    switch (status) {
      case 'assigned':
        return 'info';
      case 'picked_up':
        return 'warning';
      case 'on_the_way':
        return 'primary';
      case 'arrived':
        return 'success';
      case 'delivered':
        return 'success';
      default:
        return 'default';
    }
  };

  const statusSteps = [
    { label: 'Order Confirmed', description: 'Restaurant is preparing your order' },
    { label: 'Order Picked Up', description: 'Delivery partner has picked up your order' },
    { label: 'On the Way', description: 'Your order is on its way to you' },
    { label: 'Nearby', description: 'Delivery partner is nearby' },
    { label: 'Delivered', description: 'Order delivered successfully' },
  ];

  if (!tracking || !partner) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading tracking information...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Status Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Order #{orderId}
            </Typography>
            <Chip
              size="small"
              label={tracking.status.replace('_', ' ').toUpperCase()}
              color={getStatusColor(tracking.status)}
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Arrival
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700}>
              {formatDuration((new Date(tracking.estimatedArrival).getTime() - Date.now()) / 1000)}
            </Typography>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant="determinate"
            value={(((tracking.currentStep ?? 1) / (tracking.totalSteps ?? 5))) * 100}
            color="primary"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400 }}>
            <Map
              center={partner.currentLocation}
              markers={[
                {
                  id: 'partner',
                  position: partner.currentLocation,
                  type: 'partner',
                  title: partner.name,
                  info: 'Delivery Partner',
                },
                {
                  id: 'restaurant',
                  position: restaurantLocation,
                  type: 'restaurant',
                  title: 'Restaurant',
                },
                {
                  id: 'customer',
                  position: customerLocation,
                  type: 'customer',
                  title: 'Your Location',
                },
              ]}
              directions={route || undefined}
              showTraffic={true}
              height="100%"
            />
          </Paper>
        </Grid>

        {/* Delivery Partner Info */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Partner
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                src={partner.avatar}
                sx={{ width: 64, height: 64 }}
              />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {partner.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2">{partner.rating}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • {partner.completedDeliveries} deliveries
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping color="primary" />
                <Typography variant="body2">
                  {partner.vehicleType} • {partner.vehicleNumber}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                <Typography variant="body2">
                  {tracking.status === 'on_the_way' ? 'On the way to you' : 'At restaurant'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="primary" />
                <Typography variant="body2">
                  ETA: {eta}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Contact Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Phone />}
                href={`tel:${partner.phone}`}
              >
                Call
              </Button>
              <Tooltip title="Message">
                <IconButton>
                  <Person />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        </Grid>

        {/* Status Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Order Status
            </Typography>

            <Grid container spacing={2}>
              {statusSteps.map((step, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: index <= (tracking.currentStep ?? 1) ? 'primary.light' : 'grey.50',
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getStatusIcon(index, tracking.currentStep ?? 1)}
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color={index <= (tracking.currentStep ?? 1) ? 'primary.dark' : 'text.secondary'}
                      >
                        {step.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Live Updates */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'success.light', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <RadioButtonChecked sx={{ animation: 'pulse 1.5s infinite' }} />
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Live Tracking Active
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Last updated: {new Date(tracking.lastUpdate || tracking.updatedAt || Date.now()).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveDeliveryTracker;