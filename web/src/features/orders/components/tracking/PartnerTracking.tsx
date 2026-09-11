import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  PowerSettingsNew,
  LocalShipping,
  LocationOn,
  CheckCircle,
  Cancel,
  TrendingUp,
  AccessTime,
  AttachMoney,
  RadioButtonChecked,
} from '@mui/icons-material';
import Map from '../../../../shared/components/maps/Map';
import { socketService } from '../../../../services/socket';
import { Coordinates, DeliveryPartner } from '../../types/location';

interface PartnerTrackingProps {
  partnerId: string;
  onStatusChange?: (status: string) => void;
}

const PartnerTracking: React.FC<PartnerTrackingProps> = ({
  partnerId,
  onStatusChange,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [earnings, setEarnings] = useState({
    today: 450,
    week: 2850,
    month: 12400,
  });
  const [stats, setStats] = useState({
    deliveriesToday: 12,
    totalDistance: 45,
    avgTime: 28,
    rating: 4.8,
  });

  // Track partner location
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);

          // Send location to server
          socketService.updatePartnerLocation(partnerId, pos);
        },
        (error) => console.error('Error getting location:', error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline, partnerId]);

  // Mock active order
  useEffect(() => {
    const mockOrder = {
      id: 'ORD-2024-001',
      customer: 'John Doe',
      address: '123 Main Street, Andheri West',
      restaurant: 'Spice Garden',
      restaurantAddress: '456 Park Avenue, Andheri East',
      pickupLocation: { lat: 19.1136, lng: 72.8697 },
      dropoffLocation: { lat: 19.0760, lng: 72.8777 },
      distance: 3.5,
      time: '15 mins',
      amount: 89,
    };
    setActiveOrder(mockOrder);
  }, []);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    socketService.updatePartnerLocation(partnerId, currentLocation!);
  };

  const handleAcceptOrder = () => {
    // Accept order logic
    socketService.updateOrderStatus(activeOrder.id, 'assigned', currentLocation);
  };

  const handleRejectOrder = () => {
    // Reject order logic
    setActiveOrder(null);
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 64, height: 64 }}>
                <LocalShipping />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Delivery Partner Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Partner ID: {partnerId}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
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
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, height: 400 }}>
            <Map
              center={currentLocation || { lat: 19.0760, lng: 72.8777 }}
              markers={[
                ...(currentLocation ? [{
                  id: 'partner',
                  position: currentLocation,
                  type: 'partner',
                  title: 'Your Location',
                }] : []),
                ...(activeOrder ? [
                  {
                    id: 'pickup',
                    position: activeOrder.pickupLocation,
                    type: 'restaurant',
                    title: activeOrder.restaurant,
                  },
                  {
                    id: 'dropoff',
                    position: activeOrder.dropoffLocation,
                    type: 'customer',
                    title: activeOrder.customer,
                  },
                ] : []),
              ]}
              showTraffic={true}
              showUserLocation={true}
              height="100%"
            />
          </Paper>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Today's Stats
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <LocalShipping color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    {stats.deliveriesToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deliveries
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <TrendingUp color="success" />
                  <Typography variant="h6" fontWeight={700}>
                    {stats.avgTime} min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Time
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <AccessTime color="warning" />
                  <Typography variant="h6" fontWeight={700}>
                    {stats.totalDistance} km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Distance
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Star sx={{ color: '#FFB400' }} />
                  <Typography variant="h6" fontWeight={700}>
                    {stats.rating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rating
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              Earnings
            </Typography>

            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Today" />
                <Typography variant="body1" fontWeight={600}>
                  ₹{earnings.today}
                </Typography>
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="This Week" />
                <Typography variant="body1" fontWeight={600}>
                  ₹{earnings.week}
                </Typography>
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="This Month" />
                <Typography variant="body1" fontWeight={600}>
                  ₹{earnings.month}
                </Typography>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Active Order */}
        {activeOrder && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                New Order Available!
              </Typography>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Order #{activeOrder.id}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Restaurant: {activeOrder.restaurant}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Customer: {activeOrder.customer}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Distance: {activeOrder.distance} km
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Est. Time: {activeOrder.time}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Delivery Fee: ₹{activeOrder.amount}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={handleAcceptOrder}
                    sx={{ mr: 2 }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={handleRejectOrder}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Reject
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Live Status */}
        {isOnline && (
          <Grid item xs={12}>
            <Alert severity="success" icon={<RadioButtonChecked />}>
              <Typography variant="body1">
                You are online and receiving orders. Your location is being tracked in real-time.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PartnerTracking;