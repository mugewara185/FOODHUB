import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import LiveDeliveryTracker from '../../../features/orders/components/tracking/LiveDeliveryTracker';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { fetchOrderByIdThunk, selectCurrentOrder } from '../../../features/orders/orderSlice';

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentOrder = useAppSelector(selectCurrentOrder);

  useEffect(() => {
    if (id && (!currentOrder || currentOrder.id !== id)) {
      dispatch(fetchOrderByIdThunk(id));
    }
  }, [id, currentOrder, dispatch]);

  if (!currentOrder) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Fallback coords if real one missing
  const restaurantLocation = { lat: 12.9716, lng: 77.5946 };
  // The backend uses restaurant + 0.02 for demo destination
  const customerLocation = currentOrder.deliveryInfo?.coordinates || { lat: restaurantLocation.lat + 0.02, lng: restaurantLocation.lng + 0.02 };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mb: 2 }}>Back to Orders</Button>
        <Typography variant="h4" fontWeight={800}>Track Your Order</Typography>
      </Box>
      <LiveDeliveryTracker
        orderId={currentOrder.id}
        orderStatus={currentOrder.status}
        restaurantLocation={restaurantLocation}
        customerLocation={customerLocation}
      />
    </Container>
  );
};

export default OrderTracking;