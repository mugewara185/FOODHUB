import React, { useState } from 'react';
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

interface DeliveryStep {
  label: string;
  description: string;
  completed: boolean;
}

const ActiveDelivery: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [pickupDialog, setPickupDialog] = useState(false);
  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [otp, setOtp] = useState('');

  const steps: DeliveryStep[] = [
    { label: 'Order Assigned', description: 'You have accepted the order', completed: true },
    { label: 'Reached Restaurant', description: 'Arrive at restaurant for pickup', completed: true },
    { label: 'Order Picked Up', description: 'Food collected from restaurant', completed: false },
    { label: 'On the Way', description: 'Heading to customer location', completed: false },
    { label: 'Delivered', description: 'Order delivered to customer', completed: false },
  ];

  const progress = (activeStep / (steps.length - 1)) * 100;

  const orderDetails = {
    id: 'ORD-2024-001',
    restaurant: 'Spice Garden',
    restaurantAddress: '123 Park Avenue, Andheri East',
    restaurantPhone: '+91 98765 43210',
    customer: 'John Doe',
    customerAddress: '456 Main Street, Andheri West',
    customerPhone: '+91 98765 43211',
    items: [
      { name: 'Butter Chicken', quantity: 1, price: 320 },
      { name: 'Garlic Naan', quantity: 2, price: 80 },
      { name: 'Veg Biryani', quantity: 1, price: 220 },
    ],
    total: 700,
    deliveryFee: 89,
    otp: '1234',
    distance: '3.2 km',
    estimatedTime: '15 min',
  };

  const handlePickupConfirm = () => {
    setActiveStep(2);
    setPickupDialog(false);
  };

  const handleDeliveryConfirm = () => {
    if (otp === orderDetails.otp) {
      setActiveStep(4);
      setDeliveryDialog(false);
    } else {
      alert('Invalid OTP');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Active Delivery
        </Typography>
        <Chip
          label={`Order #${orderDetails.id}`}
          color="primary"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Map */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400 }}>
            <Map
              center={{ lat: 19.0760, lng: 72.8777 }}
              markers={[
                {
                  id: 'restaurant',
                  position: { lat: 19.1136, lng: 72.8697 },
                  type: 'restaurant',
                  title: orderDetails.restaurant,
                },
                {
                  id: 'customer',
                  position: { lat: 19.0760, lng: 72.8777 },
                  type: 'customer',
                  title: orderDetails.customer,
                },
                {
                  id: 'partner',
                  position: { lat: 19.0945, lng: 72.8735 },
                  type: 'partner',
                  title: 'Your Location',
                },
              ]}
              showTraffic={true}
              height="100%"
            />
          </Paper>

          {/* Progress */}
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

            <Stepper activeStep={activeStep} orientation="vertical">
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

        {/* Right Column - Order Details */}
        <Grid item xs={12} lg={4}>
          {/* Restaurant Info */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Restaurant />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {orderDetails.restaurant}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pickup Location
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{orderDetails.restaurantAddress}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{orderDetails.restaurantPhone}</Typography>
              </Box>
            </Stack>

            {activeStep === 1 && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => setPickupDialog(true)}
                sx={{ mt: 2 }}
              >
                Confirm Pickup
              </Button>
            )}
          </Paper>

          {/* Customer Info */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {orderDetails.customer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivery Location
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{orderDetails.customerAddress}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{orderDetails.customerPhone}</Typography>
              </Box>
            </Stack>

            {activeStep === 3 && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => setDeliveryDialog(true)}
                sx={{ mt: 2 }}
              >
                Mark as Delivered
              </Button>
            )}
          </Paper>

          {/* Order Summary */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Order Summary
            </Typography>

            <Stack spacing={1} sx={{ mb: 2 }}>
              {orderDetails.items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {item.quantity}x {item.name}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{item.price * item.quantity}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2">₹{orderDetails.total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Fee
                </Typography>
                <Typography variant="body2" color="success.main">
                  + ₹{orderDetails.deliveryFee}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Your Earnings
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  ₹{orderDetails.deliveryFee}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Delivery Info */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Navigation color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Distance
                  </Typography>
                  <Typography variant="h6">{orderDetails.distance}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTime color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Time
                  </Typography>
                  <Typography variant="h6">{orderDetails.estimatedTime}</Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Pickup Confirmation Dialog */}
      <Dialog open={pickupDialog} onClose={() => setPickupDialog(false)}>
        <DialogTitle>Confirm Pickup</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Have you picked up the order from {orderDetails.restaurant}?
          </Typography>
          <Alert severity="info">
            Make sure all items are correct before confirming
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePickupConfirm}>
            Yes, I've picked up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Confirmation Dialog */}
      <Dialog open={deliveryDialog} onClose={() => setDeliveryDialog(false)}>
        <DialogTitle>Complete Delivery</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              Enter OTP to confirm delivery
            </Typography>
            <TextField
              fullWidth
              label="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 4-digit OTP"
            />
            <Typography variant="caption" color="text.secondary">
              Ask the customer for the OTP to confirm delivery
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleDeliveryConfirm}
            disabled={otp.length !== 4}
          >
            Confirm Delivery
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveDelivery;