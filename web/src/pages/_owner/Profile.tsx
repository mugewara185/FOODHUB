import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchOwnerRestaurantThunk } from '../../features/owner/ownerRestaurantSlice';

const OwnerProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: restaurant, isLoading, error } = useAppSelector((state) => state.ownerRestaurant as any);

  useEffect(() => {
    dispatch(fetchOwnerRestaurantThunk());
  }, [dispatch]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !restaurant) {
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">
          No restaurant linked to your account
        </Typography>
        <Typography variant="body1">
          Please contact support to link your restaurant.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Restaurant Profile
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {restaurant.imageUrl && (
          <Box mb={3}>
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name} 
              style={{ width: '100%', maxWidth: 400, borderRadius: 8 }}
            />
          </Box>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
            <Typography variant="h6">{restaurant.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">City</Typography>
            <Typography variant="h6">{restaurant.city}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Cuisine</Typography>
            <Typography variant="h6">
              {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Rating</Typography>
            <Typography variant="h6">{restaurant.rating} ⭐</Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={restaurant.isOpen} disabled />}
              label={restaurant.isOpen ? 'Currently Open' : 'Currently Closed'}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default OwnerProfile;
