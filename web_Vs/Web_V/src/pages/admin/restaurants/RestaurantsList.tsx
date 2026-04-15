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
  Avatar,
  Rating,
  Switch,
  Stack,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  Restaurant,
  Star,
  TrendingUp,
  LocalOffer,
  Warning,
  CheckCircle,
  Block,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Restaurant {
  id: string;
  name: string;
  logo: string;
  cuisine: string[];
  rating: number;
  totalOrders: number;
  revenue: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinedDate: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  commission: number;
  isVerified: boolean;
  isFeatured: boolean;
}

const mockRestaurants: Restaurant[] = [
  {
    id: 'REST-001',
    name: 'Spice Garden',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
    cuisine: ['Indian', 'North Indian'],
    rating: 4.8,
    totalOrders: 1245,
    revenue: 850000,
    status: 'active',
    joinedDate: '2023-01-15',
    owner: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'spicegarden@example.com',
    address: '123 Food Street, Mumbai',
    commission: 15,
    isVerified: true,
    isFeatured: true,
  },
  {
    id: 'REST-002',
    name: 'Pizza Paradise',
    logo: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=100&h=100&fit=crop',
    cuisine: ['Italian', 'Fast Food'],
    rating: 4.6,
    totalOrders: 2134,
    revenue: 1120000,
    status: 'active',
    joinedDate: '2023-02-20',
    owner: 'Priya Singh',
    phone: '+91 98765 43211',
    email: 'pizzaparadise@example.com',
    address: '456 Park Avenue, Mumbai',
    commission: 18,
    isVerified: true,
    isFeatured: false,
  },
  // Add more restaurants...
];

const statusColors = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  suspended: 'error',
};

const RestaurantList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  const stats = [
    { label: 'Total Restaurants', value: '156', icon: <Restaurant />, color: 'primary' },
    { label: 'Active', value: '142', icon: <CheckCircle />, color: 'success' },
    { label: 'Pending Approval', value: '8', icon: <Warning />, color: 'warning' },
    { label: 'Total Revenue', value: '₹2.4Cr', icon: <TrendingUp />, color: 'info' },
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, restaurantId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRestaurant(restaurantId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRestaurant(null);
  };

  const handleViewRestaurant = () => {
    if (selectedRestaurant) {
      navigate(`/admin/restaurants/${selectedRestaurant}`);
    }
    handleMenuClose();
  };

  const handleEditRestaurant = () => {
    if (selectedRestaurant) {
      navigate(`/admin/restaurants/edit/${selectedRestaurant}`);
    }
    handleMenuClose();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Restaurants Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all partner restaurants on your platform
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/restaurants/add')}
        >
          Add Restaurant
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}.light`, color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search restaurants by name, owner, cuisine..."
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
            >
              Filter
            </Button>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Chip
              label="All"
              onClick={() => setFilterStatus('all')}
              color={filterStatus === 'all' ? 'primary' : 'default'}
            />
            <Chip
              label="Active"
              onClick={() => setFilterStatus('active')}
              color={filterStatus === 'active' ? 'success' : 'default'}
            />
            <Chip
              label="Pending"
              onClick={() => setFilterStatus('pending')}
              color={filterStatus === 'pending' ? 'warning' : 'default'}
            />
            <Chip
              label="Suspended"
              onClick={() => setFilterStatus('suspended')}
              color={filterStatus === 'suspended' ? 'error' : 'default'}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Restaurants Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Restaurant</TableCell>
                <TableCell>Cuisine</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Commission</TableCell>
                <TableCell align="center">Featured</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockRestaurants
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((restaurant) => (
                  <TableRow key={restaurant.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={restaurant.logo}
                          sx={{ width: 40, height: 40 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {restaurant.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {restaurant.owner}
                          </Typography>
                          {restaurant.isVerified && (
                            <Chip
                              label="Verified"
                              size="small"
                              color="success"
                              sx={{ fontSize: '0.6rem', height: 18, mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {restaurant.cuisine.slice(0, 2).map((c, i) => (
                          <Chip key={i} label={c} size="small" variant="outlined" />
                        ))}
                        {restaurant.cuisine.length > 2 && (
                          <Chip label={`+${restaurant.cuisine.length - 2}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Rating value={restaurant.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="caption">({restaurant.rating})</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{restaurant.totalOrders.toLocaleString()}</TableCell>
                    <TableCell align="right" fontWeight={600}>
                      ₹{restaurant.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={restaurant.status}
                        color={statusColors[restaurant.status] as any}
                      />
                    </TableCell>
                    <TableCell align="center">{restaurant.commission}%</TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={restaurant.isFeatured}
                        onChange={() => {}}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, restaurant.id)}
                      >
                        <MoreVert />
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
          count={mockRestaurants.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Restaurant Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewRestaurant}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditRestaurant}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><LocalOffer fontSize="small" /></ListItemIcon>
          <ListItemText>Manage Offers</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'warning.main' }}>
          <ListItemIcon><Block fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Suspend</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RestaurantList;