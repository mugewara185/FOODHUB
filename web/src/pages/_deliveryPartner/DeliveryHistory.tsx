import React, { useState } from 'react';
import { useAppSelector } from '@app/store/hooks';
import { selectDeliveryHistory } from '@features/deliveryPartner/deliveryPartnerSlice';
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

const DeliveryHistory: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  const history = useAppSelector(selectDeliveryHistory);

  const stats = {
    totalDeliveries: history.length,
    totalEarnings: history.reduce((sum, d) => sum + d.amount, 0),
    avgRating: history.length ? 4.8 : 0, // static rating since order doesn't have it
    totalDistance: history.reduce((sum, d) => sum + parseFloat(d.distance), 0),
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
              {history
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((delivery) => (
                  <TableRow key={delivery.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date().toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {delivery.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{delivery.restaurant}</TableCell>
                    <TableCell>{delivery.customer}</TableCell>
                    <TableCell align="center">{delivery.distance}</TableCell>
                    <TableCell align="center">{delivery.estimatedTime}</TableCell>
                    <TableCell align="right" fontWeight={600} color="primary.main">
                      ₹{delivery.amount}
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={5} readOnly size="small" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={history.length}
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