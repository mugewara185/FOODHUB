import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Edit,
  CameraAlt,
  Verified,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchPartnerStateThunk } from '../../features/deliveryPartner/deliveryPartnerSlice';

const Profile: React.FC = () => {
  const [editMode, setEditMode] = useState(false);
  const dispatch = useAppDispatch();

  const partnerState = useAppSelector((state) => state.deliveryPartner);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchPartnerStateThunk());
  }, [dispatch]);

  const displayName = partnerState.name || user?.name || 'Partner';
  const displayPhone = partnerState.phone || '—';
  const displayVehicle = partnerState.vehicle || '—';
  const displayRating = partnerState.rating ?? '—';
  const displayDeliveries = partnerState.completedDeliveries ?? 0;
  const displayStatus = partnerState.status || 'OFFLINE';

  return (
    <Box>
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
              {displayName}
            </Typography>
            <Chip
              icon={<Verified />}
              label={`Status: ${displayStatus}`}
              color={displayStatus === 'ONLINE' ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h6" fontWeight={700}>
                  {displayDeliveries}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deliveries
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" fontWeight={700}>
                  {displayRating}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rating
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Vehicle Details
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{displayVehicle}</Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

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
                  value={displayName}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  disabled={true}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={displayPhone}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;