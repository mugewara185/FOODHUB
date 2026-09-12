import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import {
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
import { AdminAIAssistantTrigger } from './components/AdminAIAssistantTrigger';
import { logger } from '../../core/dev/logger';
import { StatsCard } from '../../shared/components/admin/StatsCard';
import { getAuthToken } from '../../services/api/apiUtils';

const COLORS = ['#FF6B35', '#00C853', '#2196F3', '#FFC107', '#9C27B0'];

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
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info('ADMIN.PAGE.MOUNT', 'AdminDashboard component mounted');
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        logger.info('ADMIN.ANALYTICS.LOAD.START', `Loading analytics for period: ${timeRange}`);
        
        const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const token = getAuthToken();

        const response = await fetch(`${apiBaseUrl}/admin/analytics/dashboard?period=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch analytics');
        
        const json = await response.json();
        setAnalyticsData(json.data);
        logger.info('ADMIN.ANALYTICS.LOAD.SUCCESS', `Successfully loaded analytics for period: ${timeRange}`);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
        logger.error('ADMIN.ANALYTICS.LOAD.FAILURE', 'Failed to load analytics data', err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const stats = [
    { 
      title: 'Total Revenue', 
      value: analyticsData ? `₹${analyticsData.metrics.revenue.toLocaleString()}` : '...', 
      change: '+12.5%', 
      trend: 'up',
      icon: <AttachMoney sx={{ fontSize: 32 }} />,
      color: 'primary',
    },
    { 
      title: 'Total Orders', 
      value: analyticsData ? analyticsData.metrics.orders.toLocaleString() : '...', 
      change: '+8.2%', 
      trend: 'up',
      icon: <ShoppingBag sx={{ fontSize: 32 }} />,
      color: 'success',
    },
    { 
      title: 'Active Restaurants', 
      value: analyticsData ? analyticsData.metrics.activeRestaurants : '...', 
      change: '+4', 
      trend: 'up',
      icon: <Restaurant sx={{ fontSize: 32 }} />,
      color: 'info',
    },
    { 
      title: 'Total Users', 
      value: analyticsData ? (analyticsData.metrics.totalUsers / 1000).toFixed(1) + 'K' : '...', 
      change: '+15.3%', 
      trend: 'up',
      icon: <People sx={{ fontSize: 32 }} />,
      color: 'warning',
    },
    { 
      title: 'Avg. Order Value', 
      value: analyticsData ? `₹${analyticsData.metrics.averageOrderValue}` : '...', 
      change: '+5.2%', 
      trend: 'up',
      icon: <Payment sx={{ fontSize: 32 }} />,
      color: 'secondary',
    },
    { 
      title: 'Delivery Success', 
      value: analyticsData ? `${analyticsData.metrics.deliverySuccessRate}%` : '...', 
      change: '+1.2%', 
      trend: 'up',
      icon: <CheckCircle sx={{ fontSize: 32 }} />,
      color: 'success',
    },
  ];

  return (
    <Box>
      <AdminAIAssistantTrigger />
      
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
            onClick={() => { logger.info('ADMIN.DASHBOARD.ACTION', 'Changed time range to day'); setTimeRange('day'); }}
          >
            Day
          </Button>
          <Button
            variant={timeRange === 'week' ? 'contained' : 'outlined'}
            onClick={() => { logger.info('ADMIN.DASHBOARD.ACTION', 'Changed time range to week'); setTimeRange('week'); }}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
            onClick={() => { logger.info('ADMIN.DASHBOARD.ACTION', 'Changed time range to month'); setTimeRange('month'); }}
          >
            Month
          </Button>
        </Box>
      </Box>

      {error ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
          <Typography color="error">Error: {error}</Typography>
        </Box>
      ) : (
        <>
          {/* Stats Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <StatsCard
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  trend={stat.trend as any}
                  icon={stat.icon}
                  color={stat.color as any}
                  loading={loading}
                />
              </Grid>
            ))}
          </Grid>

          {(!loading && analyticsData) && (
            <>
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
              <AreaChart data={analyticsData.breakdowns.revenueByDay}>
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
                  data={analyticsData.breakdowns.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.breakdowns.categoryDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <Box sx={{ mt: 2 }}>
              {analyticsData.breakdowns.categoryDistribution.map((category: any, index: number) => (
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
                  {analyticsData.breakdowns.recentOrders.map((order: any) => (
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
                  {analyticsData.breakdowns.topRestaurants.map((restaurant: any, index: number) => (
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
                Total Restaurants: {analyticsData.metrics.activeRestaurants}
              </Typography>
              <Button size="small">View All</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

            </>
          )}

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
      </>
      )}
    </Box>
  );
};

export default Dashboard;