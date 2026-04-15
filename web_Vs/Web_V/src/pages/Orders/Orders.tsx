import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Rating,
  Divider,
  LinearProgress,
  Stack,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccessTime,
  LocationOn,
  Restaurant,
  ShoppingBag,
  Star,
  MoreVert,
  Replay,
  RateReview,
  Help,
  Cancel,
  CheckCircle,
  LocalShipping,
  Kitchen,
} from '@mui/icons-material';

interface Order {
  id: string;
  restaurant: {
    name: string;
    image: string;
  };
  items: { name: string; quantity: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  date: string;
  deliveryTime: string;
  rating?: number;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    restaurant: {
      name: 'Spice Garden',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    },
    items: [
      { name: 'Butter Chicken', quantity: 1 },
      { name: 'Garlic Naan', quantity: 2 },
      { name: 'Veg Biryani', quantity: 1 },
    ],
    total: 890,
    status: 'delivered',
    date: '2024-01-15T19:30:00',
    deliveryTime: '35 min',
    rating: 5,
  },
  {
    id: 'ORD-002',
    restaurant: {
      name: 'Pizza Paradise',
      image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop',
    },
    items: [
      { name: 'Margherita Pizza', quantity: 1 },
      { name: 'Garlic Bread', quantity: 1 },
      { name: 'Coke', quantity: 2 },
    ],
    total: 650,
    status: 'out_for_delivery',
    date: '2024-01-16T12:15:00',
    deliveryTime: '15 min',
  },
  {
    id: 'ORD-003',
    restaurant: {
      name: 'Burger House',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    },
    items: [
      { name: 'Chicken Burger', quantity: 2 },
      { name: 'French Fries', quantity: 1 },
      { name: 'Milkshake', quantity: 1 },
    ],
    total: 520,
    status: 'preparing',
    date: '2024-01-16T13:00:00',
    deliveryTime: '25 min',
  },
  {
    id: 'ORD-004',
    restaurant: {
      name: 'Sushi Master',
      image: 'https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=400&h=300&fit=crop',
    },
    items: [
      { name: 'California Roll', quantity: 2 },
      { name: 'Salmon Nigiri', quantity: 4 },
      { name: 'Miso Soup', quantity: 1 },
    ],
    total: 1200,
    status: 'cancelled',
    date: '2024-01-14T20:00:00',
    deliveryTime: '30 min',
  },
];

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = mockOrders.filter(order => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return order.status === 'delivered';
    if (activeTab === 2) return ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
    if (activeTab === 3) return order.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'info',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Order['status']) => {
    const icons = {
      pending: <AccessTime />,
      confirmed: <CheckCircle />,
      preparing: <Kitchen />,
      out_for_delivery: <LocalShipping />,
      delivered: <CheckCircle />,
      cancelled: <Cancel />,
    };
    return icons[status];
  };

  const getStatusText = (status: Order['status']) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleOrderAction = (action: string, orderId: string) => {
    console.log(`${action} for order ${orderId}`);
    setAnchorEl(null);
    
    switch(action) {
      case 'track':
        navigate(`/orders/${orderId}/track`);
        break;
      case 'reorder':
        // Add items to cart
        navigate('/cart');
        break;
      case 'review':
        navigate(`/orders/${orderId}/review`);
        break;
      case 'help':
        navigate('/help');
        break;
      default:
        break;
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          My Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track, review, and reorder your meals
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            pt: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab label="All Orders" />
          <Tab label="Delivered" />
          <Tab label="Ongoing" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      {/* Orders List */}
      <Grid container spacing={3}>
        {filteredOrders.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ready to order? Check out our restaurants
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/restaurants')}
              >
                Browse Restaurants
              </Button>
            </Box>
          </Grid>
        ) : (
          filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Order Header */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Restaurant Image */}
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={order.restaurant.image}
                            alt={order.restaurant.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>

                        {/* Order Info */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                              {order.restaurant.name}
                            </Typography>
                            <Chip
                              size="small"
                              icon={getStatusIcon(order.status)}
                              label={getStatusText(order.status)}
                              color={getStatusColor(order.status) as any}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Order #{order.id} • {new Date(order.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                            {order.items.map((item, idx) => (
                              <Typography key={idx} variant="body2" color="text.secondary">
                                {item.quantity}x {item.name}
                                {idx < order.items.length - 1 ? ',' : ''}
                              </Typography>
                            ))}
                          </Stack>

                          {order.status === 'out_for_delivery' && (
                            <Box sx={{ mt: 2, maxWidth: 300 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  Estimated Delivery
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="primary">
                                  {order.deliveryTime}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={70}
                                color="primary"
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: { xs: 'flex-start', md: 'flex-end' },
                        height: '100%',
                      }}>
                        <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                          ₹{order.total}
                        </Typography>
                        
                        {order.rating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Rating value={order.rating} readOnly size="small" />
                            <Typography variant="body2" color="text.secondary">
                              Rated
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                          <Button
                            variant={order.status === 'cancelled' ? 'outlined' : 'contained'}
                            size="small"
                            startIcon={<Replay />}
                            onClick={() => handleOrderAction('reorder', order.id)}
                          >
                            Reorder
                          </Button>
                          
                          {order.status === 'delivered' && !order.rating && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<RateReview />}
                              onClick={() => handleOrderAction('review', order.id)}
                            >
                              Review
                            </Button>
                          )}

                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, order.id)}
                          >
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

      {/* Order Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOrderAction('track', selectedOrder!)}>
          <LocalShipping sx={{ mr: 1, fontSize: 20 }} />
          Track Order
        </MenuItem>
        <MenuItem onClick={() => handleOrderAction('help', selectedOrder!)}>
          <Help sx={{ mr: 1, fontSize: 20 }} />
          Get Help
        </MenuItem>
        <MenuItem onClick={() => handleOrderAction('details', selectedOrder!)}>
          <Restaurant sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleOrderAction('cancel', selectedOrder!)}
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1, fontSize: 20 }} />
          Cancel Order
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Orders;