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
  Alert,
  Avatar,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Notifications,
  Language,
  DarkMode,
  LightMode,
  VolumeUp,
  LocationOn,
  Security,
  Save,
  Edit,
  CameraAlt,
} from '@mui/icons-material';

const PartnerSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'system',
    language: 'en',
    
    // Notifications
    pushNotifications: true,
    newOrderAlerts: true,
    deliveryUpdates: true,
    paymentAlerts: true,
    promotionalAlerts: false,
    
    // Sound
    soundEnabled: true,
    vibrationEnabled: true,
    
    // Privacy
    shareLocation: true,
    showOnlineStatus: true,
    allowSearchByPhone: false,
    
    // Delivery
    autoAcceptOrders: false,
    maxDistance: 10,
    vehicleType: 'bike',
  });

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Save to API/localStorage
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Customize your delivery partner experience
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {/* Appearance */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Appearance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.theme}
                    label="Theme"
                    onChange={(e) => handleChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System Default</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.language}
                    label="Language"
                    onChange={(e) => handleChange('language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                    <MenuItem value="mr">Marathi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Notifications */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Notifications
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                  />
                }
                label="Enable push notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.newOrderAlerts}
                    onChange={(e) => handleChange('newOrderAlerts', e.target.checked)}
                  />
                }
                label="New order alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.deliveryUpdates}
                    onChange={(e) => handleChange('deliveryUpdates', e.target.checked)}
                  />
                }
                label="Delivery status updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.paymentAlerts}
                    onChange={(e) => handleChange('paymentAlerts', e.target.checked)}
                  />
                }
                label="Payment confirmations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.promotionalAlerts}
                    onChange={(e) => handleChange('promotionalAlerts', e.target.checked)}
                  />
                }
                label="Promotional offers"
              />
            </Stack>
          </Paper>

          {/* Sound & Vibration */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Sound & Vibration
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  />
                }
                label="Enable sound"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.vibrationEnabled}
                    onChange={(e) => handleChange('vibrationEnabled', e.target.checked)}
                  />
                }
                label="Enable vibration"
              />
            </Stack>
          </Paper>

          {/* Delivery Preferences */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Preferences
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoAcceptOrders}
                    onChange={(e) => handleChange('autoAcceptOrders', e.target.checked)}
                  />
                }
                label="Auto-accept orders within range"
              />
              <TextField
                label="Maximum delivery distance (km)"
                type="number"
                size="small"
                value={settings.maxDistance}
                onChange={(e) => handleChange('maxDistance', e.target.value)}
                fullWidth
              />
              <FormControl fullWidth size="small">
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={settings.vehicleType}
                  label="Vehicle Type"
                  onChange={(e) => handleChange('vehicleType', e.target.value)}
                >
                  <MenuItem value="bike">Bike</MenuItem>
                  <MenuItem value="scooter">Scooter</MenuItem>
                  <MenuItem value="car">Car</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Privacy */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Privacy & Security
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.shareLocation}
                    onChange={(e) => handleChange('shareLocation', e.target.checked)}
                  />
                }
                label="Share live location"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showOnlineStatus}
                    onChange={(e) => handleChange('showOnlineStatus', e.target.checked)}
                  />
                }
                label="Show online status"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowSearchByPhone}
                    onChange={(e) => handleChange('allowSearchByPhone', e.target.checked)}
                  />
                }
                label="Allow search by phone"
              />
              <Button variant="outlined" startIcon={<Security />} fullWidth>
                Change Password
              </Button>
            </Stack>
          </Paper>

          {/* Save Button */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PartnerSettings;