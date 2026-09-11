import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Stack,
  Grid,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Fade,
  Grow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Receipt,
  LocationOn,
  AccessTime,
  DeliveryDining,
  Restaurant,
  Phone,
  Email,
  Print,
  Share,
  ArrowBack,
  Download,
  Star,
  Directions,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Mock order data (would come from Redux/API)
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  specialInstructions?: string;
}

interface OrderDetails {
  id: string;
  orderDate: string;
  estimatedDelivery: string;
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
  restaurant: {
    id: string;
    name: string;
    image: string;
    address: string;
    phone: string;
  };
  items: OrderItem[];
  deliveryAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: string;
  orderSummary: {
    itemTotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
  };
  specialRequests?: string;
}

const ORDER_DATA: OrderDetails = {
  id: 'ORD-2024-001234',
  orderDate: '2024-01-15T14:30:00',
  estimatedDelivery: '2024-01-15T15:00:00',
  status: 'confirmed',
  restaurant: {
    id: '1',
    name: 'Spice Garden',
    image: '/api/placeholder/100/100',
    address: '123 Food Street, Mumbai',
    phone: '+91 9876543210',
  },
  deliveryAddress: {
    name: 'John Doe',
    street: '123 Main Street, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    phone: '+91 9876543210',
  },
  paymentMethod: 'Cash on Delivery',
  items: [
    { id: '1', name: 'Butter Chicken', quantity: 2, price: 320 },
    { id: '2', name: 'Garlic Naan', quantity: 3, price: 80 },
    { id: '3', name: 'Extra Butter', quantity: 1, price: 30, specialInstructions: 'Extra butter on naan' },
  ],
  orderSummary: {
    itemTotal: 1040,
    deliveryFee: 29,
    tax: 52,
    discount: 104,
    total: 1017,
  },
  specialRequests: 'Please deliver to the back gate',
};

// Status timeline steps
const statusSteps = [
  { label: 'Order Confirmed', icon: <CheckCircle />, time: '2:30 PM' },
  { label: 'Preparing', icon: <Restaurant />, time: '2:35 PM' },
  { label: 'Out for Delivery', icon: <DeliveryDining />, time: '2:50 PM' },
  { label: 'Delivered', icon: <CheckCircle />, time: '3:15 PM' },
];

import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { fetchOrderByIdThunk, selectCurrentOrder, selectOrdersLoading } from '../../features/orders/orderSlice';

// Map real order to mock-compatible details
const mapOrderToDetails = (order: any): OrderDetails => ({
  id: order.id,
  orderDate: order.createdAt,
  estimatedDelivery: order.estimatedDelivery || order.createdAt, // Fallback
  status: order.status as any,
  restaurant: {
    id: order.restaurantId,
    name: order.restaurantName || 'Restaurant',
    image: '/api/placeholder/100/100', // Real image if available
    address: order.restaurantAddress || 'Address',
    phone: '+91 0000000000',
  },
  items: order.items.map((item: any) => ({
    id: item.foodItemId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  })),
  deliveryAddress: {
    name: 'Customer',
    street: order.deliveryInfo?.address || 'Delivery Address',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  },
  paymentMethod: order.paymentMethod,
  orderSummary: {
    itemTotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
  },
});

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const currentOrder = useAppSelector(selectCurrentOrder);
  const isLoading = useAppSelector(selectOrdersLoading);
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(true);

  // In real app, fetch order data from API/Redux
  useEffect(() => {
    const orderId = location.state?.orderId;
    if (orderId) {
      if (currentOrder && currentOrder.id === orderId) {
        setOrder(mapOrderToDetails(currentOrder));
      } else {
        dispatch(fetchOrderByIdThunk(orderId))
          .unwrap()
          .then((fetchedOrder) => {
            setOrder(mapOrderToDetails(fetchedOrder));
          })
          .catch(() => {
            console.error('Failed to fetch order');
          });
      }
    } else if (currentOrder) {
       setOrder(mapOrderToDetails(currentOrder));
    }
  }, [location, currentOrder, dispatch]);

  // Animate status progress
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStatusIndex < statusSteps.length - 1) {
        setCurrentStatusIndex(prev => prev + 1);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentStatusIndex]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return '#4CAF50';
      case 'preparing': return '#FF9800';
      case 'out_for_delivery': return '#2196F3';
      case 'delivered': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch(status) {
      case 'confirmed': return '✅';
      case 'preparing': return '👨‍🍳';
      case 'out_for_delivery': return '🚚';
      case 'delivered': return '🎉';
      default: return '📋';
    }
  };

  const handleTrackOrder = () => {
    navigate(`/orders/track/${order.id}`);
  };

  const handleReorder = () => {
    navigate('/restaurants');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order ${order.id}`,
        text: `My order from ${order.restaurant.name}`,
        url: window.location.href,
      });
    }
  };

  if (!order) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading order details...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        py: { xs: 3, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        {/* Success Animation */}
        <Fade in={showSuccess} timeout={1000}>
          <Box
            sx={{
              textAlign: 'center',
              mb: 4,
              position: 'relative',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -5,
                    borderRadius: '50%',
                    border: '3px solid #4CAF50',
                    opacity: 0.3,
                    animation: 'pulse 2s infinite',
                  },
                }}
              >
                <CheckCircle sx={{ fontSize: 60, color: '#4CAF50' }} />
              </Box>
            </motion.div>
            <Typography
              variant="h4"
              fontWeight={800}
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Order Placed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your order has been confirmed and will be delivered shortly
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Order Status Card */}
              <Grow in timeout={1200}>
                <Paper
                  sx={{
                    p: { xs: 2, md: 4 },
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg, ${getStatusColor(order.status)}, #4CAF50)`,
                    }}
                  />

                  <Stack spacing={3}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                          Order #{order.id}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {order.restaurant.name}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<Box component="span">{getStatusEmoji(order.status)}</Box>}
                        label={order.status.replace('_', ' ').toUpperCase()}
                        sx={{
                          bgcolor: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status),
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 32,
                        }}
                      />
                    </Stack>

                    {/* Status Timeline */}
                    <Box sx={{ position: 'relative', px: { xs: 1, md: 3 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        {statusSteps.map((step, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flex: 1,
                              position: 'relative',
                            }}
                          >
                            {/* Connector Line */}
                            {index < statusSteps.length - 1 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 20,
                                  left: '50%',
                                  right: '-50%',
                                  height: 3,
                                  bgcolor: index < currentStatusIndex ? 'success.main' : '#e0e0e0',
                                  transition: 'background-color 1s ease',
                                }}
                              />
                            )}
                            
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: index <= currentStatusIndex ? 'success.main' : '#e0e0e0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.5s ease',
                                zIndex: 1,
                                color: 'white',
                                fontSize: '1.2rem',
                              }}
                            >
                              {step.icon}
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 1,
                                textAlign: 'center',
                                fontWeight: index <= currentStatusIndex ? 600 : 400,
                                color: index <= currentStatusIndex ? 'text.primary' : 'text.secondary',
                                display: { xs: 'none', sm: 'block' },
                              }}
                            >
                              {step.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.6rem',
                                color: 'text.secondary',
                                display: { xs: 'none', sm: 'block' },
                              }}
                            >
                              {step.time}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    {/* Estimated Delivery */}
                    <Box
                      sx={{
                        bgcolor: 'primary.light',
                        p: 2,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <AccessTime sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                          Estimated Delivery
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {new Date(order.estimatedDelivery).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleTrackOrder}
                        sx={{ ml: 'auto', borderRadius: 2 }}
                      >
                        Track Order
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Grow>

              {/* Order Items */}
              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 4 }}>
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>
                    Order Items
                  </Typography>
                  
                  <List>
                    {order.items.map((item, index) => (
                      <ListItem key={item.id} sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              fontWeight: 700,
                            }}
                          >
                            {item.quantity}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={600}>
                              {item.name}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                ₹{item.price} each
                              </Typography>
                              {item.specialInstructions && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Note: {item.specialInstructions}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <Typography variant="body1" fontWeight={700}>
                          ₹{item.price * item.quantity}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>

                  {order.specialRequests && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Special Requests:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.specialRequests}
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Paper>

              {/* Actions */}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/')}
                  sx={{ borderRadius: 2 }}
                >
                  Back to Home
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Restaurant />}
                  onClick={handleReorder}
                  sx={{ borderRadius: 2 }}
                >
                  Reorder
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrintReceipt}
                  sx={{ borderRadius: 2 }}
                >
                  Print Receipt
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={handleShareOrder}
                  sx={{ borderRadius: 2 }}
                >
                  Share
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* Right Column - Order Details */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Delivery Details */}
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Delivery Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Delivering to
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {order.deliveryAddress.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.deliveryAddress.street}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {order.deliveryAddress.phone}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Directions />}
                    fullWidth
                    sx={{ borderRadius: 2 }}
                  >
                    Get Directions
                  </Button>
                </Stack>
              </Paper>

              {/* Payment Details */}
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Payment Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.paymentMethod}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">₹{order.orderSummary.itemTotal}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Fee
                    </Typography>
                    <Typography variant="body2">₹{order.orderSummary.deliveryFee}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tax & Charges
                    </Typography>
                    <Typography variant="body2">₹{order.orderSummary.tax}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="success.main">
                      Discount
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      -₹{order.orderSummary.discount}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      ₹{order.orderSummary.total}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Restaurant Info */}
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {order.restaurant.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {order.restaurant.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {order.restaurant.phone}
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<Star />}
                    sx={{ mt: 1 }}
                  >
                    View Restaurant
                  </Button>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                  Need Help?
                </Typography>
                <Typography variant="body2" color="primary.main" sx={{ mb: 2 }}>
                  Contact our support team for any assistance
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Phone />}
                    sx={{ borderRadius: 2 }}
                  >
                    Call
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Email />}
                    sx={{ borderRadius: 2 }}
                  >
                    Email
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* CSS Animation */}
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.3; }
              50% { transform: scale(1.1); opacity: 0.6; }
              100% { transform: scale(1); opacity: 0.3; }
            }
          `}
        </style>
      </Container>
    </Box>
  );
};

export default OrderConfirmation;