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
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  Edit,
  CameraAlt,
  Verified,
  Star,
  LocalShipping,
  AccessTime,
  Phone,
  Email,
  LocationOn,
  CreditCard,
  Security,
} from '@mui/icons-material';

const Profile: React.FC = () => {
  const [editMode, setEditMode] = useState(false);

  const partner = {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
    vehicleType: 'Bike',
    vehicleNumber: 'MH 12 AB 1234',
    licenseNumber: 'DL-123456789',
    address: '123 Andheri East, Mumbai',
    joinedDate: '2023-01-15',
    deliveries: 1245,
    rating: 4.8,
    completionRate: 99,
    acceptanceRate: 92,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={800}>
          My Profile
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            {/* Profile Picture */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src="https://i.pravatar.cc/150?img=1"
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main',
                }}
              />
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
              {partner.name}
            </Typography>
            <Chip
              icon={<Verified />}
              label="Verified Partner"
              color="success"
              sx={{ mt: 1 }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Stats */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="h6" fontWeight={700}>
                  {partner.deliveries}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deliveries
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" fontWeight={700}>
                  {partner.rating}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rating
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" fontWeight={700}>
                  2.5k
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hours
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Vehicle Info */}
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Vehicle Details
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{partner.vehicleType}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Number</Typography>
                  <Typography variant="body2" fontWeight={600}>{partner.vehicleNumber}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">License</Typography>
                  <Typography variant="body2" fontWeight={600}>{partner.licenseNumber}</Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Personal Information
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={partner.name}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={partner.email}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={partner.phone}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={partner.address}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              Performance Stats
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {partner.completionRate}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={partner.completionRate}
                      color="success"
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Acceptance Rate
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {partner.acceptanceRate}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={partner.acceptanceRate}
                      color="warning"
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Avg. Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" fontWeight={700}>
                        {partner.rating}
                      </Typography>
                      <Rating value={partner.rating} readOnly size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Recent Reviews */}
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recent Reviews
            </Typography>

            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Customer {i}
                    </Typography>
                    <Rating value={5} readOnly size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Great delivery partner! Very polite and delivered on time.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 days ago
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;