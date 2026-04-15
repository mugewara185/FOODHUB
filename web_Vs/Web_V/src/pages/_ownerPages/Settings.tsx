import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Alert,
} from '@mui/material';
import {
  Save,
  Notifications,
  Payment,
  LocalShipping,
  Security,
  Language,
} from '@mui/icons-material';

const RestaurantSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Business settings
    autoAcceptOrders: false,
    prepTimeBuffer: 5,
    maxOrdersPerSlot: 10,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    newOrderAlerts: true,
    orderUpdates: true,
    lowStockAlerts: true,
    
    // Payment
    autoPayout: true,
    payoutFrequency: 'weekly',
    minPayoutAmount: 1000,
    
    // Delivery
    allowScheduledOrders: true,
    maxDeliveryDistance: 10,
    advanceBookingDays: 7,
    
    // Communication
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Restaurant Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure your restaurant operations
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {/* Business Operations */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Business Operations
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={settings.autoAcceptOrders} />}
                label="Auto-accept orders"
              />
              <TextField
                label="Preparation time buffer (minutes)"
                type="number"
                value={settings.prepTimeBuffer}
                fullWidth
                size="small"
              />
              <TextField
                label="Max orders per time slot"
                type="number"
                value={settings.maxOrdersPerSlot}
                fullWidth
                size="small"
              />
            </Stack>
          </Paper>

          {/* Notifications */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Notifications
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={settings.emailNotifications} />}
                label="Email notifications"
              />
              <FormControlLabel
                control={<Switch checked={settings.smsNotifications} />}
                label="SMS notifications"
              />
              <FormControlLabel
                control={<Switch checked={settings.newOrderAlerts} />}
                label="New order alerts"
              />
              <FormControlLabel
                control={<Switch checked={settings.orderUpdates} />}
                label="Order status updates"
              />
              <FormControlLabel
                control={<Switch checked={settings.lowStockAlerts} />}
                label="Low stock alerts"
              />
            </Stack>
          </Paper>

          {/* Payment Settings */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Payment Settings
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={settings.autoPayout} />}
                label="Auto-payout earnings"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Payout frequency</InputLabel>
                <Select value={settings.payoutFrequency} label="Payout frequency">
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Bi-weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Minimum payout amount"
                type="number"
                value={settings.minPayoutAmount}
                fullWidth
                size="small"
              />
            </Stack>
          </Paper>

          {/* Delivery Settings */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Settings
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={settings.allowScheduledOrders} />}
                label="Allow scheduled orders"
              />
              <TextField
                label="Maximum delivery distance (km)"
                type="number"
                value={settings.maxDeliveryDistance}
                fullWidth
                size="small"
              />
              <TextField
                label="Advance booking days"
                type="number"
                value={settings.advanceBookingDays}
                fullWidth
                size="small"
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Regional Settings */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Regional Settings
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Language</InputLabel>
                <Select value={settings.language} label="Language">
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">Hindi</MenuItem>
                  <MenuItem value="mr">Marathi</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Currency</InputLabel>
                <Select value={settings.currency} label="Currency">
                  <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                  <MenuItem value="USD">US Dollar ($)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Timezone</InputLabel>
                <Select value={settings.timezone} label="Timezone">
                  <MenuItem value="Asia/Kolkata">IST (UTC+5:30)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Danger Zone */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, borderColor: 'error.main' }}>
            <Typography variant="h6" fontWeight={700} color="error" gutterBottom>
              Danger Zone
            </Typography>
            <Stack spacing={2}>
              <Button variant="outlined" color="warning" fullWidth>
                Temporarily Close Restaurant
              </Button>
              <Button variant="outlined" color="error" fullWidth>
                Deactivate Account
              </Button>
            </Stack>
          </Paper>

          {/* Save Button */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Button fullWidth variant="contained" size="large" startIcon={<Save />}>
              Save All Settings
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RestaurantSettings;