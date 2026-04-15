import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Edit,
  CameraAlt,
  AdminPanelSettings,
  Security,
  History,
  Notifications,
  Email,
  Phone,
  LocationOn,
  Badge as BadgeIcon,
} from '@mui/icons-material';

const AdminProfile: React.FC = () => {
  const [editMode, setEditMode] = useState(false);

  const admin = {
    name: 'Admin User',
    email: 'admin@foodhub.com',
    phone: '+91 98765 43210',
    role: 'Super Admin',
    department: 'Platform Operations',
    location: 'Mumbai, India',
    joinDate: '2022-01-01',
    lastLogin: '2024-01-20 09:30 AM',
    permissions: ['full_access', 'user_management', 'restaurant_management', 'payment_management'],
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Admin Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your administrator account
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                <AdminPanelSettings sx={{ fontSize: 60 }} />
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <CameraAlt />
              </IconButton>
            </Box>

            <Typography variant="h5" fontWeight={700}>
              {admin.name}
            </Typography>
            <Chip label={admin.role} color="primary" sx={{ mt: 1 }} />

            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{admin.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{admin.phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{admin.location}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon fontSize="small" color="action" />
                <Typography variant="body2">Joined {admin.joinDate}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="text.secondary">
              Last Login: {admin.lastLogin}
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={8}>
          {/* Personal Information */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  defaultValue={admin.name}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={admin.email}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  defaultValue={admin.phone}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  defaultValue={admin.department}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant={editMode ? 'contained' : 'outlined'}
                startIcon={<Edit />}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </Box>
          </Paper>

          {/* Permissions */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Permissions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {admin.permissions.map((perm) => (
                <Chip
                  key={perm}
                  label={perm.replace('_', ' ')}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>

          {/* Activity Log */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <History />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Action ${i}`}
                    secondary={`${i} hour${i > 1 ? 's' : ''} ago`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminProfile;