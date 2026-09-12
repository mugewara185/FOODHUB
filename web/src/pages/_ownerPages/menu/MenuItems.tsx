import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Avatar, Chip, Button, TextField,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem as SelectItem, CircularProgress, Alert
} from '@mui/material';
import {
  Search, Edit, Delete, RestaurantMenu, FilterList, Star, Block, PhotoCamera, Add
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../core/hooks';
import { fetchOwnerData, updateMenuItemAvailability } from '../../../features/owner/store/ownerSlice';

const MenuItems: React.FC = () => {
  const dispatch = useAppDispatch();
  const { menu, status, error } = useAppSelector((state: any) => state.owner);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchOwnerData());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  if (status === 'failed') {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  const handleToggleAvailability = (id: string, isAvailable: boolean) => {
    dispatch(updateMenuItemAvailability({ itemId: id, isAvailable: !isAvailable }));
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setEditDialog(true);
  };

  const filteredMenu = menu.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>Menu Management</Typography>
          <Typography variant="body1" color="text.secondary">Manage your restaurant's food items and categories</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>Add New Item</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Chip label="All Items" color="primary" />
            <Chip label="Available" />
            <Chip label="Out of Stock" />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Available</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMenu.map((item: any) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={item.image} sx={{ width: 40, height: 40 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>₹{item.price}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={item.isAvailable}
                      onChange={() => handleToggleAvailability(item.id, item.isAvailable)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(item)}><Edit /></IconButton>
                    <IconButton size="small" color="error"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Menu Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Item Name" defaultValue={selectedItem?.name} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" defaultValue={selectedItem?.category}>
                  <SelectItem value={selectedItem?.category}>{selectedItem?.category}</SelectItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Price" type="number" defaultValue={selectedItem?.price} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={3} defaultValue={selectedItem?.description} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setEditDialog(false)}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuItems;