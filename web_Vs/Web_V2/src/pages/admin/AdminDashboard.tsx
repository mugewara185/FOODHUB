import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Restaurant,
  People,
  Payment,
  MoreVert,
  Visibility,
  Receipt,
  LocalShipping,
  Star,
  Warning,
  CheckCircle,
  Schedule,
  AttachMoney,
  ArrowUpward,
  ArrowDownward,
  Fastfood,
  LocalOffer,
  Assessment,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// Mock data for charts
const revenueData = [
  { name: 'Mon', revenue: 45000, orders: 120 },
  { name: 'Tue', revenue: 52000, orders: 135 },
  { name: 'Wed', revenue: 48000, orders: 128 },
  { name: 'Thu', revenue: 61000, orders: 145 },
  { name: 'Fri', revenue: 75000, orders: 168 },
  { name: 'Sat', revenue: 82000, orders: 185 },
  { name: 'Sun', revenue: 55000, orders: 142 },
];

const categoryData = [
  { name: 'Indian', value: 35 },
  { name: 'Chinese', value: 25 },
  { name: 'Italian', value: 20 },
  { name: 'Fast Food', value: 15 },
  { name: 'Others', value: 5 },
];

const COLORS = ['#FF6B35', '#00C853', '#2196F3', '#FFC107', '#9C27B0'];

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', restaurant: 'Spice Garden', amount: 890, status: 'delivered', time: '5 mins ago' },
  { id: 'ORD-002', customer: 'Jane Smith', restaurant: 'Pizza Paradise', amount: 650, status: 'preparing', time: '12 mins ago' },
  { id: 'ORD-003', customer: 'Mike Johnson', restaurant: 'Burger House', amount: 520, status: 'out_for_delivery', time: '18 mins ago' },
  { id: 'ORD-004', customer: 'Sarah Williams', restaurant: 'Sushi Master', amount: 1200, status: 'pending', time: '25 mins ago' },
  { id: 'ORD-005', customer: 'David Brown', restaurant: 'Taco Fiesta', amount: 430, status: 'delivered', time: '30 mins ago' },
];

const topRestaurants = [
  { name: 'Spice Garden', orders: 145, revenue: 85000, rating: 4.8 },
  { name: 'Pizza Paradise', orders: 132, revenue: 72000, rating: 4.7 },
  { name: 'Burger House', orders: 98, revenue: 51000, rating: 4.6 },
  { name: 'Sushi Master', orders: 87, revenue: 68000, rating: 4.9 },
  { name: 'Taco Fiesta', orders: 76, revenue: 38000, rating: 4.5 },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'success';
    case 'preparing': return 'info';
    case 'out_for_delivery': return 'primary';
    case 'pending': return 'warning';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered': return <CheckCircle fontSize="small" />;
    case 'preparing': return <Schedule fontSize="small" />;
    case 'out_for_delivery': return <LocalShipping fontSize="small" />;
    case 'pending': return <Warning fontSize="small" />;
    default: return null;
  }
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('week');

  const stats = [
    { 
      title: 'Total Revenue', 
      value: '₹4,52,000', 
      change: '+12.5%', 
      trend: 'up',
      icon: <AttachMoney sx={{ fontSize: 32 }} />,
      color: 'primary',
    },
    { 
      title: 'Total Orders', 
      value: '1,245', 
      change: '+8.2%', 
      trend: 'up',
      icon: <ShoppingBag sx={{ fontSize: 32 }} />,
      color: 'success',
    },
    { 
      title: 'Active Restaurants', 
      value: '128', 
      change: '+4', 
      trend: 'up',
      icon: <Restaurant sx={{ fontSize: 32 }} />,
      color: 'info',
    },
    { 
      title: 'Total Users', 
      value: '25.4K', 
      change: '+15.3%', 
      trend: 'up',
      icon: <People sx={{ fontSize: 32 }} />,
      color: 'warning',
    },
    { 
      title: 'Avg. Order Value', 
      value: '₹363', 
      change: '+5.2%', 
      trend: 'up',
      icon: <Payment sx={{ fontSize: 32 }} />,
      color: 'secondary',
    },
    { 
      title: 'Delivery Success', 
      value: '98.2%', 
      change: '+1.2%', 
      trend: 'up',
      icon: <CheckCircle sx={{ fontSize: 32 }} />,
      color: 'success',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your platform today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={timeRange === 'day' ? 'contained' : 'outlined'}
            onClick={() => setTimeRange('day')}
          >
            Day
          </Button>
          <Button
            variant={timeRange === 'week' ? 'contained' : 'outlined'}
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.light`,
                      color: `${stat.color}.main`,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Chip
                    icon={stat.trend === 'up' ? <ArrowUpward /> : <ArrowDownward />}
                    label={stat.change}
                    color={stat.trend === 'up' ? 'success' : 'error'}
                    size="small"
                    sx={{ height: 24 }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Revenue Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Daily revenue and order count
                </Typography>
              </Box>
              <Tooltip title="View details">
                <IconButton>
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue (₹)"
                />
                <Bar dataKey="orders" fill={theme.palette.success.main} name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Order Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Distribution by cuisine
                </Typography>
              </Box>
              <Chip label="This Month" size="small" />
            </Box>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <Box sx={{ mt: 2 }}>
              {categoryData.map((category, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 2, bgcolor: COLORS[index] }} />
                    <Typography variant="body2">{category.name}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {category.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders & Top Restaurants */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Recent Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest transactions on your platform
                </Typography>
              </Box>
              <Button endIcon={<Receipt />} size="small">
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Restaurant</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {order.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.time}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.restaurant}</TableCell>
                      <TableCell align="right" fontWeight={600}>
                        ₹{order.amount}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={getStatusIcon(order.status)}
                          label={order.status.replace('_', ' ')}
                          color={getStatusColor(order.status) as any}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Restaurants */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Top Restaurants
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  By revenue and orders
                </Typography>
              </Box>
              <Chip label="This Week" size="small" />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Restaurant</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="center">Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topRestaurants.map((restaurant, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {restaurant.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{restaurant.orders}</TableCell>
                      <TableCell align="right" fontWeight={600}>
                        ₹{restaurant.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2">{restaurant.rating}</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Restaurants: 128
              </Typography>
              <Button size="small">View All</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                { icon: <Restaurant />, label: 'Add Restaurant', color: 'primary' },
                { icon: <Fastfood />, label: 'Add Menu Item', color: 'secondary' },
                { icon: <LocalOffer />, label: 'Create Offer', color: 'success' },
                { icon: <Payment />, label: 'Process Payouts', color: 'warning' },
                { icon: <People />, label: 'Add Delivery Partner', color: 'info' },
                { icon: <Assessment />, label: 'Generate Report', color: 'error' },
              ].map((action, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
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

export default Dashboard;