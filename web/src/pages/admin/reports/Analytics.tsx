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
import { logger } from '../../../core/dev/logger';
import { StatsCard } from '../../../shared/components/admin/StatsCard';
import { fetchAnalyticsData } from '../../../features/admin/data/reports.provider';
import { CircularProgress } from '@mui/material';

const COLORS = ['#FF6B35', '#00C853', '#2196F3', '#FFC107', '#9C27B0'];

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('revenue');
  const [data, setData] = useState<{
    revenueData: any[];
    categoryData: any[];
    topRestaurants: any[];
    stats: any[];
    metrics: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        logger.info('ADMIN.ANALYTICS_PAGE.MOUNT', 'Analytics component mounted');
        setLoading(true);
        const result = await fetchAnalyticsData();
        setData(result);
        logger.info('ADMIN.ANALYTICS_PAGE.LOAD_SUCCESS', 'Analytics data loaded successfully');
      } catch (err) {
        setError('Failed to load analytics data');
        logger.error('ADMIN.ANALYTICS_PAGE.LOAD_ERROR', 'Failed to load analytics data', err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRange]);

  const handleExport = () => {
    logger.info('ADMIN.ANALYTICS_PAGE.EXPORT', 'Exporting report');
    // Implement export
  };

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
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {error && (
        <Box display="flex" justifyContent="center" mb={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(data?.stats || Array(4).fill({ title: '', value: '', change: '', trend: 'up' })).map((stat, index) => {
          const icons = [<AttachMoney />, <ShoppingBag />, <People />, <TrendingUp />];
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatsCard
                title={stat.title}
                value={stat.value}
                change={stat.change}
                trend={stat.trend as any}
                icon={icons[index % icons.length]}
                color="primary"
                loading={loading}
              />
            </Grid>
          );
        })}
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
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : (
                <AreaChart data={data?.revenueData || []}>
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
              )}
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
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : (
                <RePieChart>
                  <Pie
                    data={data?.categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(data?.categoryData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              )}
            </ResponsiveContainer>

            <Box sx={{ mt: 2 }}>
              {(data?.categoryData || []).map((category, index) => (
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : data?.topRestaurants?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No top restaurants found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.topRestaurants || []).map((restaurant, index) => (
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
                    ))
                  )}
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
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" width="100%" height={200}>
                  <CircularProgress />
                </Box>
              ) : (
                (data?.metrics || []).map((metric, index) => (
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
                ))
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;