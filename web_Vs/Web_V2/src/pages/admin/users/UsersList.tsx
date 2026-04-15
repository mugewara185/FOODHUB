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

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'customer' | 'delivery_partner' | 'restaurant_owner' | 'admin';
  status: 'active' | 'inactive' | 'blocked';
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
  lastActive: string;
  isVerified: boolean;
}

const mockUsers: User[] = [
  {
    id: 'USR-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'customer',
    status: 'active',
    totalOrders: 45,
    totalSpent: 18500,
    joinedDate: '2023-01-15',
    lastActive: '2024-01-15T10:30:00',
    isVerified: true,
  },
  {
    id: 'USR-002',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98765 43211',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'delivery_partner',
    status: 'active',
    totalOrders: 234,
    totalSpent: 0,
    joinedDate: '2023-02-20',
    lastActive: '2024-01-15T09:15:00',
    isVerified: true,
  },
  {
    id: 'USR-003',
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '+91 98765 43212',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'restaurant_owner',
    status: 'active',
    totalOrders: 0,
    totalSpent: 0,
    joinedDate: '2023-03-10',
    lastActive: '2024-01-14T16:45:00',
    isVerified: true,
  },
];

const roleColors = {
  customer: 'info',
  delivery_partner: 'warning',
  restaurant_owner: 'success',
  admin: 'error',
};

const statusColors = {
  active: 'success',
  inactive: 'default',
  blocked: 'error',
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const stats = [
    { label: 'Total Users', value: '25.4K', icon: <People />, color: 'primary' },
    { label: 'Customers', value: '22.1K', icon: <ShoppingBag />, color: 'info' },
    { label: 'Delivery Partners', value: '1.8K', icon: <TrendingUp />, color: 'warning' },
    { label: 'Restaurant Owners', value: '1.5K', icon: <Restaurant />, color: 'success' },
  ];

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
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Role</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Total Spent</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
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
                            {user.id}
                          </Typography>
                          {user.isVerified && (
                            <Chip
                              label="Verified"
                              size="small"
                              color="success"
                              sx={{ fontSize: '0.6rem', height: 18, ml: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.phone}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.role.replace('_', ' ')}
                        color={roleColors[user.role] as any}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.status}
                        color={statusColors[user.status] as any}
                      />
                    </TableCell>
                    <TableCell align="right">{user.totalOrders}</TableCell>
                    <TableCell align="right" fontWeight={600}>
                      ₹{user.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user.id)}
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
          count={mockUsers.length}
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
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Email fontSize="small" /></ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
          <ListItemText>Call</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'warning.main' }}>
          <ListItemIcon><Block fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Block User</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserList;