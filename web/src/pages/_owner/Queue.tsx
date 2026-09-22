import React, { useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Paper, Grid, Divider } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { fetchOwnerQueueThunk, acceptOrderThunk, rejectOrderThunk } from '../../features/orders/ownerOrderApi';
import { useOwnerSocket } from '../../features/orders/hooks/useOwnerSocket';

const Queue: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pendingOrders, isLoading, error } = useAppSelector((state) => state.ownerOrders);
  useOwnerSocket();

  useEffect(() => {
    dispatch(fetchOwnerQueueThunk());
  }, [dispatch]);

  if (isLoading && pendingOrders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && pendingOrders.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="outlined" onClick={() => dispatch(fetchOwnerQueueThunk())}>
          Retry
        </Button>
      </Box>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No pending orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Check back soon
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Order Queue
      </Typography>
      <Grid container spacing={3}>
        {pendingOrders.map((order) => (
          <Grid item xs={12} md={6} lg={4} key={order.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    #{order.id.substring(0, 8)}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ₹{order.total}
                  </Typography>
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

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    disabled={isLoading}
                    onClick={() => dispatch(acceptOrderThunk(order.id))}
                  >
                    Accept
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                    onClick={() => dispatch(rejectOrderThunk(order.id))}
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Queue;
