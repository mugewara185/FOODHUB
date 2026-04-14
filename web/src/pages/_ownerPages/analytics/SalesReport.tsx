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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack,
  Avatar,
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
  ShowChart,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const SalesReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('week');

  const revenueData = [
    { date: 'Mon', revenue: 8500, orders: 24 },
    { date: 'Tue', revenue: 9200, orders: 26 },
    { date: 'Wed', revenue: 8800, orders: 23 },
    { date: 'Thu', revenue: 10500, orders: 28 },
    { date: 'Fri', revenue: 12400, orders: 32 },
    { date: 'Sat', revenue: 14800, orders: 38 },
    { date: 'Sun', revenue: 11200, orders: 29 },
  ];

  const categoryData = [
    { name: 'Main Course', value: 45 },
    { name: 'Starters', value: 25 },
    { name: 'Breads', value: 15 },
    { name: 'Rice', value: 10 },
    { name: 'Beverages', value: 5 },
  ];

  const topItems = [
    { name: 'Butter Chicken', orders: 45, revenue: 14400 },
    { name: 'Garlic Naan', orders: 38, revenue: 3040 },
    { name: 'Chicken Biryani', orders: 32, revenue: 7040 },
    { name: 'Paneer Tikka', orders: 28, revenue: 5600 },
    { name: 'Dal Makhani', orders: 25, revenue: 3750 },
  ];

  const COLORS = ['#FF6B35', '#00C853', '#2196F3', '#FFC107', '#9C27B0'];

  const stats = [
    { label: 'Total Revenue', value: '₹74,500', change: '+12.5%', trend: 'up' },
    { label: 'Total Orders', value: '212', change: '+8.2%', trend: 'up' },
    { label: 'Avg Order Value', value: '₹351', change: '+4.3%', trend: 'up' },
    { label: 'Conversion Rate', value: '68%', change: '-2.1%', trend: 'down' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Sales Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your restaurant's performance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup size="small">
            <Button
              variant={dateRange === 'week' ? 'contained' : 'outlined'}
              onClick={() => setDateRange('week')}
            >
              Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'contained' : 'outlined'}
              onClick={() => setDateRange('month')}
            >
              Month
            </Button>
            <Button
              variant={dateRange === 'year' ? 'contained' : 'outlined'}
              onClick={() => setDateRange('year')}
            >
              Year
            </Button>
          </ButtonGroup>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      {stat.trend === 'up' ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={stat.trend === 'up' ? 'success.main' : 'error.main'}
                      >
                        {stat.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: stat.trend === 'up' ? 'success.light' : 'error.light',
                      color: stat.trend === 'up' ? 'success.main' : 'error.main',
                    }}
                  >
                    {index === 0 ? <AttachMoney /> : index === 1 ? <ShoppingBag /> : <ShowChart />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Revenue & Orders
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF6B35"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue (₹)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="orders"
                  fill="#00C853"
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Sales by Category
            </Typography>
            
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
                <Tooltip />
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

        {/* Top Items */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Top Selling Items
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="center">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="center">% of Sales</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topItems.map((item) => (
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
                        ₹{item.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${((item.orders / 168) * 100).toFixed(1)}%`}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesReport;