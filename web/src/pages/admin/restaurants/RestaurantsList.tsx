import React, { useState, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  Restaurant as RestaurantIcon,
  TrendingUp,
  LocalOffer,
  Warning,
  CheckCircle,
  Block,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { restaurantApi } from '../../../services/api/restaurantApi';
import type { Restaurant } from '../../../core/types';
import { logComponent } from '../../../core/dev/logger';

const RestaurantsList: React.FC = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  useEffect(() => {
    logComponent.mount('RestaurantsList');
    fetchRestaurants();
    return () => {
      logComponent.unmount('RestaurantsList');
    };
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      logComponent.render('RestaurantsList - Data Load Start');
      const data = await restaurantApi.getAll();
      setRestaurants(data);
      logComponent.render('RestaurantsList - Data Load Success');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch restaurants');
      logComponent.error('RestaurantsList', 'Data Load Fail', err);
    } finally {
      setLoading(false);
    }
  };

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
      logComponent.interaction('RestaurantsList', 'View Details', { id: selectedRestaurant });
      navigate(`/admin/restaurants/${selectedRestaurant}`);
    }
    handleMenuClose();
  };

  const handleEditRestaurant = () => {
    if (selectedRestaurant) {
      logComponent.interaction('RestaurantsList', 'Edit Restaurant', { id: selectedRestaurant });
      navigate(`/admin/restaurants/edit/${selectedRestaurant}`);
    }
    handleMenuClose();
  };

  // derived state
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || (r.isOpen ? 'active' : 'inactive') === filterStatus;
    return matchesSearch && matchStatus;
  });

  const activeCount = restaurants.filter(r => r.isOpen).length;
  const totalRevenue = 0; 

  const stats = [
    { label: 'Total Restaurants', value: restaurants.length, icon: <RestaurantIcon />, color: 'primary' },
    { label: 'Active', value: activeCount, icon: <CheckCircle />, color: 'success' },
    { label: 'Pending Approval', value: 0, icon: <Warning />, color: 'warning' }, 
    { label: 'Total Revenue', value: '₹0', icon: <TrendingUp />, color: 'info' },
  ];

  return (
    <Box>
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

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search restaurants by name..."
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
              label="Inactive"
              onClick={() => setFilterStatus('inactive')}
              color={filterStatus === 'inactive' ? 'default' : 'default'}
            />
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredRestaurants.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No restaurants found.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Restaurant</TableCell>
                  <TableCell>Cuisine</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Featured</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRestaurants
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((restaurant) => (
                    <TableRow key={restaurant.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={restaurant.image}
                            sx={{ width: 40, height: 40 }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {restaurant.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {restaurant.contact?.phone || 'N/A'}
                            </Typography>
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
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={restaurant.isOpen ? 'active' : 'inactive'}
                          color={restaurant.isOpen ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={restaurant.isFeatured}
                          onChange={() => {
                            logComponent.interaction('RestaurantsList', 'Toggle Featured', { id: restaurant.id });
                          }}
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
            count={filteredRestaurants.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}

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

export default RestaurantsList;
