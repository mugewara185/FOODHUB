import React from 'react';
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
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  LocalShipping,
  AccessTime,
  Star,
  LocationOn,
  Phone,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import { selectPartnerStats, selectActiveAssignment, selectIsPartnerOnline, toggleOnlineStatus } from '@features/deliveryPartner/deliveryPartnerSlice';

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectPartnerStats);
  const currentOrder = useAppSelector(selectActiveAssignment);
  const isOnline = useAppSelector(selectIsPartnerOnline);

  const handleToggleOnline = () => {
    dispatch(toggleOnlineStatus());
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Welcome back, Rahul!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your delivery summary for today
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={isOnline}
              onChange={handleToggleOnline}
              color="success"
            />
          }
          label={
            <Typography variant="h6" color={isOnline ? 'success.main' : 'text.secondary'}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
          }
          labelPlacement="start"
        />
      </Box>

      {/* Current Order Alert */}
      {currentOrder && (
        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Active Delivery
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Order #{currentOrder.id}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      From: {currentOrder.restaurant}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      To: {currentOrder.customer}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Distance: {currentOrder.distance}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Est. Time: {currentOrder.estimatedTime}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Earnings: ₹{currentOrder.amount}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={() => navigate('/partner/active')}
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                >
                  View Details
                </Button>
              </Grid>
            </Grid>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
              zIndex: 0,
            }}
          />
        </Paper>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Today's Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <LocalShipping />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Deliveries
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.todayDeliveries}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Earnings
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{stats.todayEarnings}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <AccessTime />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Online Hours
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.onlineHours}h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.avgRating}
                    </Typography>
                    <Rating value={stats.avgRating} readOnly size="small" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance & Earnings */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Performance Overview
            </Typography>
            
            <Grid container spacing={2}>
              {[
                { label: 'Acceptance Rate', value: stats.acceptanceRate, color: 'success' },
                { label: 'On-Time Delivery', value: 98, color: 'info' },
                { label: 'Completion Rate', value: 99, color: 'primary' },
              ].map((metric) => (
                <Grid item xs={12} sm={4} key={metric.label}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {metric.label}
                    </Typography>
                    <Typography variant="h3" fontWeight={700} color={`${metric.color}.main`}>
                      {metric.value}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metric.value}
                      color={metric.color as any}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Recent Activity */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Recent Deliveries
            </Typography>
            <List>
              {useAppSelector(state => state.deliveryPartner.history).slice(0, 4).map((order) => (
                <ListItem key={order.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Order #${order.id}`}
                    secondary={`${order.restaurant} → ${order.customer} • ₹${order.amount}`}
                  />
                  <Chip
                    size="small"
                    label="Completed"
                    color="success"
                    variant="outlined"
                  />
                </ListItem>
              ))}
              {useAppSelector(state => state.deliveryPartner.history).length === 0 && (
                <Typography variant="body2" color="text.secondary">No recent deliveries</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Earnings Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Earnings Summary
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Today
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  ₹{stats.todayEarnings}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats.todayEarnings / 1000) * 100}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  This Week
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  ₹{stats.weeklyEarnings}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats.weeklyEarnings / 5000) * 100}
                  color="success"
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  This Month
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  ₹{stats.totalEarnings}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats.totalEarnings / 150000) * 100}
                  color="warning"
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>

              <Divider />

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/partner/earnings')}
              >
                View Detailed Earnings
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PartnerDashboard;