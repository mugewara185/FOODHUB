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
  Card,
  CardContent,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  LocationOn,
  Phone,
  Restaurant,
  Person,
  CheckCircle,
  RadioButtonChecked,
  PhotoCamera,
  AttachMoney,
  AccessTime,
  Navigation,
} from '@mui/icons-material';
import Map from '../../shared/components/maps/Map';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import { selectActiveAssignment, selectPartnerLocation, updateAssignmentStatus, updateLocation } from '@features/deliveryPartner/deliveryPartnerSlice';
import { socketService } from '../../services/socket';

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

  const [pickupDialog, setPickupDialog] = useState(false);
  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [otp, setOtp] = useState('');
  
  useEffect(() => {
    if (!activeAssignment) {
      navigate('/partner');
    }
  }, [activeAssignment, navigate]);

  // Simulation interval for driver location
  useEffect(() => {
    if (!activeAssignment || !currentLocation) return;
    const target = activeAssignment.status === 'out_for_delivery' ? activeAssignment.dropoffLocation : activeAssignment.pickupLocation;
    
    const interval = setInterval(() => {
      // Simulate moving towards target by small delta
      const latDelta = (target.lat - currentLocation.lat) * 0.1;
      const lngDelta = (target.lng - currentLocation.lng) * 0.1;
      
      // Stop moving if very close
      if (Math.abs(latDelta) < 0.0001 && Math.abs(lngDelta) < 0.0001) return;
      
      const newLoc = {
        lat: currentLocation.lat + latDelta,
        lng: currentLocation.lng + lngDelta
      };
      dispatch(updateLocation(newLoc));
      
      // Emit socket event for real-time tracking
      socketService.emit('driver_location_update', { orderId: activeAssignment.id, location: newLoc });
      
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeAssignment, currentLocation, dispatch]);

  if (!activeAssignment) {
    return <Typography>No active delivery</Typography>;
  }

  const getStepIndex = () => {
    switch (activeAssignment.status) {
      case 'assigned': return 0;
      case 'accepted': return 1;
      case 'arrived_pickup': return 2;
      case 'picked_up': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
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

  const progress = (activeStep / 4) * 100; // 4 is max index

  const handleStatusUpdate = (newStatus: any) => {
    dispatch(updateAssignmentStatus(newStatus));
    socketService.emit('delivery_status_update', { orderId: activeAssignment.id, status: newStatus });
  };

  const handlePickupConfirm = () => {
    handleStatusUpdate('picked_up');
    setPickupDialog(false);
  };

  const handleDeliveryConfirm = () => {
    // skip otp check for mock
    handleStatusUpdate('delivered');
    setDeliveryDialog(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Active Delivery
        </Typography>
        <Chip
          label={`Order #${activeAssignment.id}`}
          color="primary"
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400 }}>
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
                ...(currentLocation ? [{
                  id: 'partner',
                  position: currentLocation,
                  type: 'partner',
                  title: 'Your Location',
                }] : []),
              ]}
              showTraffic={true}
              height="100%"
            />
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
              {steps.map((step, index) => (
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
          {/* Action Buttons */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Actions</Typography>
            {activeStep === 1 && (
              <Button fullWidth variant="contained" color="primary" size="large" onClick={() => handleStatusUpdate('arrived_pickup')}>
                Arrived at Restaurant
              </Button>
            )}
            {activeStep === 2 && (
              <Button fullWidth variant="contained" color="secondary" size="large" onClick={() => setPickupDialog(true)}>
                Confirm Pickup
              </Button>
            )}
            {activeStep === 3 && (
              <Button fullWidth variant="contained" color="warning" size="large" onClick={() => handleStatusUpdate('out_for_delivery')}>
                Start Delivery
              </Button>
            )}
            {activeStep === 4 && (
              <Button fullWidth variant="contained" color="success" size="large" onClick={() => setDeliveryDialog(true)}>
                Mark Delivered
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}><Restaurant /></Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{activeAssignment.restaurant}</Typography>
                <Typography variant="body2" color="text.secondary">Pickup Location</Typography>
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
              <Avatar sx={{ bgcolor: 'success.light' }}><Person /></Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{activeAssignment.customer}</Typography>
                <Typography variant="body2" color="text.secondary">Drop-off Location</Typography>
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
            <Typography variant="h6" fontWeight={700} gutterBottom>Order Details</Typography>
            {activeAssignment.items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{item.quantity}x {item.name}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Earnings</Typography>
              <Typography variant="subtitle1" fontWeight={700} color="success.main">₹{activeAssignment.amount}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Pickup Dialog */}
      <Dialog open={pickupDialog} onClose={() => setPickupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Pickup</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Have you collected all items from the restaurant?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePickupConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialog} onClose={() => setDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Delivery</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Handed over the order to customer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDeliveryConfirm}>Delivered</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveDelivery;