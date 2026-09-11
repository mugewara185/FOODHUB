import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button, Chip, IconButton,
  Stack, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, CircularProgress
} from '@mui/material';
import { LocationOn, Home, Work, Edit, Delete, Add, CheckCircle } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { restoreAuthThunk } from '@/features/auth/authSlice';
import { authApi } from '@/services/api/authApi';
import type { IAddress as Address } from '@/core/types/auth';

const Addresses: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const addresses = user?.addresses || [];

  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});

  const handleAddAddress = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      await authApi.addAddress({
        ...currentAddress,
        type: currentAddress.type || 'home',
        isDefault: addresses.length === 0 ? true : (currentAddress.isDefault || false)
      }, user.token);
      await dispatch(restoreAuthThunk()).unwrap();
      setAddDialogOpen(false);
      setCurrentAddress({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user?.token) return;
    setLoading(true);
    try {
      await authApi.removeAddress(id, user.token);
      await dispatch(restoreAuthThunk()).unwrap();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>Saved Addresses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)} disabled={loading}>
          Add New Address
        </Button>
      </Box>
      <Grid container spacing={3}>
        {addresses.map((address) => (
          <Grid item xs={12} md={6} key={address.id || address._id}>
            <Card variant="outlined" sx={{ position: 'relative', height: '100%', borderColor: address.isDefault ? 'primary.main' : 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {address.type === 'home' ? <Home color="action" /> : <Work color="action" />}
                    <Typography variant="subtitle1" fontWeight={600}>{address.name}</Typography>
                    {address.isDefault && <Chip size="small" color="primary" label="Default" />}
                  </Stack>
                  <IconButton size="small" color="error" onClick={() => handleDeleteAddress(address.id || address._id!)} disabled={loading}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography variant="body2" color="text.secondary" paragraph>{address.street}, {address.city}, {address.zipCode}</Typography>
                <Typography variant="body2" fontWeight={500}>Phone: {address.phone}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Address</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={currentAddress.name || ''} onChange={e => setCurrentAddress({...currentAddress, name: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={currentAddress.phone || ''} onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Street Address" multiline rows={2} value={currentAddress.street || ''} onChange={e => setCurrentAddress({...currentAddress, street: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="City" value={currentAddress.city || ''} onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Zip Code" value={currentAddress.zipCode || ''} onChange={e => setCurrentAddress({...currentAddress, zipCode: e.target.value})} /></Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Address Type</FormLabel>
                <RadioGroup row value={currentAddress.type || 'home'} onChange={e => setCurrentAddress({...currentAddress, type: e.target.value as any})}>
                  <FormControlLabel value="home" control={<Radio />} label="Home" />
                  <FormControlLabel value="work" control={<Radio />} label="Work" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAddress} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Save Address'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Addresses;

