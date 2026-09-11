import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, Box, Paper, Tabs, Tab, Card, CardContent,
  Chip, Button, Rating, Divider, LinearProgress, Stack, IconButton, Menu, MenuItem, CircularProgress
} from '@mui/material';
import {
  MoreVert, Replay, RateReview, Help, Cancel, LocalShipping,
  CheckCircle, AccessTime, Restaurant, ShoppingBag
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { fetchOrdersThunk, cancelOrderThunk } from '@/features/orders/orderSlice';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const { items: orders, loading, cancelling } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrdersThunk());
  }, [dispatch]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return order.status === 'delivered';
    if (activeTab === 2) return ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
    if (activeTab === 3) return order.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'info',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      case 'out_for_delivery': return <LocalShipping />;
      case 'pending':
      case 'confirmed':
      case 'preparing': return <AccessTime />;
      default: return <Restaurant />;
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleOrderAction = (action: string, orderId: string) => {
    handleMenuClose();
    switch (action) {
      case 'reorder':
        break;
      case 'review':
        // find order -> go to restaurant review
        const order = orders.find(o => o.id === orderId);
        if (order) navigate('/restaurants/' + order.restaurantId);
        break;
      case 'track':
        navigate('/orders/tracking/' + orderId);
        break;
      case 'details':
        navigate('/orders/tracking/' + orderId);
        break;
      case 'cancel':
        dispatch(cancelOrderThunk(orderId));
        break;
      case 'help':
        break;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        My Orders
      </Typography>

      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
            },
          }}
        >
          <Tab label="All Orders" />
          <Tab label="Completed" />
          <Tab label="Ongoing" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12} display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Grid>
        ) : filteredOrders.length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <ShoppingBag sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ready to order? Check out our restaurants
              </Typography>
              <Button variant="contained" onClick={() => navigate('/restaurants')}>
                Browse Restaurants
              </Button>
            </Box>
          </Grid>
        ) : (
          filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card sx={{ borderRadius: 3, position: 'relative', overflow: 'visible', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={order.restaurant?.image || ''} alt={order.restaurant?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                              {order.restaurant?.name}
                            </Typography>
                            <Chip size="small" icon={getStatusIcon(order.status)} label={getStatusText(order.status)} color={getStatusColor(order.status) as any} />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Order #{order.id} ? {new Date(order.createdAt || order.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                            {order.items?.map((item, idx) => (
                              <Typography key={idx} variant="body2" color="text.secondary">
                                {item.quantity}x {item.name || item.foodItemId}
                                {idx < (order.items?.length || 0) - 1 ? ',' : ''}
                              </Typography>
                            ))}
                          </Stack>

                          {order.status === 'out_for_delivery' && (
                            <Box sx={{ mt: 2, maxWidth: 300 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>Estimated Delivery</Typography>
                                <Typography variant="body2" fontWeight={600} color="primary">{order.deliveryTime || '30 min'}</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={70} color="primary" sx={{ height: 6, borderRadius: 3 }} />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                          
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                          <Button variant={order.status === 'cancelled' ? 'outlined' : 'contained'} size="small" startIcon={<Replay />} onClick={() => handleOrderAction('reorder', order.id)}>
                            Reorder
                          </Button>
                          
                          {order.status === 'delivered' && (
                            <Button variant="outlined" size="small" startIcon={<RateReview />} onClick={() => handleOrderAction('review', order.id)}>
                              Review
                            </Button>
                          )}

                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, order.id)}>
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

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleOrderAction('track', selectedOrder!)}>
          <LocalShipping sx={{ mr: 1, fontSize: 20 }} /> Track Order
        </MenuItem>
        <MenuItem onClick={() => handleOrderAction('details', selectedOrder!)}>
          <Restaurant sx={{ mr: 1, fontSize: 20 }} /> View Details
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOrderAction('cancel', selectedOrder!)} sx={{ color: 'error.main' }}>
          <Cancel sx={{ mr: 1, fontSize: 20 }} /> Cancel Order
        </MenuItem>
      </Menu>
    </Container>
  );
};
export default Orders;

