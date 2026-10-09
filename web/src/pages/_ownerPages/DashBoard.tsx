import React, { useState } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Avatar, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Divider,
  Alert, CircularProgress, Dialog, DialogContent
} from '@mui/material';
import {
  ShoppingBag, Restaurant, Star, CheckCircle, Schedule, Chat, LocationOn
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import { 
  acceptOrderThunk, 
  rejectOrderThunk, 
  markPreparingThunk, 
  markReadyThunk,
  confirmHandoffThunk
} from '../../features/orders/ownerOrderApi';
import { Button, Stack } from '@mui/material';
import OrderChat from '../../shared/components/OrderChat/OrderChat';
import LiveDeliveryTracker from '../../features/orders/components/tracking/LiveDeliveryTracker';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending_owner': return <Schedule color="warning" />;
    case 'preparing': return <Restaurant color="info" />;
    case 'confirmed': return <CheckCircle color="info" />;
    case 'out_for_delivery': return <CheckCircle color="success" />;
    case 'delivered': return <CheckCircle color="success" />;
    default: return <CheckCircle />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_owner': return 'warning.light';
    case 'confirmed': return 'info.light';
    case 'preparing': return 'info.light';
    default: return 'grey.100';
  }
};

const getStatusChipColor = (status: string) => {
  switch (status) {
    case 'pending_owner': return 'warning';
    case 'confirmed': return 'info';
    case 'preparing': return 'info';
    default: return 'default';
  }
};

const OwnerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pendingOrders, activeOrders, isLoading } = useAppSelector((state: any) => state.ownerOrders);
  const { data: restaurant } = useAppSelector((state: any) => state.ownerRestaurant);
  const { user } = useAppSelector((state: any) => state.auth);
  
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const pendingCount = pendingOrders?.length || 0;
  const activeCount = activeOrders?.length || 0;
  
  if (isLoading && pendingCount === 0 && activeCount === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  const lastPending = pendingOrders ? pendingOrders.slice(0, 5) : [];
  const lastActive = activeOrders ? activeOrders.slice(0, 5) : [];

  const renderActions = (order: any) => {
    switch(order.status) {
      case 'pending_owner':
        return (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="contained" color="success" onClick={() => dispatch(acceptOrderThunk(order.id))}>Accept</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => dispatch(rejectOrderThunk(order.id))}>Reject</Button>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Chat />} onClick={() => setChatOrderId(order.id)}>Chat</Button>
          </Stack>
        );
      case 'confirmed':
        return (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="contained" color="primary" onClick={() => dispatch(markPreparingThunk(order.id))}>Mark Preparing</Button>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Chat />} onClick={() => setChatOrderId(order.id)}>Chat</Button>
          </Stack>
        );
      case 'preparing':
        return (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="contained" color="info" onClick={() => dispatch(markReadyThunk(order.id))}>Mark Ready</Button>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Chat />} onClick={() => setChatOrderId(order.id)}>Chat</Button>
          </Stack>
        );
      case 'ready_for_pickup':
        return (
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mr: 2 }}>Waiting for partner</Typography>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Chat />} onClick={() => setChatOrderId(order.id)}>Chat</Button>
          </Stack>
        );
      case 'partner_assigned':
        return (
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
            {order.deliveryStatus === 'arrived_pickup' ? (
              <>
                <Chip size="small" color="error" label="Partner Arrived — Awaiting Handoff" sx={{ mr: 2, animation: 'pulse 2s infinite' }} />
                <Button size="small" variant="contained" color="primary" onClick={() => dispatch(confirmHandoffThunk(order.id))}>Confirm Handoff</Button>
              </>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mr: 2 }}>Partner is on the way</Typography>
            )}
            <Button size="small" variant="outlined" color="primary" startIcon={<LocationOn />} onClick={() => setTrackingOrderId(order.id)}>Track</Button>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Chat />} onClick={() => setChatOrderId(order.id)}>Chat</Button>
          </Stack>
        );
      default:
        return (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Chat />} onClick={() => setChatOrderId(order.id)}>Chat</Button>
          </Stack>
        );
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {restaurant?.name || 'Restaurant Dashboard'}
            {restaurant && (
              <Chip 
                label={restaurant.isOpen ? 'Open' : 'Closed'} 
                color={restaurant.isOpen ? 'success' : 'error'} 
                size="small" 
              />
            )}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening at your restaurant today.
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pending Orders</Typography>
                  <Typography variant="h4" fontWeight={700}>{pendingCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}><ShoppingBag /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Active Orders</Typography>
                  <Typography variant="h4" fontWeight={700}>{activeCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}><Restaurant /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Customer Rating</Typography>
                  <Typography variant="h4" fontWeight={700}>{restaurant?.rating || 0} ⭐</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}><Star /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Pending Orders (Last 5)</Typography>
            {lastPending.length === 0 ? (
              <Alert severity="info">No pending orders.</Alert>
            ) : (
              <List>
                {lastPending.map((order: any, index: number) => (
                  <React.Fragment key={order.id}>
                    <ListItem sx={{ bgcolor: getStatusColor(order.status), borderRadius: 2, mb: 1 }}>
                      <ListItemAvatar><Avatar sx={{ bgcolor: 'white' }}>{getStatusIcon(order.status)}</Avatar></ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight={600}>Order #{order.id.slice(0, 6)}</Typography>
                            <Chip label={order.status} size="small" color={getStatusChipColor(order.status) as any} />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {`₹${order.total?.toFixed(2) || order.subtotal?.toFixed(2) || 0}`}
                            </Typography>
                            {renderActions(order)}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < lastPending.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Active Orders (Last 5)</Typography>
            {lastActive.length === 0 ? (
              <Alert severity="info">No active orders.</Alert>
            ) : (
              <List>
                {lastActive.map((order: any, index: number) => (
                  <React.Fragment key={order.id}>
                    <ListItem sx={{ bgcolor: getStatusColor(order.status), borderRadius: 2, mb: 1 }}>
                      <ListItemAvatar><Avatar sx={{ bgcolor: 'white' }}>{getStatusIcon(order.status)}</Avatar></ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight={600}>Order #{order.id.slice(0, 6)}</Typography>
                            <Chip label={order.status} size="small" color={getStatusChipColor(order.status) as any} />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {`₹${order.total?.toFixed(2) || order.subtotal?.toFixed(2) || 0}`}
                            </Typography>
                            {renderActions(order)}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < lastActive.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {pendingCount === 0 && activeCount === 0 && !isLoading && (
        <Box mt={4}>
          <Alert severity="success" icon={<CheckCircle />}>All caught up! No active or pending orders.</Alert>
        </Box>
      )}

      <Dialog open={!!chatOrderId} onClose={() => setChatOrderId(null)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          {chatOrderId && user && (
            <OrderChat 
              orderId={chatOrderId}
              currentUserId={user.id}
              currentUserRole="owner"
              currentUserName={user.name || 'Owner'}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!trackingOrderId} onClose={() => setTrackingOrderId(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 2, height: '80vh' }}>
          {trackingOrderId && (
            <LiveDeliveryTracker 
              orderId={trackingOrderId}
              orderStatus="partner_assigned"
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OwnerDashboard;