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
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  LocalOffer,
  Percent,
  AttachMoney,
  CalendarToday,
  People,
  CheckCircle,
  Cancel,
  ContentCopy,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  applicableTo: 'all' | 'specific' | 'new_users';
  restaurants?: string[];
  status: 'active' | 'expired' | 'scheduled';
  description: string;
}

const mockCoupons: Coupon[] = [
  {
    id: 'CPN-001',
    code: 'WELCOME20',
    type: 'percentage',
    value: 20,
    minOrder: 199,
    maxDiscount: 150,
    usageLimit: 10000,
    usedCount: 5432,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    applicableTo: 'new_users',
    status: 'active',
    description: 'Welcome discount for new users',
  },
  {
    id: 'CPN-002',
    code: 'FLAT100',
    type: 'fixed',
    value: 100,
    minOrder: 299,
    usageLimit: 5000,
    usedCount: 1234,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-03-31'),
    applicableTo: 'all',
    status: 'active',
    description: 'Flat ₹100 off on orders above ₹299',
  },
];

const Promotions: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    type: 'percentage',
    applicableTo: 'all',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });

  const stats = [
    { label: 'Active Coupons', value: '12', icon: <LocalOffer />, color: 'success' },
    { label: 'Total Used', value: '15.2K', icon: <People />, color: 'info' },
    { label: 'Total Discount', value: '₹2.4L', icon: <AttachMoney />, color: 'warning' },
    { label: 'Expiring Soon', value: '3', icon: <CalendarToday />, color: 'error' },
  ];

  const handleAddCoupon = () => {
    console.log('Adding coupon:', newCoupon);
    setAddDialogOpen(false);
    setNewCoupon({});
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Show toast
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Promotions & Coupons
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage discount coupons and offers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          Create Coupon
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

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search coupons by code, description..."
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
            <Chip label="All" color="primary" />
            <Chip label="Active" />
            <Chip label="Expired" />
            <Chip label="Scheduled" />
          </Grid>
        </Grid>
      </Paper>

      {/* Coupons Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell align="center">Value</TableCell>
                <TableCell align="center">Min Order</TableCell>
                <TableCell align="center">Usage</TableCell>
                <TableCell align="center">Validity</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockCoupons.map((coupon) => (
                <TableRow key={coupon.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {coupon.code}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyCode(coupon.code)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{coupon.description}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={coupon.type.replace('_', ' ')}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center" fontWeight={600}>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    {coupon.type === 'percentage' && coupon.maxDiscount && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Max ₹{coupon.maxDiscount}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">₹{coupon.minOrder}</TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2">
                        {coupon.usedCount}/{coupon.usageLimit}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(coupon.usedCount / coupon.usageLimit) * 100}
                        sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {coupon.startDate.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      to {coupon.endDate.toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={coupon.status}
                      color={coupon.status === 'active' ? 'success' : coupon.status === 'expired' ? 'error' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
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
          count={mockCoupons.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Add Coupon Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Create New Coupon
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Basic Info */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Coupon Code"
                  fullWidth
                  value={newCoupon.code || ''}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  helperText="Uppercase letters, numbers, and underscores only"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={newCoupon.type}
                    label="Discount Type"
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                  >
                    <MenuItem value="percentage">Percentage Off</MenuItem>
                    <MenuItem value="fixed">Fixed Amount Off</MenuItem>
                    <MenuItem value="free_delivery">Free Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Discount Value */}
            {newCoupon.type !== 'free_delivery' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={newCoupon.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                    type="number"
                    fullWidth
                    value={newCoupon.value || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) })}
                    InputProps={{
                      startAdornment: newCoupon.type === 'percentage' ? <Percent /> : <AttachMoney />,
                    }}
                  />
                </Grid>
                {newCoupon.type === 'percentage' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Maximum Discount"
                      type="number"
                      fullWidth
                      value={newCoupon.maxDiscount || ''}
                      onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: parseInt(e.target.value) })}
                      InputProps={{
                        startAdornment: <AttachMoney />,
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            )}

            {/* Order Requirements */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Minimum Order Value"
                  type="number"
                  fullWidth
                  value={newCoupon.minOrder || ''}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: parseInt(e.target.value) })}
                  InputProps={{
                    startAdornment: <AttachMoney />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Usage Limit"
                  type="number"
                  fullWidth
                  value={newCoupon.usageLimit || ''}
                  onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })}
                  helperText="Maximum number of times this coupon can be used"
                />
              </Grid>
            </Grid>

            {/* Date Range */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Start Date"
                    value={newCoupon.startDate}
                    onChange={(date) => setNewCoupon({ ...newCoupon, startDate: date || new Date() })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="End Date"
                    value={newCoupon.endDate}
                    onChange={(date) => setNewCoupon({ ...newCoupon, endDate: date || new Date() })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            {/* Applicability */}
            <FormControl fullWidth>
              <InputLabel>Applicable To</InputLabel>
              <Select
                value={newCoupon.applicableTo}
                label="Applicable To"
                onChange={(e) => setNewCoupon({ ...newCoupon, applicableTo: e.target.value as any })}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="new_users">New Users Only</MenuItem>
                <MenuItem value="specific">Specific Restaurants</MenuItem>
              </Select>
            </FormControl>

            {/* Description */}
            <TextField
              label="Description"
              multiline
              rows={2}
              fullWidth
              value={newCoupon.description || ''}
              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              placeholder="Brief description of the coupon"
            />

            {/* Status */}
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Active immediately"
            />

            <Alert severity="info">
              The coupon will be available to users once created.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddCoupon}
          >
            Create Coupon
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Promotions;