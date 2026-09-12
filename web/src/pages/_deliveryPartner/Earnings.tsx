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
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  CalendarToday,
  AccountBalanceWallet,
  ArrowForwardIos,
  Download,
  Payment,
  Receipt,
} from '@mui/icons-material';
import { useAppSelector } from '@app/store/hooks';
import { selectPartnerStats, selectDeliveryHistory } from '@features/deliveryPartner/deliveryPartnerSlice';

interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  pending: number;
  paid: number;
}

interface EarningsBreakdown {
  date: string;
  orders: number;
  baseFare: number;
  incentives: number;
  total: number;
}

const Earnings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const stats = useAppSelector(selectPartnerStats);
  const history = useAppSelector(selectDeliveryHistory);

  const earnings: EarningsData = {
    today: stats.todayEarnings,
    week: stats.weeklyEarnings,
    month: stats.totalEarnings,
    total: stats.totalEarnings,
    pending: stats.weeklyEarnings, // simulate some pending
    paid: stats.totalEarnings - stats.weeklyEarnings,
  };

  // Group history by date (simulated as today for all in mock)
  // For simplicity, we just create one entry for today if history exists
  const breakdown: EarningsBreakdown[] = history.length > 0 ? [
    { 
      date: new Date().toLocaleDateString(), 
      orders: history.length, 
      baseFare: history.reduce((sum, h) => sum + h.amount, 0), 
      incentives: 0, 
      total: history.reduce((sum, h) => sum + h.amount, 0) 
    }
  ] : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Earnings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your income and payment history
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today's Earnings
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{earnings.today}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{earnings.week}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{earnings.month}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                  <AccountBalanceWallet />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Lifetime
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{earnings.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Payments Alert */}
      {earnings.pending > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: 'warning.light', color: 'warning.dark' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Payment />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Pending Payout: ₹{earnings.pending}
              </Typography>
              <Typography variant="body2">
                Will be transferred to your bank account within 24 hours
              </Typography>
            </Box>
            <Button variant="contained" color="warning" startIcon={<Download />}>
              Withdraw Now
            </Button>
          </Box>
        </Paper>
      )}

      {/* Wallet Balance */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available Balance
            </Typography>
            <Typography variant="h2" color="primary.main" fontWeight={800}>
              ₹{earnings.paid}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <Button variant="contained" size="large" startIcon={<AccountBalanceWallet />}>
              Transfer to Bank
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Earnings Breakdown */}
      <Paper sx={{ borderRadius: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 3, pt: 3 }}>
          <Tab label="Daily" />
          <Tab label="Weekly" />
          <Tab label="Monthly" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Chart placeholder - would integrate with real charts */}
          <Paper variant="outlined" sx={{ p: 4, mb: 3, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Earnings chart will be displayed here
            </Typography>
          </Paper>

          {/* Earnings Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Orders</TableCell>
                  <TableCell align="right">Base Fare</TableCell>
                  <TableCell align="right">Incentives</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {breakdown.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(row.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell align="center">{row.orders}</TableCell>
                    <TableCell align="right">₹{row.baseFare}</TableCell>
                    <TableCell align="right" color="success.main">
                      +₹{row.incentives}
                    </TableCell>
                    <TableCell align="right" fontWeight={600}>
                      ₹{row.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Payment History */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Payouts
        </Typography>
        <List>
          {[1, 2, 3].map((i) => (
            <ListItem key={i} sx={{ px: 0 }}>
              <ListItemText
                primary={`Payout of ₹${2500 + i * 500}`}
                secondary={`Transferred to HDFC Bank •••• 1234 on Jan ${10 + i}, 2024`}
              />
              <Chip label="Completed" color="success" size="small" />
            </ListItem>
          ))}
        </List>
        <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
          View All Transactions
        </Button>
      </Paper>
    </Box>
  );
};

export default Earnings;