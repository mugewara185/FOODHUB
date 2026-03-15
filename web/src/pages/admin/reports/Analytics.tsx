import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Rating,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingBag,
  People,
  Restaurant,
  Download,
  DateRange,
  Assessment,
  ShowChart,
  PieChart,
  BarChart,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts';

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 850000, orders: 2340, avgOrder: 363 },
  { month: 'Feb', revenue: 920000, orders: 2560, avgOrder: 359 },
  { month: 'Mar', revenue: 1100000, orders: 2890, avgOrder: 381 },
  { month: 'Apr', revenue: 1250000, orders: 3120, avgOrder: 401 },
  { month: 'May', revenue: 1180000, orders: 2980, avgOrder: 396 },
  { month: 'Jun', revenue: 1350000, orders: 3450, avgOrder: 391 },
];

const categoryData = [
  { name: 'Indian', value: 35 },
  { name: 'Chinese', value: 25 },
  { name: 'Italian', value: 20 },
  { name: 'Fast Food', value: 15 },
  { name: 'Others', value: 5 },
];

const topRestaurants = [
  { name: 'Spice Garden', orders: 1245, revenue: 850000, rating: 4.8 },
  { name: 'Pizza Paradise', orders: 2134, revenue: 1120000, rating: 4.6 },
  { name: 'Burger House', orders: 987, revenue: 510000, rating: 4.7 },
  { name: 'Sushi Master', orders: 876, revenue: 680000, rating: 4.9 },
  { name: 'Taco Fiesta', orders: 654, revenue: 380000, rating: 4.5 },
];

const COLORS = ['#FF6B35', '#00C853', '#2196F3', '#FFC107', '#9C27B0'];

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('revenue');

  const stats = [
    { 
      title: 'Total Revenue', 
      value: '₹4,520,000', 
      change: '+15.3%', 
      trend: 'up',
      icon: <AttachMoney />,
    },
    { 
      title: 'Total Orders', 
      value: '12,450', 
      change: '+12.8%', 
      trend: 'up',
      icon: <ShoppingBag />,
    },
    { 
      title: 'Active Users', 
      value: '25.4K', 
      change: '+8.2%', 
      trend: 'up',
      icon: <People />,
    },
    { 
      title: 'Avg. Order Value', 
      value: '₹363', 
      change: '+5.2%', 
      trend: 'up',
      icon: <TrendingUp />,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Analytics & Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your platform's performance and growth
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="week">Last 7 days</MenuItem>
              <MenuItem value="month">Last 30 days</MenuItem>
              <MenuItem value="quarter">Last 90 days</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                    {stat.icon}
                  </Avatar>
                  <Chip
                    size="small"
                    icon={stat.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                    label={stat.change}
                    color={stat.trend === 'up' ? 'success' : 'error'}
                  />
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>
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

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Main Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Revenue Overview
              </Typography>
              <ButtonGroup size="small">
                <Button
                  variant={chartType === 'revenue' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('revenue')}
                >
                  Revenue
                </Button>
                <Button
                  variant={chartType === 'orders' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('orders')}
                >
                  Orders
                </Button>
                <Button
                  variant={chartType === 'avg' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('avg')}
                >
                  Avg Order
                </Button>
              </ButtonGroup>
            </Box>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={chartType === 'revenue' ? 'revenue' : chartType === 'orders' ? 'orders' : 'avgOrder'}
                  stroke="#FF6B35"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name={chartType === 'revenue' ? 'Revenue (₹)' : chartType === 'orders' ? 'Orders' : 'Avg Order Value'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Orders by Category
            </Typography>
            
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
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
                <Tooltip />
                <Legend />
              </RePieChart>
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

      {/* Performance Metrics */}
      <Grid container spacing={3}>
        {/* Top Restaurants */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Top Performing Restaurants
            </Typography>
            
            <TableContainer>
              <Table>
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
                        <Rating value={restaurant.rating} size="small" readOnly />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Growth Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Key Metrics
            </Typography>
            
            <Grid container spacing={2}>
              {[
                { label: 'Customer Acquisition Cost', value: '₹245', change: '-8%' },
                { label: 'Customer Lifetime Value', value: '₹2,850', change: '+15%' },
                { label: 'Repeat Order Rate', value: '68%', change: '+5%' },
                { label: 'Average Delivery Time', value: '32 min', change: '-3 min' },
                { label: 'Restaurant Churn Rate', value: '2.4%', change: '-0.5%' },
                { label: 'Customer Satisfaction', value: '4.7/5', change: '+0.2' },
              ].map((metric, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {metric.value}
                      </Typography>
                      <Chip
                        size="small"
                        icon={metric.change.startsWith('+') ? <TrendingUp /> : <TrendingDown />}
                        label={metric.change}
                        color={metric.change.startsWith('+') ? 'success' : 'error'}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;