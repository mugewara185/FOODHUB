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
  Avatar,
  Stack,
  Rating,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search,
  LocalShipping,
  AttachMoney,
  Star,
  CalendarToday,
} from '@mui/icons-material';

interface DeliveryRecord {
  id: string;
  date: string;
  orderId: string;
  restaurant: string;
  customer: string;
  distance: string;
  time: string;
  earnings: number;
  rating: number;
  status: 'completed' | 'cancelled';
}

const mockDeliveries: DeliveryRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    orderId: 'ORD-2024-001',
    restaurant: 'Spice Garden',
    customer: 'John Doe',
    distance: '3.2 km',
    time: '18 min',
    earnings: 89,
    rating: 5,
    status: 'completed',
  },
  {
    id: '2',
    date: '2024-01-15',
    orderId: 'ORD-2024-002',
    restaurant: 'Pizza Paradise',
    customer: 'Jane Smith',
    distance: '4.5 km',
    time: '22 min',
    earnings: 75,
    rating: 4,
    status: 'completed',
  },
  {
    id: '3',
    date: '2024-01-14',
    orderId: 'ORD-2024-003',
    restaurant: 'Burger House',
    customer: 'Mike Johnson',
    distance: '5.1 km',
    time: '25 min',
    earnings: 65,
    rating: 5,
    status: 'completed',
  },
  {
    id: '4',
    date: '2024-01-14',
    orderId: 'ORD-2024-004',
    restaurant: 'Sushi Master',
    customer: 'Sarah Williams',
    distance: '2.8 km',
    time: '15 min',
    earnings: 95,
    rating: 5,
    status: 'completed',
  },
];

const DeliveryHistory: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    totalDeliveries: mockDeliveries.length,
    totalEarnings: mockDeliveries.reduce((sum, d) => sum + d.earnings, 0),
    avgRating: mockDeliveries.reduce((sum, d) => sum + d.rating, 0) / mockDeliveries.length,
    totalDistance: mockDeliveries.reduce((sum, d) => sum + parseFloat(d.distance), 0),
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Delivery History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your past deliveries and performance
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <LocalShipping />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Deliveries
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.totalDeliveries}
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
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    ₹{stats.totalEarnings}
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
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.avgRating.toFixed(1)}
                    </Typography>
                    <Rating value={stats.avgRating} readOnly size="small" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                  <LocalShipping />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Distance
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.totalDistance.toFixed(1)} km
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by order ID, restaurant, or customer..."
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

      {/* History Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Restaurant</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="center">Distance</TableCell>
                <TableCell align="center">Time</TableCell>
                <TableCell align="right">Earnings</TableCell>
                <TableCell align="center">Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockDeliveries
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((delivery) => (
                  <TableRow key={delivery.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(delivery.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {delivery.orderId}
                      </Typography>
                    </TableCell>
                    <TableCell>{delivery.restaurant}</TableCell>
                    <TableCell>{delivery.customer}</TableCell>
                    <TableCell align="center">{delivery.distance}</TableCell>
                    <TableCell align="center">{delivery.time}</TableCell>
                    <TableCell align="right" fontWeight={600} color="primary.main">
                      ₹{delivery.earnings}
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={delivery.rating} readOnly size="small" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={mockDeliveries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
};

export default DeliveryHistory;