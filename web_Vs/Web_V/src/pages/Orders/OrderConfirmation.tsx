import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  ShoppingBag,
  LocalShipping,
  Timer,
  Home,
  Phone,
  Receipt,
  Share,
  Print,
} from '@mui/icons-material';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const orderId = `ORDER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return (
    <>
    orderConfiramtion
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        {/* Success Icon */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 4,
          }}
        >
          <CheckCircle sx={{ fontSize: 60, color: 'white' }} />
        </Box>

        {/* Confirmation Message */}
        <Typography variant="h3" fontWeight={800} gutterBottom color="success.main">
          Order Confirmed!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Thank you for your order
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your order has been placed successfully and is being processed
        </Typography>

        {/* Order ID */}
        <Chip
          label={`Order ID: ${orderId}`}
          color="primary"
          sx={{ mb: 4, py: 1, px: 2, fontSize: '1rem' }}
        />

        {/* Order Details Card */}
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <LocalShipping />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Delivery
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      25-30 minutes
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <Home />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Address
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      123 Main Street, Mumbai
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'warning.light' }}>
                    <Timer />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Order Time
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.light' }}>
                    <Phone />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Contact Number
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      +91 9876543210
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Order Summary
          </Typography>
          <List>
            {[
              { name: 'Butter Chicken', quantity: 2, price: 640 },
              { name: 'Garlic Naan', quantity: 3, price: 240 },
              { name: 'Delivery Fee', price: 29 },
              { name: 'Tax & Charges', price: 52 },
              { name: 'Discount', price: -104 },
            ].map((item, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    'quantity' in item 
                      ? `${item.quantity} × ${item.name}`
                      : item.name
                  }
                />
                <Typography variant="body1" fontWeight={600}>
                  ₹{item.price}
                </Typography>
              </ListItem>
            ))}
            <Divider sx={{ my: 2 }} />
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary={<Typography variant="h6" fontWeight={700}>Total Amount</Typography>} />
              <Typography variant="h5" color="primary.main" fontWeight={800}>
                ₹1,017
              </Typography>
            </ListItem>
          </List>
        </Paper>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<ShoppingBag />}
            onClick={() => navigate('/orders')}
            sx={{ minWidth: 200 }}
          >
            View My Orders
          </Button>
          <Button
            variant="outlined"
            startIcon={<Receipt />}
            onClick={() => window.print()}
          >
            Print Receipt
          </Button>
          <Button
            variant="outlined"
            startIcon={<Share />}
          >
            Share Order
          </Button>
        </Stack>

        {/* Additional Info */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            What's next?
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            You'll receive order updates via SMS and email
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Need help? Contact our support team at support@foodhub.com
          </Typography>
        </Box>
      </Paper>
    </Container>
    </>
  );
};

export default OrderConfirmation;