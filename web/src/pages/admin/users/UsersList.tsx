import React, { useState, useEffect, useCallback } from 'react';
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
  AvatarGroup,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Block,
  CheckCircle,
  People,
  TrendingUp,
  Restaurant,
  ShoppingBag,
  FilterList,
  Download,
  Email,
  Phone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../../services/api/usersApi';

// Use backend names or mapped frontend names, but adapt to match the backend structure
interface User {
  _id: string; // backend uses _id
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  roles: string[];
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

const roleColors: Record<string, string> = {
  user: 'info',
  customer: 'info', // alias for user
  partner: 'warning',
  delivery_partner: 'warning',
  owner: 'success',
  restaurant_owner: 'success',
  admin: 'error',
};

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  blocked: 'error',
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Stats can be derived or fetched from an analytics endpoint if available
  // Using static for now as mock, ideally replace with backend stats
  const stats = [
    { label: 'Total Users', value: totalUsers, icon: <People />, color: 'primary' },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch,
        role: roleFilter,
      });
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleViewUser = () => {
    if (selectedUser) {
      navigate(`/admin/users/${selectedUser}`);
    }
    handleMenuClose();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Users Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all users, delivery partners, and restaurant owners
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download />}
        >
          Export Users
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
              placeholder="Search users by name, email, phone..."
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
              label="All Users"
              onClick={() => setRoleFilter('all')}
              color={roleFilter === 'all' ? 'primary' : 'default'}
            />
            <Chip
              label="Customers"
              onClick={() => setRoleFilter('customer')}
              color={roleFilter === 'customer' ? 'info' : 'default'}
            />
            <Chip
              label="Delivery Partners"
              onClick={() => setRoleFilter('delivery_partner')}
              color={roleFilter === 'delivery_partner' ? 'warning' : 'default'}
            />
            <Chip
              label="Restaurant Owners"
              onClick={() => setRoleFilter('restaurant_owner')}
              color={roleFilter === 'restaurant_owner' ? 'success' : 'default'}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ borderRadius: 2, position: 'relative' }}>
        {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Role</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.avatar}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user._id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.phone || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.roles.join(', ')}
                        color={roleColors[user.roles[0]] as any || 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.status}
                        color={statusColors[user.status] as any || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user._id)}
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
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewUser}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          const newName = prompt('Enter new name (leave empty to skip):');
          const newRole = prompt('Enter new role (user, admin, owner, partner):');
          if (!selectedUser) return;
          const updateData: any = {};
          if (newName) updateData.name = newName;
          if (newRole) updateData.roles = [newRole];
          if (Object.keys(updateData).length > 0) {
            usersApi.updateUser(selectedUser, updateData).then(() => fetchUsers());
          }
        }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedUser) {
            usersApi.updateUser(selectedUser, { status: 'blocked' }).then(() => fetchUsers());
          }
        }} sx={{ color: 'warning.main' }}>
          <ListItemIcon><Block fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Block User</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedUser) {
            if (window.confirm('Are you sure you want to delete this user?')) {
              usersApi.deleteUser(selectedUser).then(() => fetchUsers());
            }
          }
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserList;