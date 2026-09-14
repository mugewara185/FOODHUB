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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Phone,
  LocalShipping,
  LocationOn,
  AccessTime,
  CheckCircle,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Person,
  Star,
} from '@mui/icons-material';
import { socketService } from '../../../../services/socket';
import type { Coordinates } from '../../../../data/types/location';
import { formatDuration } from '../../../../core/utils/location';

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const partnerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209865.png',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

const storeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});

const homeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

interface LiveDeliveryTrackerProps {
  orderId: string;
  restaurantLocation: Coordinates;
  customerLocation: Coordinates;
  onStatusChange?: (status: string) => void;
}

const statusStepsList = [
  'preparing',
  'ready',
  'partner_assigned',
  'picked_up',
  'on_the_way',
  'nearby',
  'delivered'
];

const LiveDeliveryTracker: React.FC<LiveDeliveryTrackerProps> = ({
  orderId,
  restaurantLocation,
  customerLocation,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<string>('preparing');
  const [partner, setPartner] = useState<any>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    socketService.connect('customer123', 'customer');
    
    // Join order room
    socketService.subscribeToOrder(orderId, (data) => {
      // Legacy status update
    });

    socketService.onAdminFleetEvent('delivery:assigned', (data: any) => {
      if (data.orderId === orderId || data.deliveryId) {
        setPartner(data.partner);
        setStatus('partner_assigned');
      }
    });

    socketService.onAdminFleetEvent('delivery:location', (data: any) => {
      if (data.orderId === orderId) {
        setLocation({ lat: data.location.lat, lng: data.location.lng });
        setEta(data.etaSeconds);
        setDistance(data.distanceRemainingMeters);
        if (data.status) setStatus(data.status);
      }
    });

    socketService.onAdminFleetEvent('delivery:status', (data: any) => {
      if (data.orderId === orderId) {
        setStatus(data.status);
        if (onStatusChange) onStatusChange(data.status);
      }
    });

    return () => {
      socketService.unsubscribeFromOrder(orderId);
    };
  }, [orderId, onStatusChange]);

  const currentStep = statusStepsList.indexOf(status);

  const getStatusIcon = (step: number, current: number) => {
    if (step < current) return <CheckCircle color="success" />;
    if (step === current) return <RadioButtonChecked color="primary" />;
    return <RadioButtonUnchecked color="disabled" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'success';
    if (['on_the_way', 'nearby'].includes(status)) return 'primary';
    if (['picked_up', 'partner_assigned'].includes(status)) return 'warning';
    return 'info';
  };

  const mapCenter: [number, number] = location 
    ? [location.lat, location.lng] 
    : [restaurantLocation.lat, restaurantLocation.lng];

  const polylinePositions: [number, number][] = location
    ? [
        [location.lat, location.lng],
        [customerLocation.lat, customerLocation.lng]
      ]
    : [
        [restaurantLocation.lat, restaurantLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      ];

  const statusSteps = [
    { label: 'Preparing', description: 'Restaurant is preparing your order', id: 'preparing' },
    { label: 'Assigned', description: 'Partner assigned', id: 'partner_assigned' },
    { label: 'Picked Up', description: 'Order picked up', id: 'picked_up' },
    { label: 'On the Way', description: 'Partner is on the way', id: 'on_the_way' },
    { label: 'Nearby', description: 'Partner is nearby', id: 'nearby' },
    { label: 'Delivered', description: 'Order delivered', id: 'delivered' },
  ];

  const safeStep = currentStep === -1 ? 0 : currentStep;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Order #{orderId.substring(0, 8)}
            </Typography>
            <Chip
              size="small"
              label={status.replace(/_/g, ' ').toUpperCase()}
              color={getStatusColor(status) as any}
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Arrival
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700}>
              {eta > 0 ? formatDuration(eta) : '--:--'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(5, (safeStep / (statusStepsList.length - 1)) * 100)}
            color="primary"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400, position: 'relative' }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
              <ChangeView center={mapCenter} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={storeIcon}>
                <Popup>Restaurant</Popup>
              </Marker>
              <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}>
                <Popup>Delivery Location</Popup>
              </Marker>
              {location && (
                <Marker position={[location.lat, location.lng]} icon={partnerIcon}>
                  <Popup>{partner?.name || 'Partner'}</Popup>
                </Marker>
              )}
              <Polyline positions={polylinePositions} color="blue" />
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Partner
            </Typography>

            {partner ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 64, height: 64 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {partner.name}
                    </Typography>
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
                    <Typography variant="body2">
                      {partner.vehicle}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" />
                    <Typography variant="body2">
                      Distance: {Math.round(distance)}m
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime color="primary" />
                    <Typography variant="body2">
                      ETA: {eta > 0 ? formatDuration(eta) : '--:--'}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Phone />}
                    href={`tel:${partner.phone}`}
                  >
                    Call
                  </Button>
                </Stack>
              </>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Waiting for partner assignment...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Order Status
            </Typography>

            <Grid container spacing={2}>
              {statusSteps.map((step, index) => {
                const stepIdx = statusStepsList.indexOf(step.id);
                const isPassed = stepIdx <= safeStep;
                return (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isPassed ? 'primary.light' : 'grey.50',
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getStatusIcon(stepIdx, safeStep)}
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          color={isPassed ? 'primary.dark' : 'text.secondary'}
                        >
                          {step.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveDeliveryTracker;