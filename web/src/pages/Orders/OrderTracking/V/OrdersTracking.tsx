import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Rating,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  LocalShipping,
  Kitchen,
  Restaurant,
  Person,
  Phone,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { fetchOrderByIdThunk } from '@/features/orders/orderSlice';

interface OrderStatus {
  label: string;
  description: string;
  time: string;
  completed: boolean;
  icon: React.ReactNode;
}

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deliveryTime] = useState('8-10 minutes');
  const [progress, setProgress] = useState(65);

  const { items, loading } = useAppSelector(state => state.orders);
  const order = items.find(o => o.id === id);

  useEffect(() => {
    if (id && !order) {
      dispatch(fetchOrderByIdThunk(id));
    }
  }, [id, dispatch, order]);

  const steps: OrderStatus[] = [
    {
      label: 'Order Confirmed',
      description: 'Your order has been received and confirmed',
      time: '12:30 PM',
      completed: true,
      icon: <CheckCircle />,
    },
    {
      label: 'Preparing Food',
      description: 'Your meal is being prepared by the chef',
      time: '12:35 PM',
      completed: true,
      icon: <Kitchen />,
    },
    {
      label: 'Quality Check',
      description: 'Food is being quality checked and packed',
      time: '12:42 PM',
      completed: true,
      icon: <CheckCircle />,
    },
    {
      label: 'Out for Delivery',
      description: 'Your order is on the way',
      time: '12:50 PM',
      completed: false,
      icon: <LocalShipping />,
    },
    {
      label: 'Delivered',
      description: 'Your order has been delivered',
      time: 'Pending',
      completed: false,
      icon: <CheckCircle />,
    },
  ];

  // Simulate real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Track Order
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Order #{id}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Tracking */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            {/* Estimated Time */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estimated Delivery
              </Typography>
              <Typography variant="h2" fontWeight={800} color="primary.main">
                {deliveryTime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your food is on the way!
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Delivery Progress
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight={600}>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color="primary"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Stepper */}
            <Stepper orientation="vertical" activeStep={2} sx={{ mt: 2 }}>
              {steps.map((step, index) => (
                <Step key={step.label} completed={step.completed}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: step.completed ? 'success.main' : 'grey.300',
                          color: 'white',
                        }}
                      >
                        {step.icon}
                      </Box>
                    )}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.time}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Column - Delivery Info */}
        <Grid item xs={12} md={5}>
          {/* Delivery Partner */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Partner
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Rahul Sharma
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ⭐ 4.9 • 150+ deliveries
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2">+91 98765 43210</Typography>
                <Button size="small" sx={{ ml: 'auto' }}>
                  Call
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2">Vehicle: Bike (MH 12 AB 1234)</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Delivery Address */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Address
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <LocationOn sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Home
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  123 Main Street, Andheri West
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mumbai, Maharashtra - 400053
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Phone: +91 98765 43210
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Restaurant Info */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Restaurant
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"
                  alt="Restaurant"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {order?.restaurantName || 'Restaurant'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Order Total
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ₹{order?.total?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body2">{order?.paymentMethod?.toUpperCase()}</Typography>
              </Box>
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 3 }}
              onClick={() => navigate(`/restaurants/${order?.restaurantId}`)}
            >
              View Restaurant
            </Button>
          </Paper>

          {/* Need Help */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Need Assistance?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Contact our support team for any help with your order
            </Typography>
            <Button
              variant="contained"
              color="inherit"
              sx={{ color: 'primary.main' }}
              fullWidth
            >
              Contact Support
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderTracking;