import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Divider,
  Stack,
  TextField,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Edit,
  CameraAlt,
  Person,
  Email,
  Phone,
  LocationOn,
  CreditCard,
  History,
  Favorite,
  Settings,
  Logout,
  Delete,
  Lock,
  Notifications,
  Security,
  Help,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, addAddress, removeAddress } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'home' as const,
    isDefault: false
  });
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = () => {
    // Implement account deletion
    console.log('Delete account');
    setDeleteDialogOpen(false);
    logout();
  };

  const handleAddAddress = async () => {
    try {
      await addAddress(addressForm);
      setAddressDialogOpen(false);
      setAddressForm({ name: '', phone: '', street: '', city: '', state: '', zipCode: '', type: 'home', isDefault: false });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      await removeAddress(id);
    } catch (e) {
      console.error(e);
    }
  };

  // Mock order history
  const orderHistory = [
    { id: '1', date: '2024-01-15', items: 'Butter Chicken, Naan', total: 450, status: 'Delivered' },
    { id: '2', date: '2024-01-10', items: 'Pizza, Coke', total: 380, status: 'Delivered' },
    { id: '3', date: '2024-01-05', items: 'Burger, Fries', total: 280, status: 'Cancelled' },
  ];

  // Mock saved addresses
  const savedAddresses = [
    { type: 'home', address: '123 Main Street, Mumbai' },
    { type: 'work', address: '456 Office Building, Mumbai' },
  ];

  // Mock payment methods
  const paymentMethods = [
    { type: 'card', last4: '4242', expiry: '12/25' },
    { type: 'upi', upiId: 'john@oksbi' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            {/* Profile Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
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
                  {user?.name?.charAt(0)}
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
              
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              
              <Chip
                label="Verified Account"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Profile Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Orders', value: '24' },
                { label: 'Reviews', value: '18' },
                { label: 'Favorites', value: '12' },
              ].map((stat) => (
                <Grid item xs={4} key={stat.label}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Quick Actions */}
            <List>
              {[
                { icon: <History />, text: 'Order History', onClick: () => setActiveTab(1) },
                { icon: <Favorite />, text: 'Favorites', onClick: () => setActiveTab(2) },
                { icon: <LocationOn />, text: 'Saved Addresses', onClick: () => setActiveTab(3) },
                { icon: <CreditCard />, text: 'Payment Methods', onClick: () => setActiveTab(4) },
                { icon: <Settings />, text: 'Settings', onClick: () => setActiveTab(5) },
              ].map((item) => (
                <ListItem
                  key={item.text}
                  button
                  onClick={item.onClick}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* Danger Zone */}
            <Stack spacing={1}>
              <Button
                startIcon={<Lock />}
                onClick={() => navigate('/change-password')}
                sx={{ justifyContent: 'flex-start' }}
              >
                Change Password
              </Button>
              <Button
                startIcon={<Logout />}
                onClick={handleLogout}
                color="error"
                sx={{ justifyContent: 'flex-start' }}
              >
                Logout
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Tab label="Personal Info" />
              <Tab label="Order History" />
              <Tab label="Favorites" />
              <Tab label="Addresses" />
              <Tab label="Payments" />
              <Tab label="Settings" />
            </Tabs>

            {/* Personal Info Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  Personal Information
                </Typography>
                <Button
                  startIcon={<Edit />}
                  onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                  variant={editMode ? 'contained' : 'outlined'}
                >
                  {editMode ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Box>

              {editMode ? (
                <Stack spacing={3}>
                  <TextField
                    label="Full Name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    value={user?.email}
                    disabled
                    fullWidth
                    helperText="Email cannot be changed"
                  />
                  <TextField
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Person color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Full Name
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {user?.name}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Email color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email Address
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Phone color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {user?.phone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              )}
            </TabPanel>

            {/* Order History Tab */}
            <TabPanel value={activeTab} index={1}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Order History
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                View your past orders and track current ones
              </Typography>
              
              <Stack spacing={2} sx={{ mt: 3 }}>
                {orderHistory.map((order) => (
                  <Card key={order.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Order #{order.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.items}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" color="primary.main" fontWeight={700}>
                            ₹{order.total}
                          </Typography>
                          <Chip
                            label={order.status}
                            color={order.status === 'Delivered' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </TabPanel>

            {/* Favorites Tab */}
            <TabPanel value={activeTab} index={2}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Favorite Restaurants
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your saved restaurants for quick access
              </Typography>
              
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Favorite sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No favorites yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start adding restaurants to your favorites
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }}>
                  Browse Restaurants
                </Button>
              </Box>
            </TabPanel>

            {/* Addresses Tab */}
            <TabPanel value={activeTab} index={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  Saved Addresses
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setAddressDialogOpen(true)}>
                  Add New Address
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {user?.addresses?.map((address, index) => (
                  <Grid item xs={12} md={6} key={address.id || index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Chip label={address.type} size="small" />
                          <Box>
                            <IconButton size="small" color="error" onClick={() => handleRemoveAddress(address.id || address._id!)}>
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="subtitle2">{address.name} ({address.phone})</Typography>
                        <Typography variant="body2" color="text.secondary">{address.street}, {address.city}, {address.state} {address.zipCode}</Typography>
                        <Button
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={() => {
                            // Set as default address
                          }}
                        >
                          {address.isDefault ? 'Default' : 'Set as Default'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Payments Tab */}
            <TabPanel value={activeTab} index={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  Payment Methods
                </Typography>
                <Button variant="contained" startIcon={<Add />}>
                  Add Payment Method
                </Button>
              </Box>
              
              <Stack spacing={2}>
                {paymentMethods.map((method, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CreditCard />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {method.type === 'card' ? `•••• ${method.last4}` : 'UPI'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {method.type === 'card' ? `Expires ${method.expiry}` : method.upiId}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Chip label="Default" size="small" color="primary" />
                          <IconButton size="small" color="error" sx={{ ml: 1 }}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel value={activeTab} index={5}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Account Settings
              </Typography>
              
              <Stack spacing={3}>
                {/* Notification Settings */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Notifications />
                    <Typography variant="h6" fontWeight={600}>
                      Notifications
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Order Updates"
                      labelPlacement="start"
                      sx={{ justifyContent: 'space-between', mx: 0 }}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Promotional Offers"
                      labelPlacement="start"
                      sx={{ justifyContent: 'space-between', mx: 0 }}
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Newsletter"
                      labelPlacement="start"
                      sx={{ justifyContent: 'space-between', mx: 0 }}
                    />
                  </Stack>
                </Paper>

                {/* Privacy Settings */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Security />
                    <Typography variant="h6" fontWeight={600}>
                      Privacy & Security
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <Button
                      startIcon={<Lock />}
                      onClick={() => navigate('/change-password')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Change Password
                    </Button>
                    <Button
                      startIcon={<Help />}
                      onClick={() => navigate('/privacy-policy')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Privacy Policy
                    </Button>
                  </Stack>
                </Paper>

                {/* Danger Zone */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: 'error.main' }}>
                  <Typography variant="h6" fontWeight={600} color="error" gutterBottom>
                    Danger Zone
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    These actions are irreversible. Please proceed with caution.
                  </Alert>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete Account
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete your account? This will:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Permanently delete your profile" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Remove all your order history" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Delete saved addresses and payment methods" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Cancel any pending orders" />
            </ListItem>
          </List>
          <TextField
            fullWidth
            label="Type 'DELETE' to confirm"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Address</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={addressForm.name} onChange={(e) => setAddressForm({...addressForm, name: e.target.value})} fullWidth />
            <TextField label="Phone" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} fullWidth />
            <TextField label="Street" value={addressForm.street} onChange={(e) => setAddressForm({...addressForm, street: e.target.value})} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="City" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} fullWidth />
              <TextField label="State" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} fullWidth />
              <TextField label="ZIP" value={addressForm.zipCode} onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})} fullWidth />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['home', 'work', 'other'].map(type => (
                <Chip
                  key={type}
                  label={type.toUpperCase()}
                  color={addressForm.type === type ? 'primary' : 'default'}
                  onClick={() => setAddressForm({...addressForm, type: type as any})}
                />
              ))}
            </Box>
            <FormControlLabel
              control={<Switch checked={addressForm.isDefault} onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} />}
              label="Set as default address"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAddress}>Save Address</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;

export const ProfileContainer = () => < Profile />;
