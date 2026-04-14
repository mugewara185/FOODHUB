import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Avatar,
  Switch,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  LocalOffer,
  Restaurant,
  Category,
  TrendingUp,
  Warning,
  PhotoCamera,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  discountedPrice?: number;
  image: string;
  isVeg: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  isAvailable: boolean;
  prepTime: number;
  orders: number;
  rating: number;
}

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    category: 'Main Course',
    price: 320,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=100&h=100&fit=crop',
    isVeg: false,
    isSpicy: true,
    isBestSeller: true,
    isAvailable: true,
    prepTime: 20,
    orders: 145,
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Garlic Naan',
    category: 'Breads',
    price: 80,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=100&h=100&fit=crop',
    isVeg: true,
    isSpicy: false,
    isBestSeller: true,
    isAvailable: true,
    prepTime: 10,
    orders: 210,
    rating: 4.7,
  },
  {
    id: '3',
    name: 'Veg Biryani',
    category: 'Rice',
    price: 250,
    discountedPrice: 220,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=100&h=100&fit=crop',
    isVeg: true,
    isSpicy: true,
    isBestSeller: false,
    isAvailable: true,
    prepTime: 25,
    orders: 98,
    rating: 4.5,
  },
];

const MenuItems: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const stats = {
    totalItems: mockMenuItems.length,
    availableItems: mockMenuItems.filter(i => i.isAvailable).length,
    bestSellers: mockMenuItems.filter(i => i.isBestSeller).length,
    outOfStock: mockMenuItems.filter(i => !i.isAvailable).length,
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setEditDialog(true);
  };

  const handleToggleAvailability = (itemId: string) => {
    // Toggle availability
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Menu Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your restaurant's food items
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/owner/menu/add')}
        >
          Add New Item
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <Restaurant />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.totalItems}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.availableItems}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Best Sellers
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.bestSellers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.outOfStock}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Chip label="All Items" color="primary" />
            <Chip label="Available" />
            <Chip label="Out of Stock" />
            <Chip label="Best Sellers" />
          </Grid>
        </Grid>
      </Paper>

      {/* Menu Items Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Prep Time</TableCell>
                <TableCell align="center">Orders</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockMenuItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={item.image} sx={{ width: 40, height: 40 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {item.isBestSeller && (
                            <Chip label="Bestseller" size="small" color="warning" />
                          )}
                          {item.isVeg ? (
                            <Chip label="Veg" size="small" color="success" />
                          ) : (
                            <Chip label="Non-Veg" size="small" color="error" />
                          )}
                          {item.isSpicy && (
                            <Chip label="Spicy" size="small" color="warning" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      ₹{item.price}
                    </Typography>
                    {item.discountedPrice && (
                      <Typography variant="caption" color="error.main">
                        ₹{item.discountedPrice}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">{item.prepTime} min</TableCell>
                  <TableCell align="center">{item.orders}</TableCell>
                  <TableCell align="center">
                    <Rating value={item.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={item.isAvailable}
                      onChange={() => handleToggleAvailability(item.id)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(item)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={mockMenuItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Edit Item Dialog */}
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
                  <MenuItem value="Main Course">Main Course</MenuItem>
                  <MenuItem value="Starters">Starters</MenuItem>
                  <MenuItem value="Breads">Breads</MenuItem>
                  <MenuItem value="Rice">Rice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                defaultValue={selectedItem?.price}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Discounted Price"
                type="number"
                defaultValue={selectedItem?.discountedPrice}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prep Time (min)"
                type="number"
                defaultValue={selectedItem?.prepTime}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                defaultValue="Delicious food item description"
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" startIcon={<PhotoCamera />}>
                Change Image
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setEditDialog(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuItems;