import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Slider,
} from '@mui/material';
import {
  Save,
  Restaurant,
  LocalShipping,
  Payment,
  Security,
  Email,
  Phone,
  Language,
  AttachMoney,
  Percent,
} from '@mui/icons-material';

const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'FoodHub',
    platformEmail: 'support@foodhub.com',
    platformPhone: '+91 98765 43210',
    platformAddress: '123 Tech Park, Mumbai',
    
    // Commission Settings
    defaultCommission: 15,
    minCommission: 10,
    maxCommission: 25,
    
    // Delivery Settings
    baseDeliveryFee: 29,
    perKmFee: 5,
    freeDeliveryThreshold: 499,
    
    // Order Settings
    maxOrderQuantity: 50,
    orderCancellationTime: 2, // minutes
    autoAssignDelivery: true,
    
    // Payment Settings
    codEnabled: true,
    onlinePaymentEnabled: true,
    walletEnabled: true,
    
    // Tax Settings
    taxRate: 5,
    serviceFee: 10,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    
    // Security Settings
    twoFactorAuth: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30, // minutes
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // API call to save settings
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Platform Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure global platform settings and preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Platform Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Platform Name"
                  fullWidth
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Support Email"
                  type="email"
                  fullWidth
                  value={settings.platformEmail}
                  onChange={(e) => setSettings({ ...settings, platformEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Support Phone"
                  fullWidth
                  value={settings.platformPhone}
                  onChange={(e) => setSettings({ ...settings, platformPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Address"
                  fullWidth
                  value={settings.platformAddress}
                  onChange={(e) => setSettings({ ...settings, platformAddress: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Commission Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Default Commission (%)"
                  type="number"
                  fullWidth
                  value={settings.defaultCommission}
                  onChange={(e) => setSettings({ ...settings, defaultCommission: parseInt(e.target.value) })}
                  InputProps={{
                    endAdornment: <Percent />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Minimum Commission (%)"
                  type="number"
                  fullWidth
                  value={settings.minCommission}
                  onChange={(e) => setSettings({ ...settings, minCommission: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Maximum Commission (%)"
                  type="number"
                  fullWidth
                  value={settings.maxCommission}
                  onChange={(e) => setSettings({ ...settings, maxCommission: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Delivery Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Base Delivery Fee (₹)"
                  type="number"
                  fullWidth
                  value={settings.baseDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, baseDeliveryFee: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Per KM Fee (₹)"
                  type="number"
                  fullWidth
                  value={settings.perKmFee}
                  onChange={(e) => setSettings({ ...settings, perKmFee: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Free Delivery Threshold (₹)"
                  type="number"
                  fullWidth
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoAssignDelivery}
                    onChange={(e) => setSettings({ ...settings, autoAssignDelivery: e.target.checked })}
                  />
                }
                label="Auto-assign orders to available delivery partners"
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Order Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Max Items per Order"
                  type="number"
                  fullWidth
                  value={settings.maxOrderQuantity}
                  onChange={(e) => setSettings({ ...settings, maxOrderQuantity: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cancellation Time (minutes)"
                  type="number"
                  fullWidth
                  value={settings.orderCancellationTime}
                  onChange={(e) => setSettings({ ...settings, orderCancellationTime: parseInt(e.target.value) })}
                  helperText="Time allowed to cancel after placing order"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Payment Methods
            </Typography>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.codEnabled}
                    onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                  />
                }
                label="Cash on Delivery"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.onlinePaymentEnabled}
                    onChange={(e) => setSettings({ ...settings, onlinePaymentEnabled: e.target.checked })}
                  />
                }
                label="Online Payments (Cards/UPI)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.walletEnabled}
                    onChange={(e) => setSettings({ ...settings, walletEnabled: e.target.checked })}
                  />
                }
                label="FoodHub Wallet"
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Tax & Fees
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Tax Rate (%)"
                  type="number"
                  fullWidth
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseInt(e.target.value) })}
                  InputProps={{
                    endAdornment: <Percent />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Service Fee (₹)"
                  type="number"
                  fullWidth
                  value={settings.serviceFee}
                  onChange={(e) => setSettings({ ...settings, serviceFee: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Security Settings
            </Typography>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                  />
                }
                label="Enable 2FA for admin accounts"
              />
              <TextField
                label="Max Login Attempts"
                type="number"
                fullWidth
                size="small"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              />
              <TextField
                label="Session Timeout (minutes)"
                type="number"
                fullWidth
                size="small"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Notification Settings
            </Typography>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  />
                }
                label="Push Notifications"
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Paper sx={{ p: 2, mt: 3, borderRadius: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Save />}
          onClick={handleSave}
        >
          Save All Changes
        </Button>
      </Paper>
    </Box>
  );
};

export default GeneralSettings;