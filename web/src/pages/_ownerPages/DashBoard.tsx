import React, { useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Avatar, Chip, Button,
  LinearProgress, List, ListItem, ListItemText, ListItemAvatar, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AttachMoney, ShoppingBag, People, Restaurant,
  AccessTime, Star, Visibility, CheckCircle, Schedule, Warning,
  RestaurantMenu, LocalOffer, PhotoLibrary, Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { fetchOwnerData, updateOrderStatus } from '../../features/owner/store/ownerSlice';
import { type Order } from '../../core/types/food';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Schedule color="warning" />;
    case 'preparing': return <Restaurant color="info" />;
    case 'out_for_delivery': return <CheckCircle color="success" />;
    case 'delivered': return <CheckCircle color="success" />;
    default: return <CheckCircle />;
  }
};

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { analytics, menu, orders, status, error, restaurant } = useAppSelector((state: any) => state.owner);

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

  const liveOrders = orders.filter((o: any) => ['pending', 'confirmed', 'preparing'].includes(o.status)).slice(0, 5);
  const outOfStockItems = menu.filter((i: any) => !i.isAvailable);

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    let nextStatus: any = 'preparing';
    if (currentStatus === 'pending') nextStatus = 'confirmed';
    else if (currentStatus === 'confirmed') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'out_for_delivery';
    dispatch(updateOrderStatus({ orderId, status: nextStatus }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            {restaurant?.name || 'Restaurant'} Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening at your restaurant today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<RestaurantMenu />} onClick={() => navigate('/owner/menu')}>
            Menu
          </Button>
          <Button variant="outlined" startIcon={<Visibility />} onClick={() => navigate(`/restaurant/${restaurant?.id}`)}>
            View Store
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Today's Revenue</Typography>
                  <Typography variant="h4" fontWeight={700}>₹{analytics?.todayRevenue.toFixed(2)}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}><AttachMoney /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pending Orders</Typography>
                  <Typography variant="h4" fontWeight={700}>{analytics?.pendingOrders}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}><ShoppingBag /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Completed Orders</Typography>
                  <Typography variant="h4" fontWeight={700}>{analytics?.completedOrders}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}><CheckCircle /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Customer Rating</Typography>
                  <Typography variant="h4" fontWeight={700}>{analytics?.averageRating} ⭐</Typography>
                  <Typography variant="body2" color="text.secondary">Based on {analytics?.reviewCount} reviews</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}><Star /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Live Orders Queue */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Live Orders Queue</Typography>
              <Chip label={`${analytics?.pendingOrders} pending`} color="warning" size="small" />
            </Box>
            <List>
              {liveOrders.map((order: any, index: number) => (
                <React.Fragment key={order.id}>
                  <ListItem sx={{ bgcolor: order.status === 'pending' ? 'warning.light' : 'info.light', borderRadius: 2, mb: 1 }}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: 'white' }}>{getStatusIcon(order.status)}</Avatar></ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" fontWeight={600}>Order #{order.id.slice(0, 6)}</Typography>
                          <Typography variant="body2" fontWeight={600}>₹{order.total.toFixed(2)}</Typography>
                        </Box>
                      }
                      secondary={`${order.items.length} items • ${new Date(order.createdAt).toLocaleTimeString()}`}
                    />
                    <Button size="small" variant="contained" color={order.status === 'pending' ? 'warning' : 'success'} sx={{ ml: 2 }} onClick={() => handleUpdateStatus(order.id, order.status)}>
                      {order.status === 'pending' ? 'Accept' : (order.status === 'confirmed' ? 'Start Prep' : 'Ready')}
                    </Button>
                  </ListItem>
                  {index < liveOrders.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
              {liveOrders.length === 0 && <Typography color="text.secondary">No active orders right now.</Typography>}
            </List>
            <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/owner/orders')}>View All Orders</Button>
          </Paper>
        </Grid>

        {/* Menu Alerts */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Menu Status</Typography>
            <Box sx={{ mt: 3 }}>
              {outOfStockItems.length > 0 ? (
                <Alert severity="warning" icon={<Warning />}>
                  {outOfStockItems.length} items are marked out of stock.
                  <List dense>
                    {outOfStockItems.slice(0, 3).map((i: any) => <ListItem key={i.id}><ListItemText primary={i.name} /></ListItem>)}
                  </List>
                </Alert>
              ) : (
                <Alert severity="success" icon={<CheckCircle />}>All items are in stock.</Alert>
              )}
            </Box>
            <Button fullWidth variant="outlined" sx={{ mt: 3 }} onClick={() => navigate('/owner/menu')}>Manage Menu</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default OwnerDashboard;