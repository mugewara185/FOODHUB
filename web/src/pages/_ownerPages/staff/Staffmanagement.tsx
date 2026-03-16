import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Person,
  Phone,
  Email,
  AccessTime,
  Star,
  Block,
  CheckCircle,
} from '@mui/icons-material';

interface Staff {
  id: string;
  name: string;
  role: 'manager' | 'chef' | 'waiter' | 'cashier' | 'delivery';
  email: string;
  phone: string;
  shift: 'morning' | 'evening' | 'night' | 'flexible';
  joinDate: string;
  salary: number;
  rating: number;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
}

const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    role: 'manager',
    email: 'rajesh@spicegarden.com',
    phone: '+91 98765 43210',
    shift: 'morning',
    joinDate: '2022-01-15',
    salary: 45000,
    rating: 4.8,
    status: 'active',
  },
  {
    id: '2',
    name: 'Priya Singh',
    role: 'chef',
    email: 'priya@spicegarden.com',
    phone: '+91 98765 43211',
    shift: 'evening',
    joinDate: '2022-03-20',
    salary: 38000,
    rating: 4.9,
    status: 'active',
  },
  {
    id: '3',
    name: 'Amit Patel',
    role: 'waiter',
    email: 'amit@spicegarden.com',
    phone: '+91 98765 43212',
    shift: 'flexible',
    joinDate: '2022-06-10',
    salary: 22000,
    rating: 4.5,
    status: 'on_leave',
  },
];

const StaffManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const stats = {
    total: mockStaff.length,
    active: mockStaff.filter(s => s.status === 'active').length,
    onLeave: mockStaff.filter(s => s.status === 'on_leave').length,
    totalPayroll: mockStaff.reduce((sum, s) => sum + s.salary, 0),
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setDialogOpen(true);
  };

  const getRoleColor = (role: Staff['role']) => {
    switch (role) {
      case 'manager': return 'error';
      case 'chef': return 'warning';
      case 'waiter': return 'info';
      case 'cashier': return 'success';
      case 'delivery': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: Staff['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'on_leave': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Staff Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your restaurant team
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Staff
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Staff
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                On Leave
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.onLeave}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Monthly Payroll
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                ₹{stats.totalPayroll.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search staff by name, role, email..."
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
      </Paper>

      {/* Staff Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Shift</TableCell>
                <TableCell align="right">Salary</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockStaff.map((staff) => (
                <TableRow key={staff.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={staff.avatar}>
                        {staff.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {staff.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Joined {new Date(staff.joinDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={staff.role}
                      color={getRoleColor(staff.role) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{staff.email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {staff.phone}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={staff.shift} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right" fontWeight={600}>
                    ₹{staff.salary.toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2">{staff.rating}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={staff.status}
                      color={getStatusColor(staff.status) as any}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(staff)}>
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
          count={mockStaff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff' : 'Add New Staff'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" defaultValue={editingStaff?.name} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select label="Role" defaultValue={editingStaff?.role || 'waiter'}>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="chef">Chef</MenuItem>
                  <MenuItem value="waiter">Waiter</MenuItem>
                  <MenuItem value="cashier">Cashier</MenuItem>
                  <MenuItem value="delivery">Delivery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                defaultValue={editingStaff?.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                defaultValue={editingStaff?.phone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Shift</InputLabel>
                <Select label="Shift" defaultValue={editingStaff?.shift || 'flexible'}>
                  <MenuItem value="morning">Morning (6 AM - 2 PM)</MenuItem>
                  <MenuItem value="evening">Evening (2 PM - 10 PM)</MenuItem>
                  <MenuItem value="night">Night (10 PM - 6 AM)</MenuItem>
                  <MenuItem value="flexible">Flexible</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary (Monthly)"
                type="number"
                defaultValue={editingStaff?.salary}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Permissions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch />} label="Manage Orders" />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch />} label="Manage Menu" />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch />} label="View Reports" />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch />} label="Manage Staff" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            {editingStaff ? 'Update' : 'Add'} Staff
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;