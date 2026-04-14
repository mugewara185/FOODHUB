import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  Home,
  Work,
  Edit,
  Delete,
  Add,
  CheckCircle,
} from '@mui/icons-material';

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+91 9876543210',
    street: '123 Main Street, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400053',
    type: 'home',
    isDefault: true,
  },
  {
    id: '2',
    name: 'John Doe',
    phone: '+91 9876543210',
    street: '456 Business Park, BKC',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400051',
    type: 'work',
    isDefault: false,
  },
];

const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const handleSetDefault = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleAddAddress = () => {
    const newAddress: Address = {
      id: Date.now().toString(),
      name: currentAddress.name || '',
      phone: currentAddress.phone || '',
      street: currentAddress.street || '',
      city: currentAddress.city || '',
      state: currentAddress.state || '',
      zipCode: currentAddress.zipCode || '',
      type: (currentAddress.type as any) || 'home',
      isDefault: addresses.length === 0 ? true : (currentAddress.isDefault || false),
    };

    setAddresses(prev => {
      let updated = [...prev, newAddress];
      if (newAddress.isDefault) {
        updated = updated.map(addr => ({
          ...addr,
          isDefault: addr.id === newAddress.id,
        }));
      }
      return updated;
    });

    setAddDialogOpen(false);
    setCurrentAddress({});
  };

  const handleEditAddress = () => {
    setAddresses(prev =>
      prev.map(addr =>
        addr.id === currentAddress.id
          ? { ...addr, ...currentAddress }
          : addr
      )
    );
    setEditDialogOpen(false);
    setCurrentAddress({});
  };

  const handleDeleteAddress = () => {
    if (addressToDelete) {
      const addressToDeleteObj = addresses.find(a => a.id === addressToDelete);
      setAddresses(prev => prev.filter(addr => addr.id !== addressToDelete));
      
      // If we deleted the default address, make another one default
      if (addressToDeleteObj?.isDefault && addresses.length > 1) {
        const newDefault = addresses.find(addr => addr.id !== addressToDelete);
        if (newDefault) {
          handleSetDefault(newDefault.id);
        }
      }
      
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const openEditDialog = (address: Address) => {
    setCurrentAddress(address);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home />;
      case 'work':
        return <Work />;
      default:
        return <LocationOn />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Saved Addresses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your delivery addresses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setCurrentAddress({ type: 'home' });
            setAddDialogOpen(true);
          }}
          sx={{ borderRadius: 2 }}
        >
          Add New Address
        </Button>
      </Box>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <LocationOn sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No addresses saved
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first delivery address
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setCurrentAddress({ type: 'home' });
              setAddDialogOpen(true);
            }}
          >
            Add Address
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {addresses.map((address) => (
            <Grid item xs={12} md={6} key={address.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  position: 'relative',
                  border: address.isDefault ? 2 : 0,
                  borderColor: 'primary.main',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Address Type & Default Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        {getAddressIcon(address.type)}
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                        {address.type}
                      </Typography>
                    </Box>
                    {address.isDefault && (
                      <Chip
                        label="Default"
                        color="primary"
                        size="small"
                        icon={<CheckCircle />}
                      />
                    )}
                  </Box>

                  {/* Address Details */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="body1" fontWeight={500}>
                      {address.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.street}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.city}, {address.state} - {address.zipCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {address.phone}
                    </Typography>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      {!address.isDefault && (
                        <Button
                          size="small"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(address.id)}
                        disabled={addresses.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Address Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Add New Address
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={currentAddress.name || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, name: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={currentAddress.phone || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, phone: e.target.value })}
            />
            <TextField
              label="Street Address"
              fullWidth
              multiline
              rows={2}
              value={currentAddress.street || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, street: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  fullWidth
                  value={currentAddress.city || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  fullWidth
                  value={currentAddress.state || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, state: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Zip Code"
              fullWidth
              value={currentAddress.zipCode || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, zipCode: e.target.value })}
            />
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Address Type</FormLabel>
              <RadioGroup
                row
                value={currentAddress.type || 'home'}
                onChange={(e) => setCurrentAddress({ ...currentAddress, type: e.target.value as any })}
              >
                <FormControlLabel value="home" control={<Radio />} label="Home" />
                <FormControlLabel value="work" control={<Radio />} label="Work" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>

            {addresses.length > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentAddress.isDefault || false}
                    onChange={(e) => setCurrentAddress({ ...currentAddress, isDefault: e.target.checked })}
                  />
                }
                label="Set as default address"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddAddress}
            disabled={!currentAddress.name || !currentAddress.phone || !currentAddress.street}
          >
            Save Address
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Edit Address
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={currentAddress.name || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, name: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={currentAddress.phone || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, phone: e.target.value })}
            />
            <TextField
              label="Street Address"
              fullWidth
              multiline
              rows={2}
              value={currentAddress.street || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, street: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  fullWidth
                  value={currentAddress.city || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  fullWidth
                  value={currentAddress.state || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, state: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Zip Code"
              fullWidth
              value={currentAddress.zipCode || ''}
              onChange={(e) => setCurrentAddress({ ...currentAddress, zipCode: e.target.value })}
            />
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Address Type</FormLabel>
              <RadioGroup
                row
                value={currentAddress.type || 'home'}
                onChange={(e) => setCurrentAddress({ ...currentAddress, type: e.target.value as any })}
              >
                <FormControlLabel value="home" control={<Radio />} label="Home" />
                <FormControlLabel value="work" control={<Radio />} label="Work" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={currentAddress.isDefault || false}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, isDefault: e.target.checked })}
                />
              }
              label="Set as default address"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditAddress}
          >
            Update Address
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700} color="error">
            Delete Address
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this address?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAddress}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Addresses;