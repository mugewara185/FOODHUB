import React, { useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Paper, Grid, Divider, Chip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { fetchOwnerActiveThunk, markPreparingThunk, markReadyThunk } from '../../features/orders/ownerOrderApi';
import { useOwnerSocket } from '../../features/orders/hooks/useOwnerSocket';

const Active: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeOrders, isLoading, error } = useAppSelector((state) => state.ownerOrders);
  useOwnerSocket();

  useEffect(() => {
    dispatch(fetchOwnerActiveThunk());
  }, [dispatch]);

  if (isLoading && activeOrders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && activeOrders.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="outlined" onClick={() => dispatch(fetchOwnerActiveThunk())}>
          Retry
        </Button>
      </Box>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No active orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Check back soon
        </Typography>
      </Paper>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'preparing') return 'warning';
    if (status === 'confirmed') return 'info';
    return 'default';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'preparing') return 'Preparing';
    if (status === 'confirmed') return 'Confirmed';
    return status;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Active Orders
      </Typography>
      <Grid container spacing={3}>
        {activeOrders.map((order) => (
          <Grid item xs={12} md={6} lg={4} key={order.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                  <Typography variant="h6">
                    #{order.id.substring(0, 8)}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(order.status)} 
                    color={getStatusColor(order.status) as any} 
                    size="small" 
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Items:
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {order.items.map((item, idx) => (
                    <Typography key={idx} variant="body2">
                      {item.quantity}x {item.name}
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ₹{order.total}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {order.status === 'confirmed' && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      disabled={isLoading}
                      onClick={() => dispatch(markPreparingThunk(order.id))}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      disabled={isLoading}
                      onClick={() => dispatch(markReadyThunk(order.id))}
                    >
                      Mark Ready
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Active;
