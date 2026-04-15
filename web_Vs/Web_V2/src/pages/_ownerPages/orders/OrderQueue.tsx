import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import {
  AccessTime,
  Restaurant,
  Person,
  LocationOn,
  Phone,
  CheckCircle,
  Schedule,
  LocalShipping,
  Print,
  Receipt,
} from '@mui/icons-material';

interface Order {
  id: string;
  orderId: string;
  customer: string;
  items: { name: string; quantity: number; special?: string }[];
  total: number;
  time: string;
  status: 'pending' | 'preparing' | 'ready' | 'picked_up';
  type: 'dine-in' | 'delivery' | 'pickup';
  table?: string;
  address?: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderId: '#ORD-001',
    customer: 'John Doe',
    items: [
      { name: 'Butter Chicken', quantity: 1 },
      { name: 'Garlic Naan', quantity: 2, special: 'Extra butter' },
      { name: 'Veg Biryani', quantity: 1 },
    ],
    total: 890,
    time: '5 min ago',
    status: 'pending',
    type: 'delivery',
    address: '123 Main Street, Andheri West',
  },
  {
    id: '2',
    orderId: '#ORD-002',
    customer: 'Jane Smith',
    items: [
      { name: 'Paneer Tikka', quantity: 1 },
      { name: 'Butter Naan', quantity: 2 },
    ],
    total: 450,
    time: '8 min ago',
    status: 'preparing',
    type: 'dine-in',
    table: 'Table 5',
  },
  {
    id: '3',
    orderId: '#ORD-003',
    customer: 'Mike Johnson',
    items: [
      { name: 'Chicken Biryani', quantity: 1 },
      { name: 'Raita', quantity: 1 },
      { name: 'Gulab Jamun', quantity: 2 },
    ],
    total: 620,
    time: '12 min ago',
    status: 'preparing',
    type: 'pickup',
  },
  {
    id: '4',
    orderId: '#ORD-004',
    customer: 'Sarah Williams',
    items: [
      { name: 'Malai Kofta', quantity: 1 },
      { name: 'Tandoori Roti', quantity: 3 },
    ],
    total: 580,
    time: '15 min ago',
    status: 'ready',
    type: 'delivery',
    address: '456 Park Avenue, Andheri East',
  },
];

const OrderQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      case 'picked_up': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'preparing': return <Restaurant />;
      case 'ready': return <CheckCircle />;
      case 'picked_up': return <LocalShipping />;
      default: return null;
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card
      key={order.id}
      sx={{
        mb: 2,
        borderRadius: 2,
        borderLeft: 6,
        borderColor: `${getStatusColor(order.status)}.main`,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {order.orderId}
            </Typography>
            <Chip
              size="small"
              icon={getStatusIcon(order.status)}
              label={order.status}
              color={getStatusColor(order.status) as any}
            />
            <Chip
              size="small"
              label={order.type}
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {order.time}
          </Typography>
        </Box>

        {/* Customer Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            <Person />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600}>
            {order.customer}
          </Typography>
          {order.table && (
            <Chip label={order.table} size="small" color="secondary" />
          )}
        </Box>

        {/* Address for delivery */}
        {order.type === 'delivery' && order.address && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {order.address}
            </Typography>
          </Box>
        )}

        {/* Items */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {order.items.map((item, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  {item.quantity}x {item.name}
                </Typography>
              </Box>
              {item.special && (
                <Typography variant="caption" color="warning.main">
                  Note: {item.special}
                </Typography>
              )}
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Total</Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              ₹{order.total}
            </Typography>
          </Box>
        </Paper>

        {/* Actions */}
        <Grid container spacing={1}>
          {order.status === 'pending' && (
            <>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  startIcon={<Restaurant />}
                  onClick={() => handleStatusChange(order.id, 'preparing')}
                >
                  Start Preparing
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                >
                  Reject
                </Button>
              </Grid>
            </>
          )}
          
          {order.status === 'preparing' && (
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleStatusChange(order.id, 'ready')}
              >
                Mark as Ready
              </Button>
            </Grid>
          )}
          
          {order.status === 'ready' && (
            <>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Print />}
                >
                  Print Bill
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleStatusChange(order.id, 'picked_up')}
                >
                  Complete
                </Button>
              </Grid>
            </>
          )}

          {/* Always show view details */}
          <Grid item xs={12}>
            <Button
              fullWidth
              size="small"
              startIcon={<Receipt />}
            >
              View Full Details
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Order Queue
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and process incoming orders
        </Typography>
      </Box>

      {/* Order Grid */}
      <Grid container spacing={3}>
        {/* Pending */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'warning.light', minHeight: 500 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Schedule />
              <Typography variant="h6" fontWeight={700}>
                Pending
              </Typography>
              <Chip label={orders.filter(o => o.status === 'pending').length} color="warning" />
            </Box>
            {orders.filter(o => o.status === 'pending').map(renderOrderCard)}
          </Paper>
        </Grid>

        {/* Preparing */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'info.light', minHeight: 500 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Restaurant />
              <Typography variant="h6" fontWeight={700}>
                Preparing
              </Typography>
              <Chip label={orders.filter(o => o.status === 'preparing').length} color="info" />
            </Box>
            {orders.filter(o => o.status === 'preparing').map(renderOrderCard)}
          </Paper>
        </Grid>

        {/* Ready */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'success.light', minHeight: 500 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircle />
              <Typography variant="h6" fontWeight={700}>
                Ready
              </Typography>
              <Chip label={orders.filter(o => o.status === 'ready').length} color="success" />
            </Box>
            {orders.filter(o => o.status === 'ready').map(renderOrderCard)}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderQueue;