import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  Stack,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  LocationOn,
  CreditCard,
  AccountBalanceWallet,
  Payment,
  Receipt,
  CheckCircle,
  Edit,
  Delete,
} from '@mui/icons-material';
import { type Address } from '@/data/types/food';
import LocationPicker from '@/shared/components/maps/LocationPicker';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { createOrderThunk, selectOrderCreating, selectOrderError, clearOrderError } from '@/features/orders/orderSlice';
import { clearCart } from '@/features/cart/cartSlice';
import { useAuth } from '@/contexts/AuthContext';
import { logger, logComponent } from '@/core/dev/logger';

// Payment methods
const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: <Receipt />, description: 'Pay when you receive your order' },
  { id: 'card', label: 'Credit/Debit Card', icon: <CreditCard />, description: 'Pay securely with your card' },
  { id: 'upi', label: 'UPI', icon: <Payment />, description: 'Pay using UPI apps' },
  { id: 'wallet', label: 'Wallet', icon: <AccountBalanceWallet />, description: 'Pay using FoodHub Wallet' },
];

const steps = ['Delivery Address', 'Payment Method', 'Review Order'];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Cart state from Redux
  const cart = useAppSelector((state) => state.cart);

  // Order state from Redux
  const isCreating = useAppSelector(selectOrderCreating);
  const orderError = useAppSelector(selectOrderError);

  const [activeStep, setActiveStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<string>('1');
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    type: 'home',
    isDefault: false,
  });
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  // Inside component
  React.useEffect(() => {
    logger.info('CHECKOUT', 'Checkout page opened', { event: 'CHECKOUT.OPEN', source: 'Checkout' });
    logComponent.mount('Checkout');
    return () => logComponent.unmount('Checkout');
  }, []);

  // Handle next step
  const handleNext = () => {
    logger.debug('CHECKOUT', `Checkout step completed: ${steps[activeStep]}`, {
      event: 'CHECKOUT.STEP_COMPLETE',
      data: { step: steps[activeStep], stepIndex: activeStep }
    });

    if (activeStep === steps.length - 1) {
      handlePlaceOrder();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle place order — dispatches createOrderThunk, clears cart on success
  const handlePlaceOrder = async () => {
    const trace = logger.startTrace('CHECKOUT', 'Order placement started', { event: 'CHECKOUT.SUBMIT.START' });

    // Build the delivery address string from the selected mock address
    const address = MOCK_ADDRESSES.find((a) => a.id === selectedAddress);
    const deliveryAddress = address
      ? `${address.name}, ${address.street}, ${address.city}, ${address.state} - ${address.zipCode}`
      : '123 Main Street, Mumbai, Maharashtra - 400001';

    dispatch(clearOrderError());

    trace.info('Validation successful, dispatching createOrderThunk', { event: 'CHECKOUT.VALIDATION.SUCCESS' });
    const result = await dispatch(
      createOrderThunk({ deliveryAddress, paymentMethod }),
    );

    if (createOrderThunk.fulfilled.match(result)) {
      trace.end('Order placement successful', { event: 'CHECKOUT.SUBMIT.SUCCESS', data: { orderId: result.payload.id } });
      // Only clear cart AFTER successful order creation
      dispatch(clearCart());
      navigate('/orders/confirmation', { state: { orderId: result.payload.id } });
    } else {
      trace.error('Order placement failed', { event: 'CHECKOUT.SUBMIT.FAILURE', error: result.payload });
    }
    // On failure: error is in Redux state (orderError), cart is preserved
  };

  // Handle add new address
  const handleAddAddress = () => {
    // In real app, this would make an API call
    console.log('Adding new address:', newAddress);
    setAddAddressOpen(false);
    setNewAddress({
      type: 'home',
      isDefault: false,
    });
  };

  // Order summary computed from real cart Redux state
  const orderSummary = {
    itemTotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    tax: cart.tax,
    discount: cart.discount,
    total: cart.total,

  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Cart
        </Button>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Checkout
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete your order in 3 simple steps
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Steps */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Delivery Address */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" fontWeight={600}>
                    Delivery Address
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Choose your delivery address
                    </Typography>

                    <RadioGroup
                      value={selectedAddress}
                      onChange={(e) => setSelectedAddress(e.target.value)}
                    >
                      <Stack spacing={2}>
                        {MOCK_ADDRESSES.map((address) => (
                          <Paper
                            key={address.id}
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderColor: selectedAddress === address.id ? 'primary.main' : 'divider',
                              borderWidth: selectedAddress === address.id ? 2 : 1,
                              borderRadius: 2,
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: 'primary.main',
                              },
                            }}
                            onClick={() => setSelectedAddress(address.id)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Radio
                                value={address.id}
                                checked={selectedAddress === address.id}
                                sx={{ mr: 2 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {address.name}
                                  </Typography>
                                  <Stack direction="row" spacing={1}>
                                    {address.isDefault && (
                                      <Chip label="Default" size="small" color="primary" />
                                    )}
                                    <Chip
                                      label={address.type}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Stack>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {address.street}, {address.city}, {address.state} - {address.zipCode}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Phone: {address.phone}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                  <Button size="small" startIcon={<Edit />}>
                                    Edit
                                  </Button>
                                  <Button size="small" color="error" startIcon={<Delete />}>
                                    Delete
                                  </Button>
                                </Stack>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </RadioGroup>

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setAddAddressOpen(true)}
                      sx={{ mt: 3, py: 1.5 }}
                    >
                      Add New Address
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ minWidth: 120 }}
                    >
                      Continue
                    </Button>
                  </Box>
                  {/* </StepContent> */}
                  {/* <StepContent> */}
                  <LocationPicker
                    onLocationSelect={(location) => {
                      setDeliveryLocation(location);
                      // Save location to form data
                    }}
                    height="400px"
                  />
                  {/* ... rest of the address step */}
                </StepContent>
              </Step>

              {/* Step 2: Payment Method */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" fontWeight={600}>
                    Payment Method
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Choose your preferred payment method
                    </Typography>

                    <RadioGroup
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <Grid container spacing={2}>
                        {PAYMENT_METHODS.map((method) => (
                          <Grid item xs={12} md={6} key={method.id}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderColor: paymentMethod === method.id ? 'primary.main' : 'divider',
                                borderWidth: paymentMethod === method.id ? 2 : 1,
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                },
                              }}
                              onClick={() => setPaymentMethod(method.id)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Radio
                                  value={method.id}
                                  checked={paymentMethod === method.id}
                                  sx={{ mr: 2 }}
                                />
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    {method.icon}
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {method.label}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {method.description}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </RadioGroup>

                    {/* Payment Details Form (for card payment) */}
                    {paymentMethod === 'card' && (
                      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Card Details
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            label="Card Number"
                            placeholder="1234 5678 9012 3456"
                          />
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Expiry Date"
                                placeholder="MM/YY"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="CVV"
                                placeholder="123"
                              />
                            </Grid>
                          </Grid>
                          <TextField
                            fullWidth
                            label="Cardholder Name"
                            placeholder="John Doe"
                          />
                        </Stack>
                      </Paper>
                    )}

                    {/* UPI ID (for UPI payment) */}
                    {paymentMethod === 'upi' && (
                      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          UPI Details
                        </Typography>
                        <TextField
                          fullWidth
                          label="UPI ID"
                          placeholder="yourname@upi"
                        />
                      </Paper>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ minWidth: 120 }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Review Order */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" fontWeight={600}>
                    Review Order
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Review your order details before placing
                    </Typography>

                    {/* Delivery Address Review */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Delivery Details
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LocationOn color="primary" />
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {MOCK_ADDRESSES.find(a => a.id === selectedAddress)?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {MOCK_ADDRESSES.find(a => a.id === selectedAddress)?.street}
                          </Typography>
                        </Box>
                        <Button size="small" onClick={() => setActiveStep(0)} sx={{ ml: 'auto' }}>
                          Change
                        </Button>
                      </Box>
                    </Paper>

                    {/* Payment Method Review */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Payment Method
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.icon}
                        <Typography variant="body1" fontWeight={500}>
                          {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                        </Typography>
                        <Button size="small" onClick={() => setActiveStep(1)} sx={{ ml: 'auto' }}>
                          Change
                        </Button>
                      </Box>
                    </Paper>

                    {/* Order Items Review — real cart items from Redux */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Order Items
                      </Typography>
                      <List>
                        {cart.items.length > 0 ? (
                          cart.items.map((item, index) => (
                            <ListItem key={item.id ?? index} sx={{ px: 0 }}>
                              <ListItemAvatar>
                                <Avatar>{item.quantity}</Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={item.name}
                                secondary={`₹${item.price} each`}
                              />
                              <Typography variant="body1" fontWeight={600}>
                                ₹{item.price * item.quantity}
                              </Typography>
                            </ListItem>
                          ))
                        ) : (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText primary="Your cart is empty" />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                  </Box>

                  {/* Error alert — shown if createOrderThunk fails */}
                  {orderError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {orderError}
                    </Alert>
                  )}

                  <Alert severity="info" sx={{ mb: 3 }}>
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </Alert>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={handleBack} disabled={isCreating}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                      onClick={handlePlaceOrder}
                      disabled={isCreating || cart.items.length === 0}
                      sx={{ minWidth: 180 }}
                    >
                      {isCreating ? 'Placing Order…' : 'Place Order'}
                    </Button>
                  </Box>

                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ position: 'sticky', top: 20, borderRadius: 3 }}>
            {/* Summary Header */}
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 3,
                textAlign: 'center',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Order Summary
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Spice Garden • 25-30 mins
              </Typography>
            </Box>

            {/* Summary Details */}
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Item Total
                  </Typography>
                  <Typography variant="body2">₹{orderSummary.itemTotal.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Fee
                  </Typography>
                  <Typography variant="body2">₹{orderSummary.deliveryFee.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tax & Charges
                  </Typography>
                  <Typography variant="body2">₹{orderSummary.tax.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="success.main">
                    Discount Applied
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -₹{orderSummary.discount.toFixed(2)}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                    ₹{orderSummary.total.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>

              {/* Delivery Time Estimate */}
              <Paper
                variant="outlined"
                sx={{ p: 2, mt: 3, borderRadius: 2, bgcolor: 'success.light' }}
              >
                <Typography variant="body2" fontWeight={600} color="success.dark">
                  🚚 Estimated Delivery Time
                </Typography>
                <Typography variant="body1" fontWeight={700} color="success.dark">
                  25-30 minutes
                </Typography>
              </Paper>

              {/* Need Help */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Need help with your order?
                </Typography>
                <Typography variant="caption" color="primary" sx={{ display: 'block', cursor: 'pointer' }}>
                  Contact Customer Support
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Secure Payment Banner */}
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🔒 Secure Payment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your payment information is encrypted and secure. We never store your card details.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Address Dialog */}
      <Dialog
        open={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Address</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              value={newAddress.name || ''}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
            />
            <TextField
              label="Phone Number"
              value={newAddress.phone || ''}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
            />
            <TextField
              label="Street Address"
              multiline
              rows={2}
              value={newAddress.street || ''}
              onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  value={newAddress.city || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  value={newAddress.state || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Zip Code"
              value={newAddress.zipCode || ''}
              onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
            />
            <FormControl component="fieldset">
              <FormLabel component="legend">Address Type</FormLabel>
              <RadioGroup
                row
                value={newAddress.type}
                onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as any })}
              >
                <FormControlLabel value="home" control={<Radio />} label="Home" />
                <FormControlLabel value="work" control={<Radio />} label="Work" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                />
              }
              label="Set as default address"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAddressOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAddress}>
            Save Address
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Checkout;