import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Stack,
  Avatar,
  Rating,
  Alert,
} from '@mui/material';
import {
  Restaurant,
  LocationOn,
  AccessTime,
  AttachMoney,
  TrendingUp,
  NotificationsActive,
  LocalShipping,
} from '@mui/icons-material';

interface Order {
  id: string;
  restaurant: string;
  restaurantImage: string;
  customer: string;
  pickupAddress: string;
  dropAddress: string;
  distance: string;
  estimatedTime: string;
  amount: number;
  priority: 'high' | 'medium' | 'low';
  items: { name: string; quantity: number }[];
}

const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    restaurant: 'Spice Garden',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
    customer: 'John Doe',
    pickupAddress: '123 Park Avenue, Andheri East',
    dropAddress: '456 Main Street, Andheri West',
    distance: '3.2 km',
    estimatedTime: '15 min',
    amount: 89,
    priority: 'high',
    items: [
      { name: 'Butter Chicken', quantity: 1 },
      { name: 'Garlic Naan', quantity: 2 },
    ],
  },
  {
    id: 'ORD-2024-002',
    restaurant: 'Pizza Paradise',
    restaurantImage: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=100&h=100&fit=crop',
    customer: 'Jane Smith',
    pickupAddress: '456 Park Avenue, Andheri East',
    dropAddress: '789 Lake Road, Bandra',
    distance: '4.5 km',
    estimatedTime: '20 min',
    amount: 65,
    priority: 'medium',
    items: [
      { name: 'Margherita Pizza', quantity: 1 },
      { name: 'Garlic Bread', quantity: 1 },
    ],
  },
  {
    id: 'ORD-2024-003',
    restaurant: 'Burger House',
    restaurantImage: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
    customer: 'Mike Johnson',
    pickupAddress: '789 Beach Road, Bandra',
    dropAddress: '321 Hill Road, Juhu',
    distance: '5.8 km',
    estimatedTime: '25 min',
    amount: 52,
    priority: 'low',
    items: [
      { name: 'Chicken Burger', quantity: 2 },
      { name: 'French Fries', quantity: 1 },
    ],
  },
];

const AvailableOrders: React.FC = () => {
  const [orders] = useState<Order[]>(mockOrders);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Available Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {orders.length} orders waiting for delivery
          </Typography>
        </Box>
        <Chip
          icon={<NotificationsActive />}
          label="Live Updates"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Orders Grid */}
      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} md={6} key={order.id}>
            <Card
              sx={{
                borderRadius: 3,
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              {/* Priority Badge */}
              <Chip
                label={`${order.priority.toUpperCase()} PRIORITY`}
                color={getPriorityColor(order.priority) as any}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: 20,
                  fontWeight: 600,
                }}
              />

              <CardContent sx={{ p: 3 }}>
                {/* Restaurant Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={order.restaurantImage}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {order.restaurant}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Order #{order.id}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<AttachMoney />}
                    label={order.amount}
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Pickup & Drop */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <LocationOn color="success" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Pickup
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.pickupAddress}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <LocationOn color="error" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Dropoff
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.dropAddress}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                {/* Order Items */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Order Items
                  </Typography>
                  {order.items.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.name}</Typography>
                      <Typography variant="body2">x{item.quantity}</Typography>
                    </Box>
                  ))}
                </Paper>

                {/* Delivery Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2">{order.estimatedTime}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp fontSize="small" color="action" />
                    <Typography variant="body2">{order.distance}</Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                    >
                      Accept
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      size="large"
                    >
                      Decline
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {orders.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <LocalShipping sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No available orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back in a few minutes
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AvailableOrders;