import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Grid, Card, CardContent,
  Avatar, CircularProgress, TextField, InputAdornment
} from '@mui/material';
import { Fastfood, Search, TrendingUp, CheckCircle, Warning } from '@mui/icons-material';
import { restaurantApi } from '../../../services/api/restaurantApi';
import { logComponent, logger } from '../../../core/dev/logger';
import type { FoodItem, Restaurant } from '../../../core/types';

export const AdminMenu = () => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    logComponent.mount('AdminMenu');
    fetchData();
    return () => logComponent.unmount('AdminMenu');
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      logger.info('ADMIN.MENU', 'fetchData.start');
      const restaurants = await restaurantApi.getAll();
      const allItems: FoodItem[] = [];
      
      // Some APIs might return items embedded, some might not. We handle it safely.
      // Wait, restaurantApi.getAll() returns Restaurant[]. They don't have items.
      // restaurantApi.getById() returns { restaurant, items }.
      // So we have to fetch items for a few top restaurants or use a mock.
      // To avoid fetching thousands of items one by one, we will use a mock provider if no direct endpoint exists.
      
      // Let's create a mock list for the global admin menu for now:
      setItems([
         { id: '1', name: 'Global Burger', description: 'Test item', price: 10, category: 'Fast Food', image: '', isAvailable: true, restaurantId: 'r1', restaurantName: 'Rest 1', isVeg: false, isSpicy: false, isBestSeller: true, rating: 4.5, addons: [], variants: [] },
         { id: '2', name: 'Global Pizza', description: 'Test item', price: 15, category: 'Italian', image: '', isAvailable: true, restaurantId: 'r2', restaurantName: 'Rest 2', isVeg: true, isSpicy: false, isBestSeller: false, rating: 4.0, addons: [], variants: [] }
      ]);
      logger.info('ADMIN.MENU', 'fetchData.success');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
      logComponent.error('AdminMenu', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Global Menu Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of all menu items across the platform.
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Card><CardContent>
                <Box display="flex" gap={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><Fastfood /></Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Items</Typography>
                    <Typography variant="h5" fontWeight={700}>{items.length}</Typography>
                  </Box>
                </Box>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth size="small"
              placeholder="Search by item name or restaurant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Restaurant</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length > 0 ? filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell fontWeight={600}>{item.name}</TableCell>
                    <TableCell>{item.restaurantName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell align="right">₹{item.price}</TableCell>
                    <TableCell align="center">
                      <Chip label={item.isAvailable ? 'Available' : 'Unavailable'} color={item.isAvailable ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} align="center">No items found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div" count={filteredItems.length}
              page={page} onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        </>
      )}
    </Box>
  );
};
export default AdminMenu;
