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
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Delete,
  Add,
  Remove,
  LocalOffer,
  ShoppingBag,
  LocationOn,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectCartItems,
  selectCartRestaurant,
  selectCartTotals,
  updateQuantity,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} from '../../../features/cart/cartSlice';
import { selectSelectedRestaurant } from '../../../features/restaurant/restaurantSlice';
import { showToast } from '../../../features/ui/uiSlice';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const cartItems = useAppSelector(selectCartItems);
  const restaurant = useAppSelector(selectCartRestaurant);
  const restaurantDetails = useAppSelector(selectSelectedRestaurant);
  const totals = useAppSelector(selectCartTotals);
  
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch(removeFromCart(itemId));
      dispatch(showToast({
        message: 'Item removed from cart',
        type: 'info'
      }));
    } else {
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
    dispatch(showToast({
      message: 'Item removed from cart',
      type: 'info'
    }));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      dispatch(showToast({
        message: 'Cart cleared',
        type: 'info'
      }));
    }
  };

  const handleApplyCoupon = () => {
    dispatch(applyCoupon(couponCode));
    setCouponApplied(true);
    setCouponCode('');
    dispatch(showToast({
      message: 'Coupon applied successfully',
      type: 'success'
    }));
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponApplied(false);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    if (restaurantDetails?.minOrder && totals.total < restaurantDetails?.minOrder) {
      alert(`Minimum order amount is ₹${restaurantDetails?.minOrder??0}`);
      return;
    }
    
    navigate('/checkout');
  };

    // Handle continue shopping
  const handleContinueShopping = () => {
    if (restaurant) {
      navigate(`/restaurants/${restaurant.id}`);
    } else {
      navigate('/restaurants');
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Add delicious food items to your cart
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/restaurants')}
          >
            Browse Restaurants
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Your Cart
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cartItems.length} items from {restaurant.name}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Cart Items */}
        <Grid item xs={12} lg={8}>
          {/* Restaurant Info */}
          {restaurantDetails && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={restaurantDetails.image}
                    alt={restaurantDetails.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {restaurantDetails.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {restaurantDetails.address.split(',')[0]}
                    </Typography>
                  </Stack>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/restaurants/${restaurantDetails.id}`)}
                >
                  View Menu
                </Button>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, overflow: 'auto' }}>
                <Chip
                  label={`Delivery: ${restaurantDetails.deliveryTime}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Min order: ₹${restaurantDetails.minOrder}`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Fee: ₹${restaurantDetails.deliveryFee}`}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Paper>
          )}
    
          {/* Cart Items */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Order Items
              </Typography>
              <Button
                color="error"
                onClick={handleClearCart}
                size="small"
              >
                Clear Cart
              </Button>
            </Box>

            <Stack spacing={3}>
              {cartItems.map((item) => (
                <Box key={item.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Item Image */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* dev:i-add required chips if item is bestseller or has discount */}
                      {/* {item.foodItem.isBestSeller && (
                        <Chip
                          label="Bestseller"
                          size="small"
                          color="warning"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            fontSize: '0.6rem',
                            height: 20,
                          }}
                        />
                      )} */}
                    </Box>

                    {/* Item Details */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {item.name}
                        </Typography>
                        {/* dev:i- add chips for veg/non-veg and spicy tags */}
                          {/* <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip
                              label={item.foodItem.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                              size="small"
                              color={item.foodItem.isVeg ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            {item.foodItem.isSpicy && (
                              <Chip
                                icon={<LocalFireDepartment sx={{ fontSize: 14 }} />}
                                label="Spicy"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Stack> */}
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                          ₹{item.price * item.quantity}
                        </Typography>
                      </Box>

                      {/* Special Instructions */}
                      {item.specialInstructions && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Note: {item.specialInstructions}
                        </Typography>
                      )}

                      {/* Quantity Controls */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Coupon Section */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Apply Coupon
            </Typography>
            {couponApplied ? (
              <Alert
                severity="success"
                action={
                  <Button color="inherit" size="small" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                }
              >
                Coupon applied! You saved ₹{totals.discount}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  InputProps={{
                    startAdornment: <LocalOffer sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode}
                >
                  Apply
                </Button>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try codes: SAVE10, WELCOME20, FOODIE30
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20,  }}> 
            {/* Summary Header */}
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Order Summary
              </Typography>
              {restaurantDetails && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {restaurantDetails.name}
                </Typography>
              )}
            </Box>

             {/* Summary Details */}
            <Box sx={{ p: 3 }}></Box>
            <Stack spacing={2} marginY={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Item Total
                </Typography>
                <Typography variant="body2">₹{totals.subtotal}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Fee
                </Typography>
                <Typography variant="body2">₹{totals.deliveryFee}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Tax (GST)
                </Typography>
                <Typography variant="body2">₹{totals.tax.toFixed(2)}</Typography>
              </Box>
              {totals.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="success.main">
                    Discount
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -₹{totals.discount}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>
                  Total Amount
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  ₹{totals.total}
                </Typography>
              </Box>
            </Stack>

              {/* Minimum Order Notice */}
              {restaurantDetails?.minOrder && totals.total < restaurantDetails?.minOrder && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Add ₹{(restaurantDetails?.minOrder - totals.subtotal).toFixed(2)} more to reach minimum order
                </Alert>
              )}

              {/* Checkout Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>

              {/* Continue Shopping */}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2, borderRadius: 2 }}
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>

              {/* Additional Info */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  By placing your order, you agree to our
                </Typography>
                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                  Terms of Service & Privacy Policy
                </Typography>
                {/* </Box> */}
              </Box>
              </Paper>

          {/* Payment Methods */}
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Accepted Payments
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {['💳 Credit/Debit Card', '📱 UPI', '💰 Cash on Delivery', '🎫 Wallet'].map((method) => (
                  <Chip key={method} label={method} variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Contact our customer support for any assistance
              </Typography>
              <Button variant="outlined" fullWidth>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;

// {
//   1.To refine: 
// ->apply coupon validation and error handling, add loading states for async actions, implement edit item details (like addons/variants) from cart, enhance UI with more item details and tags, optimize performance for larger carts, and ensure mobile responsiveness.
// ->to make proceed to checkout disabled until minimum ordder is reached,
// 2.To Implement:
// ->Accepted payment, need help page, 
// =>edit item details (like addons/variants) directly from cart, add option to save cart for later, implement user reviews/ratings for items in cart, and integrate real-time inventory updates to reflect item availability.
// 
// 3.To Test:
// }