import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Switch, Button,
  TextField, Alert, Chip, Divider, IconButton, Stack, CircularProgress
} from '@mui/material';
import {
  AccessTime, Save, Restore, CheckCircle, Close, PowerSettingsNew
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../core/hooks';
import { fetchOwnerData, updateRestaurantStatus } from '../../../features/owner/store/ownerSlice';

const BusinessHours: React.FC = () => {
  const dispatch = useAppDispatch();
  const { restaurant, status, error } = useAppSelector((state: any) => state.owner);

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

  const handleToggleStatus = () => {
    if (restaurant) {
      dispatch(updateRestaurantStatus(!restaurant.isOpen));
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>Business Hours & Operations</Typography>
        <Typography variant="body1" color="text.secondary">Set your restaurant's operating hours and status</Typography>
      </Box>

      {/* Status Alert & Quick Action */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Alert severity={restaurant?.isOpen ? 'success' : 'warning'} icon={restaurant?.isOpen ? <CheckCircle /> : <PowerSettingsNew />} sx={{ borderRadius: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {restaurant?.isOpen ? 'Restaurant is currently Open and accepting orders' : 'Restaurant is currently Closed (Temporary Closure)'}
              </Typography>
            </Box>
          </Alert>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button fullWidth variant={restaurant?.isOpen ? 'outlined' : 'contained'} color={restaurant?.isOpen ? 'error' : 'success'} size="large" onClick={handleToggleStatus} sx={{ height: '100%' }}>
            {restaurant?.isOpen ? 'Stop Accepting Orders' : 'Start Accepting Orders'}
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Weekly Schedule</Typography>
              <Button startIcon={<Restore />} size="small">Reset to Default</Button>
            </Box>

            <Stack spacing={2}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <Paper key={day} variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1" fontWeight={600}>{day}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField label="Open" type="time" defaultValue="10:00" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField label="Close" type="time" defaultValue="23:00" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Holidays & Closures</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">2026-01-26 (Republic Day)</Typography>
                  <IconButton size="small" color="error"><Close /></IconButton>
                </Box>
              </Stack>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>Add Holiday</Button>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Timezone</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>All times are in Indian Standard Time (IST)</Typography>
              <Chip label="UTC +5:30" size="small" />
            </CardContent>
          </Card>

          <Box sx={{ mt: 3 }}>
            <Button fullWidth variant="contained" size="large" startIcon={<Save />}>Save Changes</Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessHours;