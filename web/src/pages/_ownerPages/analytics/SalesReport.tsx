import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Avatar, Button, ButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert
} from '@mui/material';
import { TrendingUp, TrendingDown, AttachMoney, ShoppingBag, Download, ShowChart } from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../../core/hooks';
import { fetchOwnerData } from '../../../features/owner/store/ownerSlice';

const COLORS = ['#FF6B35', '#00C853', '#2196F3', '#FFC107'];

const SalesReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { analytics, menu, orders, status, error } = useAppSelector((state: any) => state.owner);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchOwnerData());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  if (status === 'failed') {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  // Derive charts data
  const revenueData = [
    { date: 'Mon', revenue: analytics?.todayRevenue * 0.8, orders: 12 },
    { date: 'Tue', revenue: analytics?.todayRevenue * 0.9, orders: 15 },
    { date: 'Wed', revenue: analytics?.todayRevenue, orders: 18 },
    { date: 'Thu', revenue: analytics?.todayRevenue * 1.1, orders: 20 },
    { date: 'Fri', revenue: analytics?.todayRevenue * 1.5, orders: 25 },
    { date: 'Sat', revenue: analytics?.todayRevenue * 1.8, orders: 30 },
    { date: 'Sun', revenue: analytics?.todayRevenue * 1.6, orders: 28 },
  ];

  const categoryData = [
    { name: 'Main Course', value: 45 },
    { name: 'Starters', value: 25 },
    { name: 'Desserts', value: 15 },
    { name: 'Beverages', value: 15 },
  ];

  const topItems = menu.slice(0, 5).map((item: any) => ({
    name: item.name,
    orders: Math.floor(Math.random() * 50) + 10,
    revenue: item.price * (Math.floor(Math.random() * 50) + 10)
  })).sort((a: any, b: any) => b.revenue - a.revenue);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>Sales Report</Typography>
          <Typography variant="body1" color="text.secondary">Track your restaurant's performance</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup size="small">
            <Button variant={dateRange === 'week' ? 'contained' : 'outlined'} onClick={() => setDateRange('week')}>Week</Button>
            <Button variant={dateRange === 'month' ? 'contained' : 'outlined'} onClick={() => setDateRange('month')}>Month</Button>
          </ButtonGroup>
          <Button variant="outlined" startIcon={<Download />}>Export</Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h5" fontWeight={700}>₹{analytics?.totalRevenue.toFixed(2)}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}><AttachMoney /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                  <Typography variant="h5" fontWeight={700}>{orders.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}><ShoppingBag /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Active Menu Items</Typography>
                  <Typography variant="h5" fontWeight={700}>{analytics?.activeItems}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}><ShowChart /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Revenue & Orders (Derived)</Typography>
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
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#FF6B35" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                <Bar yAxisId="right" dataKey="orders" fill="#00C853" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Sales by Category</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Top Selling Items</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="center">Orders (simulated)</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topItems.map((item: any) => (
                    <TableRow key={item.name} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography></TableCell>
                      <TableCell align="center"><Chip label={item.orders} size="small" color="primary" /></TableCell>
                      <TableCell align="right" fontWeight={600}>₹{item.revenue.toFixed(2)}</TableCell>
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