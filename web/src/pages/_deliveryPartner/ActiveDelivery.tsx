import React, { useState, useEffect } from 'react';
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
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocationOn,
  Restaurant,
  Person,
  CenterFocusStrong,
} from '@mui/icons-material';
import Map from '../../shared/components/maps/Map';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import {
  selectActiveAssignment,
  selectPartnerLocation,
  selectIsLoading,
  fetchPartnerStateThunk,
  updateAssignmentStatusThunk,
  partnerLocationReceived,
} from '@features/deliveryPartner/deliveryPartnerSlice';
import { socketService } from '../../services/socket';
import { useGPSSimulator } from '../../core/dev/gpsSimulator';

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

  const [pickupDialog, setPickupDialog] = useState(false);
  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Fetch partner state (active delivery + location + status) on mount.
  // This replaces the old fetchActiveAssignmentThunk which always returned null.
  useEffect(() => {
    dispatch(fetchPartnerStateThunk());
  }, [dispatch]);
  
console.log('ActiveDelivery render: activeAssignment=', activeAssignment, 'currentLocation=', currentLocation, 'isLoading=', isLoading);
  const targetLoc =
    activeAssignment?.status === 'out_for_delivery' || activeAssignment?.status === 'nearby'
      ? activeAssignment.dropoffLocation
      : activeAssignment?.pickupLocation;

  // GPS simulator: emits new locations via the callback.
  // Dispatches partnerLocationReceived (socket-projected naming) and
  // forwards the update via socketService using explicit IDs.
  useGPSSimulator(
    !!activeAssignment && !!targetLoc,
    currentLocation,
    targetLoc,
    (newLoc) => {
      dispatch(partnerLocationReceived(newLoc));

      if (activeAssignment?.deliveryId && activeAssignment?.orderId && activeAssignment?.partnerId) {
        socketService.updatePartnerLocation(
          {
            deliveryId: activeAssignment.deliveryId,
            orderId: activeAssignment.orderId,
            partnerId: activeAssignment.partnerId,
          },
          newLoc
        );
      }
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Typography>Loading delivery...</Typography>
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
        <Button variant="outlined" onClick={() => navigate('/partner/dashboard')}>
          Back to Dashboard
        </Button>
      </Paper>
    );
  }

  const getStepIndex = () => {
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

  const steps: DeliveryStep[] = [
    { label: 'Order Assigned', description: 'You have accepted the order', completed: activeStep > 0 },
    { label: 'Reached Restaurant', description: 'Arrive at restaurant for pickup', completed: activeStep > 1 },
    { label: 'Order Picked Up', description: 'Food collected from restaurant', completed: activeStep > 2 },
    { label: 'On the Way', description: 'Heading to customer location', completed: activeStep > 3 },
    { label: 'Delivered', description: 'Order delivered to customer', completed: activeStep > 4 },
  ];

  const progress = (activeStep / 4) * 100;

  const handleStatusUpdate = (newStatus: string) => {
    dispatch(
      updateAssignmentStatusThunk({
        deliveryId: activeAssignment.deliveryId,
        status: newStatus,
      })
    );
  };

  const handlePickupConfirm = () => {
    handleStatusUpdate('picked_up');
    setPickupDialog(false);
  };

  const handleDeliveryConfirm = () => {
    handleStatusUpdate('delivered');
    setDeliveryDialog(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Active Delivery
        </Typography>
        <Chip label={`Order #${activeAssignment.orderId}`} color="primary" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400, position: 'relative' }}>
            <Map
              center={currentLocation || activeAssignment.pickupLocation}
              markers={[
                {
                  id: 'restaurant',
                  position: activeAssignment.pickupLocation,
                  type: 'restaurant',
                  title: activeAssignment.restaurant,
                },
                {
                  id: 'customer',
                  position: activeAssignment.dropoffLocation,
                  type: 'customer',
                  title: activeAssignment.customer,
                },
                ...(currentLocation
                  ? [
                      {
                        id: 'partner',
                        position: currentLocation,
                        type: 'partner' as const,
                        title: 'Your Location',
                      },
                    ]
                  : []),
              ]}
              recenterTrigger={recenterTrigger}
              showTraffic={true}
              height="100%"
            />
            <IconButton
              onClick={() => setRecenterTrigger((prev) => prev + 1)}
              sx={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                bgcolor: 'white',
                boxShadow: 2,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <CenterFocusStrong />
            </IconButton>
          </Paper>

          <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Delivery Progress
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4, mb: 4 }}
            />

            <Stepper activeStep={activeStep - 1} orientation="vertical">
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

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Actions
            </Typography>
            {activeStep === 1 && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => handleStatusUpdate('arrived_pickup')}
              >
                Arrived at Restaurant
              </Button>
            )}
            {activeStep === 2 && (
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setPickupDialog(true)}
              >
                Confirm Pickup
              </Button>
            )}
            {activeStep === 3 && (
              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="large"
                onClick={() => handleStatusUpdate('out_for_delivery')}
              >
                Start Delivery
              </Button>
            )}
            {activeStep === 4 && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                onClick={() => setDeliveryDialog(true)}
              >
                Mark Delivered
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Restaurant />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {activeAssignment.restaurant}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pickup Location
                </Typography>
              </Box>
            </Box>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{activeAssignment.pickupAddress}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {activeAssignment.customer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drop-off Location
                </Typography>
              </Box>
            </Box>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{activeAssignment.dropAddress}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Order Details
            </Typography>
            {activeAssignment.items?.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {item.quantity}x {item.name}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Earnings
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} color="success.main">
                ₹{activeAssignment.amount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={pickupDialog} onClose={() => setPickupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Pickup</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Have you collected all items from the restaurant?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePickupConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deliveryDialog} onClose={() => setDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Delivery</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Handed over the order to customer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDeliveryConfirm}>
            Delivered
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveDelivery;