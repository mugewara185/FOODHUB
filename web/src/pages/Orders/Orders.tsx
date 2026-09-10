import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Button,
  Rating,
  Divider,
  LinearProgress,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  LocationOn,
  Restaurant,
  ShoppingBag,
  Star,
  MoreVert,
  Replay,
  RateReview,
  Help,
  Cancel,
  CheckCircle,
  LocalShipping,
  Kitchen,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  fetchOrdersThunk,
  cancelOrderThunk,
  selectOrders,
  selectOrdersLoading,
  selectOrderCancelling,
  selectOrderError,
} from '@/features/orders/orderSlice';
import type { Order } from '@/core/types';


const Orders: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const orders = useAppSelector(selectOrders);
  const isLoading = useAppSelector(selectOrdersLoading);
  const isCancelling = useAppSelector(selectOrderCancelling);
  const orderError = useAppSelector(selectOrderError);

  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Fetch orders on mount
  useEffect(() => {
    dispatch(fetchOrdersThunk());
  }, [dispatch]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return order.status === 'delivered';
    if (activeTab === 2) return ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
    if (activeTab === 3) return order.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'info',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Order['status']) => {
    const icons: Record<Order['status'], React.ReactNode> = {

      pending: <AccessTime />,
      confirmed: <CheckCircle />,
      preparing: <Kitchen />,
      out_for_delivery: <LocalShipping />,
      delivered: <CheckCircle />,
      cancelled: <Cancel />,
    };
    return icons[status];
  };

  const getStatusText = (status: Order['status']) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleOrderAction = (action: string, orderId: string) => {
    console.log(`${action} for order ${orderId}`);
    setAnchorEl(null);
    
    switch(action) {
      case 'track':
        navigate(`/orders/${orderId}/track`);
        break;
      case 'reorder':
        // Add items to cart
        navigate('/cart');
        break;
      case 'review':
        navigate(`/orders/${orderId}/review`);
        break;
      case 'help':
        navigate('/help');
        break;
      case 'cancel':
        // Dispatch cancel thunk — updates Redux state on success, shows error on failure
        dispatch(cancelOrderThunk(orderId));
        break;
      default:
        break;
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          My Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track, review, and reorder your meals
        </Typography>
      </Box>

      {/* Loading indicator */}
      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Error alert */}
      {orderError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {orderError}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            pt: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab label="All Orders" />
          <Tab label="Delivered" />
          <Tab label="Ongoing" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      {/* Orders List */}
      <Grid container spacing={3}>
        {filteredOrders.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ready to order? Check out our restaurants
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/restaurants')}
              >
                Browse Restaurants
              </Button>
            </Box>
          </Grid>
        ) : (
          filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Order Header */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Restaurant placeholder image */}
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            overflow: 'hidden',
                            flexShrink: 0,
                            bgcolor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Restaurant sx={{ color: 'text.secondary' }} />
                        </Box>

                        {/* Order Info — using shared Order type fields */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                              {order.restaurantName}
                            </Typography>
                            <Chip
                              size="small"
                              icon={getStatusIcon(order.status) as React.ReactElement}
                              label={getStatusText(order.status)}
                              color={getStatusColor(order.status) as any}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Order #{order.id} • {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                            {order.items.map((item, idx) => (
                              <Typography key={idx} variant="body2" color="text.secondary">
                                {item.quantity}x {item.name}
                                {idx < order.items.length - 1 ? ',' : ''}
                              </Typography>
                            ))}
                          </Stack>

                          {order.status === 'out_for_delivery' && (
                            <Box sx={{ mt: 2, maxWidth: 300 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  Estimated Delivery
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="primary">
                                  In progress
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={70}
                                color="primary"
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: { xs: 'flex-start', md: 'flex-end' },
                        height: '100%',
                      }}>
                        <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                          ₹{order.total}

                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                          <Button
                            variant={order.status === 'cancelled' ? 'outlined' : 'contained'}
                            size="small"
                            startIcon={<Replay />}
                            onClick={() => handleOrderAction('reorder', order.id)}
                          >
                            Reorder
                          </Button>
                          
                          {order.status === 'delivered' && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<RateReview />}
                              onClick={() => handleOrderAction('review', order.id)}
                            >
                              Review
                            </Button>
                          )}

                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, order.id)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Order Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOrderAction('track', selectedOrder!)}>
          <LocalShipping sx={{ mr: 1, fontSize: 20 }} />
          Track Order
        </MenuItem>
        <MenuItem onClick={() => handleOrderAction('help', selectedOrder!)}>
          <Help sx={{ mr: 1, fontSize: 20 }} />
          Get Help
        </MenuItem>
        <MenuItem onClick={() => handleOrderAction('details', selectedOrder!)}>
          <Restaurant sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleOrderAction('cancel', selectedOrder!)}
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1, fontSize: 20 }} />
          Cancel Order
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Orders;