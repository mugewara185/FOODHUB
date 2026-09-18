import React, { useState } from 'react';
import { Box, Paper, Typography, Avatar, Chip, LinearProgress, Grid, Divider, Button, Stack, IconButton } from '@mui/material';
import { Phone, LocalShipping, LocationOn, AccessTime, CheckCircle, RadioButtonChecked, RadioButtonUnchecked, Person, Star, Minimize, OpenInFull } from '@mui/icons-material';
import type { Coordinates } from '../../../../core/types';
import { formatDuration } from '../../../../core/utils/location';
import Map from '../../../../shared/components/maps/Map';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';
import { DraggableContainer } from '../../../../core/ui/draggable/DraggableContainer';

interface LiveDeliveryTrackerProps {
  orderId: string;
  orderStatus: string;
  restaurantLocation: Coordinates;
  customerLocation: Coordinates;
}

const statusStepsList = ['preparing', 'ready', 'partner_assigned', 'picked_up', 'on_the_way', 'nearby', 'delivered'];
const statusSteps = [
  { label: 'Preparing', description: 'Restaurant preparing', id: 'preparing' },
  { label: 'Assigned', description: 'Partner assigned', id: 'partner_assigned' },
  { label: 'Picked Up', description: 'Order picked up', id: 'picked_up' },
  { label: 'On the Way', description: 'Partner on the way', id: 'on_the_way' },
  { label: 'Nearby', description: 'Partner nearby', id: 'nearby' },
  { label: 'Delivered', description: 'Order delivered', id: 'delivered' },
];

const LiveDeliveryTracker: React.FC<LiveDeliveryTrackerProps> = ({ orderId, orderStatus, restaurantLocation, customerLocation }) => {
  const [isFloating, setIsFloating] = useState(false);
  
  const { partner, location, status, etaSeconds, distance } = useDeliveryTracking(orderId, orderStatus, restaurantLocation, customerLocation);

  const currentStep = statusStepsList.indexOf(status);
  const safeStep = currentStep === -1 ? 0 : currentStep;

  const getStatusIcon = (step: number, current: number) => {
    if (step < current) return <CheckCircle color="success" />;
    if (step === current) return <RadioButtonChecked color="primary" />;
    return <RadioButtonUnchecked color="disabled" />;
  };

  const getStatusColor = (s: string) => {
    if (s === 'delivered') return 'success';
    if (['on_the_way', 'nearby'].includes(s)) return 'primary';
    if (['picked_up', 'partner_assigned'].includes(s)) return 'warning';
    return 'info';
  };

  const markers = [
    { id: 'restaurant', type: 'restaurant', position: restaurantLocation, title: 'Restaurant' },
    { id: 'customer', type: 'customer', position: customerLocation, title: 'You' },
  ];
  if (location) markers.push({ id: 'partner', type: 'partner', position: location, title: partner?.name || 'Partner' });

  const mapCenter = location || restaurantLocation;
  const routeCoordinates = location ? [location, customerLocation] : [restaurantLocation, customerLocation];

  if (isFloating) {
    return (
      <DraggableContainer width={300} height={300} storageKey="pip-tracker">
        <Paper sx={{ width: 300, overflow: 'hidden', borderRadius: 3, boxShadow: 6 }}>
          <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" fontWeight={600}>Live Delivery</Typography>
            <IconButton size="small" sx={{ color: 'white' }} onClick={() => setIsFloating(false)}><OpenInFull fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>Arriving in</Typography>
              <Typography variant="body2" color="primary.main" fontWeight={800}>{etaSeconds > 0 ? formatDuration(etaSeconds) : '--:--'}</Typography>
            </Box>
            <Box sx={{ height: 150, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
               <Map center={mapCenter} zoom={14} height="100%" markers={markers} routeCoordinates={routeCoordinates} />
            </Box>
            <Typography variant="caption" display="block" textAlign="center" fontWeight={600}>{status.replace(/_/g, ' ').toUpperCase()}</Typography>
          </Box>
        </Paper>
      </DraggableContainer>
    );
  }

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
              <Typography variant="h4" color="primary.main" fontWeight={700}>{etaSeconds > 0 ? formatDuration(etaSeconds) : '--:--'}</Typography>
            </Box>
            <IconButton onClick={() => setIsFloating(true)} color="primary"><Minimize /></IconButton>
          </Box>
        </Box>
        <Box sx={{ mt: 3 }}><LinearProgress variant="determinate" value={Math.max(5, (safeStep / (statusStepsList.length - 1)) * 100)} color="primary" sx={{ height: 8, borderRadius: 4 }} /></Box>
      </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400, position: 'relative' }}>
             <Map center={mapCenter} zoom={15} height="100%" markers={markers} routeCoordinates={routeCoordinates} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Delivery Partner</Typography>
            {partner ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 64, height: 64 }}><Person /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{partner.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Star sx={{ fontSize: 16, color: 'warning.main' }} /><Typography variant="body2">{partner.rating}</Typography></Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShipping color="primary" /><Typography variant="body2">{partner.vehicleType}</Typography></Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocationOn color="primary" /><Typography variant="body2">Distance: {Math.round(distance)}m</Typography></Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime color="primary" /><Typography variant="body2">ETA: {etaSeconds > 0 ? formatDuration(etaSeconds) : '--:--'}</Typography></Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2}><Button fullWidth variant="contained" startIcon={<Phone />} href={`tel:${partner.phone}`}>Call</Button></Stack>
              </>
            ) : (<Box sx={{ p: 4, textAlign: 'center' }}><Typography color="textSecondary">Waiting for partner assignment...</Typography></Box>)}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Order Status</Typography>
            <Grid container spacing={2}>
              {statusSteps.map((step, index) => {
                const stepIdx = statusStepsList.indexOf(step.id);
                const isPassed = stepIdx <= safeStep;
                return (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: isPassed ? 'primary.light' : 'grey.50', position: 'relative' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>{getStatusIcon(stepIdx, safeStep)}<Typography variant="subtitle2" fontWeight={600} color={isPassed ? 'primary.dark' : 'text.secondary'}>{step.label}</Typography></Box>
                      <Typography variant="caption" color="text.secondary">{step.description}</Typography>
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