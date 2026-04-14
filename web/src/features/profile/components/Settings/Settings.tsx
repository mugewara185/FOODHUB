import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Stack,
  Avatar,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton as MuiIconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  DialogTitle,
  DialogContent,
  Dialog,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Edit,
  CameraAlt,
  Email,
  Phone,
  Lock,
  Notifications,
  Security,
  Language,
  Delete,
  Visibility,
  VisibilityOff,
  Person,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/app/store';
// import { updateUser, selectUser } from '../../features/auth/authSlice';
import { showToast } from '@/features/ui/uiSlice';

interface UserSettingsData {
  name: string;
  email: string;
  phone: string;
  language: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  twoFactorAuth: boolean;
  savePaymentInfo: boolean;
}

const UserSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  //   const user = useAppSelector(selectUser);
  const user = '';

  const [editMode, setEditMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // User settings state
  const [settings, setSettings] = useState<UserSettingsData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    twoFactorAuth: false,
    savePaymentInfo: true,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSettingChange = (field: keyof UserSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    // dispatch(updateUser({ name: settings.name, phone: settings.phone }));
    setEditMode(false);
    dispatch(showToast({ message: 'Settings saved successfully', type: 'success' }));
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
      return;
    }

    // API call to change password would go here
    setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
    setPasswordDialog(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = () => {
    // API call to delete account would go here
    setSnackbar({ open: true, message: 'Account deletion requested', severity: 'info' });
    setDeleteDialog(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Account Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account preferences and security settings
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            {/* Profile Picture */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                {settings.name.charAt(0)}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <CameraAlt />
              </IconButton>
            </Box>

            <Typography variant="h5" fontWeight={700}>
              {settings.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {settings.email}
            </Typography>
            <Chip
              label="Verified Account"
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Quick Stats */}
            <Grid container spacing={2}>
              {[
                { label: 'Orders', value: '24' },
                { label: 'Reviews', value: '18' },
                { label: 'Member Since', value: 'Jan 2024' },
              ].map((stat) => (
                <Grid item xs={4} key={stat.label}>
                  <Typography variant="h6" fontWeight={700}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Account Status */}
            <Alert severity="success" sx={{ mb: 2 }}>
              Account Status: Active
            </Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialog(true)}
              fullWidth
            >
              Delete Account
            </Button>
          </Paper>
        </Grid>

        {/* Right Column - Settings Forms */}
        <Grid item xs={12} md={8}>
          {/* Personal Information */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Personal Information
              </Typography>
              <Button
                startIcon={editMode ? <Save /> : <Edit />}
                onClick={editMode ? handleSaveSettings : () => setEditMode(true)}
                variant={editMode ? 'contained' : 'outlined'}
              >
                {editMode ? 'Save Changes' : 'Edit'}
              </Button>
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Full Name"
                value={settings.name}
                onChange={(e) => handleSettingChange('name', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Email Address"
                value={settings.email}
                disabled
                helperText="Email cannot be changed"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={settings.phone}
                onChange={(e) => handleSettingChange('phone', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Paper>

          {/* Password & Security */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Password & Security
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setPasswordDialog(true)}
                sx={{ justifyContent: 'flex-start' }}
              >
                Change Password
              </Button>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Two-Factor Authentication</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add an extra layer of security to your account
                    </Typography>
                  </Box>
                }
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.savePaymentInfo}
                    onChange={(e) => handleSettingChange('savePaymentInfo', e.target.checked)}
                  />
                }
                label="Save payment information for faster checkout"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />
            </Stack>
          </Paper>

          {/* Notification Preferences */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Notification Preferences
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                }
                label="Email Notifications"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.orderUpdates}
                    onChange={(e) => handleSettingChange('orderUpdates', e.target.checked)}
                  />
                }
                label="Order Status Updates"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.promotionalEmails}
                    onChange={(e) => handleSettingChange('promotionalEmails', e.target.checked)}
                  />
                }
                label="Promotional Offers & Deals"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />
            </Stack>
          </Paper>

          {/* Regional Settings */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Regional Settings
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.language}
                    label="Language"
                    onChange={(e: SelectChangeEvent) => handleSettingChange('language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                    <MenuItem value="mr">Marathi</MenuItem>
                    <MenuItem value="bn">Bengali</MenuItem>
                    <MenuItem value="te">Telugu</MenuItem>
                    <MenuItem value="ta">Tamil</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={settings.currency}
                    label="Currency"
                    onChange={(e: SelectChangeEvent) => handleSettingChange('currency', e.target.value)}
                  >
                    <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                    <MenuItem value="USD">US Dollar ($)</MenuItem>
                    <MenuItem value="EUR">Euro (€)</MenuItem>
                    <MenuItem value="GBP">British Pound (£)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.timezone}
                    label="Timezone"
                    onChange={(e: SelectChangeEvent) => handleSettingChange('timezone', e.target.value)}
                  >
                    <MenuItem value="Asia/Kolkata">IST (UTC+5:30)</MenuItem>
                    <MenuItem value="Asia/Dubai">GST (UTC+4)</MenuItem>
                    <MenuItem value="America/New_York">EST (UTC-5)</MenuItem>
                    <MenuItem value="Europe/London">GMT (UTC+0)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Save All Button */}
          {editMode && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={handleSaveSettings}
              sx={{ borderRadius: 2 }}
            >
              Save All Changes
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Alert severity="info">
              Password must be at least 6 characters and contain at least one uppercase letter and one number.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword}>Change Password</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography variant="body2" paragraph>
            Deleting your account will:
          </Typography>
          <ul>
            <li>Remove all your order history</li>
            <li>Delete saved addresses and payment methods</li>
            <li>Cancel any pending orders</li>
            <li>Remove your reviews and ratings</li>
          </ul>
          <TextField
            fullWidth
            label="Type 'DELETE' to confirm"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAccount}>
            Permanently Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserSettings;