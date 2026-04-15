import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import LiveDeliveryTracker from '../../../shared/components/tracking/LiveDeliveryTracker';

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock locations (replace with actual data from API)
  const restaurantLocation = { lat: 19.1136, lng: 72.8697 };
  const customerLocation = { lat: 19.0760, lng: 72.8777 };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        <Typography variant="h4" fontWeight={800}>
          Track Your Order
        </Typography>
      </Box>

      <LiveDeliveryTracker
        orderId={id || 'ORD-001'}
        restaurantLocation={restaurantLocation}
        customerLocation={customerLocation}
      />
    </Container>
  );
};

export default OrderTracking;