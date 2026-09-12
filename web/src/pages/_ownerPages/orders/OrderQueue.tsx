import React, { useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Chip, Button, Avatar, Divider, CircularProgress, Alert
} from '@mui/material';
import {
  Schedule, Restaurant, CheckCircle, Person, Receipt, Print, LocalShipping, LocationOn
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../core/hooks';
import { fetchOwnerData, updateOrderStatus } from '../../../features/owner/store/ownerSlice';

const OrderQueue: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, status, error } = useAppSelector((state: any) => state.owner);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchOwnerData());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  if (status === 'failed') {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus as any }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'info';
      case 'out_for_delivery': return 'secondary';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'confirmed': return <Schedule />;
      case 'preparing': return <Restaurant />;
      case 'out_for_delivery': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      default: return null;
    }
  };

  const renderOrderCard = (order: any) => (
    <Card key={order.id} sx={{ mb: 2, borderRadius: 2, borderLeft: 6, borderColor: `${getStatusColor(order.status)}.main` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>Order #{order.id.slice(0,6)}</Typography>
            <Chip size="small" icon={getStatusIcon(order.status) as any} label={order.status.replace('_', ' ')} color={getStatusColor(order.status) as any} />
          </Box>
          <Typography variant="body2" color="text.secondary">{new Date(order.createdAt).toLocaleTimeString()}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }}><Person /></Avatar>
          <Typography variant="subtitle1" fontWeight={600}>Customer {order.userId.slice(0,4)}</Typography>
        </Box>

        {order.deliveryInfo && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">{order.deliveryInfo.address || 'Delivery Address'}</Typography>
          </Box>
        )}

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {order.items.map((item: any, index: number) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{item.quantity}x {item.name}</Typography>
              </Box>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Total</Typography>
            <Typography variant="subtitle1" fontWeight={700}>₹{order.total.toFixed(2)}</Typography>
          </Box>
        </Paper>

        <Grid container spacing={1}>
          {order.status === 'pending' && (
            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="warning" startIcon={<Restaurant />} onClick={() => handleStatusChange(order.id, 'confirmed')}>
                Confirm Order
              </Button>
            </Grid>
          )}
          {order.status === 'confirmed' && (
            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="info" startIcon={<Restaurant />} onClick={() => handleStatusChange(order.id, 'preparing')}>
                Start Preparing
              </Button>
            </Grid>
          )}
          {order.status === 'preparing' && (
            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="secondary" startIcon={<LocalShipping />} onClick={() => handleStatusChange(order.id, 'out_for_delivery')}>
                Mark Out for Delivery
              </Button>
            </Grid>
          )}
          {order.status === 'out_for_delivery' && (
            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleStatusChange(order.id, 'delivered')}>
                Mark Delivered
              </Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>Order Queue</Typography>
        <Typography variant="body1" color="text.secondary">Manage and process incoming orders</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Pending / Confirmed */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'warning.light', minHeight: 500 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Schedule />
              <Typography variant="h6" fontWeight={700}>New Orders</Typography>
              <Chip label={orders.filter((o:any) => o.status === 'pending' || o.status === 'confirmed').length} color="warning" />
            </Box>
            {orders.filter((o:any) => o.status === 'pending' || o.status === 'confirmed').map(renderOrderCard)}
          </Paper>
        </Grid>

        {/* Preparing */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'info.light', minHeight: 500 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Restaurant />
              <Typography variant="h6" fontWeight={700}>Preparing</Typography>
              <Chip label={orders.filter((o:any) => o.status === 'preparing').length} color="info" />
            </Box>
            {orders.filter((o:any) => o.status === 'preparing').map(renderOrderCard)}
          </Paper>
        </Grid>

        {/* Out for Delivery / Delivered */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'success.light', minHeight: 500 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircle />
              <Typography variant="h6" fontWeight={700}>Delivery</Typography>
              <Chip label={orders.filter((o:any) => o.status === 'out_for_delivery' || o.status === 'delivered').length} color="success" />
            </Box>
            {orders.filter((o:any) => o.status === 'out_for_delivery' || o.status === 'delivered').map(renderOrderCard)}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default OrderQueue;