import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Card,
  CardContent,
  Rating,
  Alert,
} from '@mui/material';
import {
  Edit,
  Save,
  CameraAlt,
  LocationOn,
  Phone,
  Email,
  AccessTime,
  Store,
  Verified,
  Warning,
} from '@mui/icons-material';

const RestaurantProfile: React.FC = () => {
  const [editMode, setEditMode] = useState(false);

  const restaurant = {
    name: 'Spice Garden',
    email: 'contact@spicegarden.com',
    phone: '+91 98765 43210',
    address: '123 Park Avenue, Andheri East, Mumbai - 400069',
    cuisine: ['Indian', 'North Indian', 'Mughlai'],
    description: 'Authentic Indian cuisine served in a modern setting. Known for our butter chicken and biryani.',
    established: '2018',
    gst: '27ABCDE1234F1Z5',
    fssai: '12345678901234',
    pan: 'ABCDE1234F',
    bankAccount: 'HDFC Bank •••• 1234',
    rating: 4.8,
    totalReviews: 1245,
    isVerified: true,
    isActive: true,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Restaurant Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your restaurant information and settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={editMode ? <Save /> : <Edit />}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            {/* Cover Image */}
            <Box
              sx={{
                height: 200,
                borderRadius: 2,
                bgcolor: 'grey.200',
                mb: 3,
                position: 'relative',
                backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  bgcolor: 'background.paper',
                }}
              >
                <CameraAlt />
              </IconButton>
            </Box>

            {/* Profile Picture */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"
                  sx={{ width: 100, height: 100 }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                  }}
                >
                  <CameraAlt fontSize="small" />
                </IconButton>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {restaurant.name}
                  </Typography>
                  {restaurant.isVerified && (
                    <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={restaurant.rating} readOnly />
                  <Typography variant="body2">({restaurant.totalReviews} reviews)</Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Form */}
            <Stack spacing={3}>
              <TextField
                label="Restaurant Name"
                fullWidth
                defaultValue={restaurant.name}
                disabled={!editMode}
              />
              
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                defaultValue={restaurant.description}
                disabled={!editMode}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    defaultValue={restaurant.email}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    defaultValue={restaurant.phone}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                defaultValue={restaurant.address}
                disabled={!editMode}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="GST Number"
                    fullWidth
                    defaultValue={restaurant.gst}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="FSSAI License"
                    fullWidth
                    defaultValue={restaurant.fssai}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="PAN Number"
                    fullWidth
                    defaultValue={restaurant.pan}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Info Cards */}
        <Grid item xs={12} md={4}>
          {/* Status Card */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Restaurant Status
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Account Status
                  </Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Verification
                  </Typography>
                  <Chip label="Verified" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {restaurant.established}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Cuisine Card */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Cuisine Types
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {restaurant.cuisine.map((c, index) => (
                  <Chip key={index} label={c} />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Business Hours Card */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Business Hours
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Monday - Friday</Typography>
                  <Typography variant="body2" fontWeight={600}>10:00 - 23:00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Saturday - Sunday</Typography>
                  <Typography variant="body2" fontWeight={600}>09:00 - 00:00</Typography>
                </Box>
              </Stack>
              <Button size="small" sx={{ mt: 2 }}>Edit Hours</Button>
            </CardContent>
          </Card>

          {/* Bank Details Card */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Bank Details
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {restaurant.bankAccount}
              </Typography>
              <Button size="small" color="primary">
                Update Bank Info
              </Button>
            </CardContent>
          </Card>

          {/* Verification Alert */}
          {!restaurant.isVerified && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Your restaurant is pending verification. Complete your profile to get verified.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RestaurantProfile;