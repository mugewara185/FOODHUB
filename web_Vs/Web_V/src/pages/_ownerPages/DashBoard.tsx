import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingBag,
  People,
  Restaurant,
  AccessTime,
  Star,
  MoreVert,
  Visibility,
  CheckCircle,
  Schedule,
  Warning,
  RestaurantMenu,
  LocalOffer,
  PhotoLibrary,
  Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  avgPrepTime: number;
  customerRating: number;
  totalItems: number;
  outOfStock: number;
}

interface LiveOrder {
  id: string;
  orderId: string;
  customer: string;
  items: string;
  time: string;
  status: 'pending' | 'preparing' | 'ready';
  amount: number;
}

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats: DashboardStats = {
    todayRevenue: 8540,
    yesterdayRevenue: 7620,
    todayOrders: 24,
    pendingOrders: 5,
    avgPrepTime: 18,
    customerRating: 4.8,
    totalItems: 45,
    outOfStock: 3,
  };

  const liveOrders: LiveOrder[] = [
    {
      id: '1',
      orderId: '#ORD-001',
      customer: 'John Doe',
      items: 'Butter Chicken, 2x Naan',
      time: '5 min ago',
      status: 'pending',
      amount: 450,
    },
    {
      id: '2',
      orderId: '#ORD-002',
      customer: 'Jane Smith',
      items: 'Paneer Tikka, Biryani',
      time: '8 min ago',
      status: 'preparing',
      amount: 680,
    },
    {
      id: '3',
      orderId: '#ORD-003',
      customer: 'Mike Johnson',
      items: 'Chicken Curry, 3x Roti',
      time: '12 min ago',
      status: 'preparing',
      amount: 520,
    },
  ];

  const popularItems = [
    { name: 'Butter Chicken', orders: 45, revenue: 14400 },
    { name: 'Garlic Naan', orders: 38, revenue: 3040 },
    { name: 'Chicken Biryani', orders: 32, revenue: 7040 },
    { name: 'Paneer Tikka', orders: 28, revenue: 5600 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Warning />;
      case 'preparing': return <Schedule />;
      case 'ready': return <CheckCircle />;
      default: return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Welcome back, Spice Garden!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening at your restaurant today
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Today's Revenue */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{stats.todayRevenue}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <TrendingUp color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main">
                      +12% vs yesterday
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <AttachMoney />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Orders */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Orders
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.todayOrders}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <ShoppingBag color="primary" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {stats.pendingOrders} pending
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <ShoppingBag />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Prep Time */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Prep Time
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.avgPrepTime} min
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <AccessTime color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      -2 min from yesterday
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <AccessTime />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Rating */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Customer Rating
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.customerRating} ★
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on 156 reviews
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                  <Star />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Live Orders Queue */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Live Orders Queue
              </Typography>
              <Chip label={`${stats.pendingOrders} pending`} color="warning" size="small" />
            </Box>

            <List>
              {liveOrders.map((order, index) => (
                <React.Fragment key={order.id}>
                  <ListItem
                    sx={{
                      bgcolor: order.status === 'pending' ? 'warning.light' : 'info.light',
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'white' }}>
                        {getStatusIcon(order.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {order.orderId} • {order.customer}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ₹{order.amount}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {order.items}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.time}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color={order.status === 'pending' ? 'warning' : 'success'}
                      sx={{ ml: 2 }}
                    >
                      {order.status === 'pending' ? 'Accept' : 'Ready'}
                    </Button>
                  </ListItem>
                  {index < liveOrders.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/owner/orders')}
            >
              View All Orders
            </Button>
          </Paper>
        </Grid>

        {/* Popular Items */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Popular Items This Week
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="center">Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {popularItems.map((item) => (
                    <TableRow key={item.name} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={item.orders} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right" fontWeight={600}>
                        ₹{item.revenue}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="In Stock" size="small" color="success" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3 }}>
              <Alert severity="warning" icon={<Warning />}>
                {stats.outOfStock} items are out of stock. Update your inventory.
              </Alert>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                { icon: <RestaurantMenu />, label: 'Update Menu', color: 'primary', path: '/owner/menu' },
                { icon: <LocalOffer />, label: 'Create Offer', color: 'success', path: '/owner/promotions' },
                { icon: <AccessTime />, label: 'Update Hours', color: 'warning', path: '/owner/profile' },
                { icon: <PhotoLibrary />, label: 'Add Photos', color: 'info', path: '/owner/profile/gallery' },
                { icon: <Assessment />, label: 'View Reports', color: 'secondary', path: '/owner/analytics' },
                { icon: <People />, label: 'Manage Staff', color: 'error', path: '/owner/staff' },
              ].map((action, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={() => navigate(action.path)}
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      justifyContent: 'flex-start',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: `${action.color}.main`,
                        bgcolor: `${action.color}.light`,
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OwnerDashboard;