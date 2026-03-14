import React, { useState, useMemo } from 'react';
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
  IconButton,
  Chip,
  TextField,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Delete,
  Add,
  Remove,
  LocalOffer,
  ShoppingBag,
  LocationOn,
  Restaurant,
  LocalFireDepartment,
} from '@mui/icons-material';
import { type CartItem, type Restaurant as RestaurantType } from '../../../types/food';
import { MOCK_RESTAURANTS } from '../../../constants/food';

// Mock cart data
const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: '1',
    foodItem: {
      id: '1',
      name: 'Butter Chicken',
      description: 'Tender chicken in rich tomato butter gravy',
      price: 320,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
      category: 'Main Course',
      restaurantId: '1',
      restaurantName: 'Spice Garden',
      isVeg: false,
      isSpicy: true,
      isBestSeller: true,
      isAvailable: true,
      rating: 4.7,
      ingredients: ['Chicken', 'Tomato', 'Butter', 'Cream', 'Spices'],
      dietaryInfo: {
        calories: 450,
        protein: 25,
        carbs: 12,
        fat: 32,
      },
      addons: [
        { id: '1', name: 'Extra Butter', price: 30, isAvailable: true },
        { id: '2', name: 'Extra Cream', price: 25, isAvailable: true },
      ],
    },
    quantity: 2,
    selectedAddons: [
      { id: '1', name: 'Extra Butter', price: 30, isAvailable: true },
    ],
    selectedVariant: { id: '2', name: 'Full', price: 320 },
    specialInstructions: 'Less spicy please',
  },
  {
    id: '2',
    foodItem: {
      id: '2',
      name: 'Garlic Naan',
      description: 'Soft bread with garlic butter',
      price: 80,
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=400&h=300&fit=crop',
      category: 'Breads',
      restaurantId: '1',
      restaurantName: 'Spice Garden',
      isVeg: true,
      isSpicy: false,
      isBestSeller: true,
      isAvailable: true,
      rating: 4.5,
      ingredients: ['Flour', 'Garlic', 'Butter', 'Yogurt'],
      dietaryInfo: {
        calories: 280,
        protein: 8,
        carbs: 45,
        fat: 12,
      },
    },
    quantity: 3,
    selectedAddons: [],
  },
];

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART_ITEMS);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Get restaurant from first item
  const restaurant: RestaurantType | undefined = useMemo(() => {
    if (cartItems.length === 0) return undefined;
    return MOCK_RESTAURANTS.find(r => r.id === cartItems[0].foodItem.restaurantId);
  }, [cartItems]);

  // Calculate cart totals
  const cartSummary = useMemo(() => {
    const itemTotal = cartItems.reduce((total, item) => {
      const itemPrice = item.foodItem.price;
      const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      const variantPrice = item.selectedVariant?.price || 0;
      return total + (itemPrice + addonsPrice + variantPrice) * item.quantity;
    }, 0);

    const deliveryFee = restaurant?.deliveryFee || 0;
    const tax = itemTotal * 0.05; // 5% tax
    const discount = couponApplied ? itemTotal * 0.1 : 0; // 10% discount if coupon applied
    const total = itemTotal + deliveryFee + tax - discount;

    return {
      itemTotal,
      deliveryFee,
      tax,
      discount,
      total,
      minOrder: restaurant?.minOrder || 0,
    };
  }, [cartItems, restaurant, couponApplied]);

  // Handle quantity update
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Handle remove item
  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle apply coupon
  const handleApplyCoupon = () => {
    if (couponCode.trim() && !couponApplied) {
      setCouponApplied(true);
      setCouponCode('');
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    setCouponApplied(false);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    if (cartSummary.itemTotal < cartSummary.minOrder) {
      alert(`Minimum order amount is ₹${cartSummary.minOrder}`);
      return;
    }
    
    navigate('/checkout');
  };

  // Handle empty cart
  const handleEmptyCart = () => {
    setCartItems([]);
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
            sx={{ borderRadius: 2, px: 4 }}
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
          Review your order before checkout
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Cart Items */}
        <Grid item xs={12} lg={8}>
          {/* Restaurant Info */}
          {restaurant && (
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
                    src={restaurant.image}
                    alt={restaurant.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {restaurant.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {restaurant.address.split(',')[0]}
                    </Typography>
                  </Stack>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                >
                  View Menu
                </Button>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Chip
                  label={`Delivery: ${restaurant.deliveryTime}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Min order: ₹${restaurant.minOrder}`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Fee: ₹${restaurant.deliveryFee}`}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Paper>
          )}

          {/* Cart Items */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Order Items ({cartItems.length})
              </Typography>
              <Button
                color="error"
                startIcon={<Delete />}
                onClick={handleEmptyCart}
                size="small"
              >
                Clear All
              </Button>
            </Box>

            <Stack spacing={3}>
              {cartItems.map((item) => (
                <Box key={item.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Food Image */}
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 2,
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      <img
                        src={item.foodItem.image}
                        alt={item.foodItem.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {item.foodItem.isBestSeller && (
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
                      )}
                    </Box>

                    {/* Food Details */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {item.foodItem.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
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
                          </Stack>
                        </Box>
                        <Typography variant="h6" color="primary.main" fontWeight={700}>
                          ₹{((item.foodItem.price + 
                            item.selectedAddons.reduce((sum, a) => sum + a.price, 0) + 
                            (item.selectedVariant?.price || 0)) * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>

                      {/* Selected Options */}
                      {(item.selectedAddons.length > 0 || item.selectedVariant) && (
                        <Box sx={{ mb: 1 }}>
                          {item.selectedVariant && (
                            <Typography variant="body2" color="text.secondary">
                              Size: {item.selectedVariant.name}
                            </Typography>
                          )}
                          {item.selectedAddons.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Addons: {item.selectedAddons.map(a => a.name).join(', ')}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Special Instructions */}
                      {item.specialInstructions && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="primary" fontWeight={600}>
                            Note:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {item.specialInstructions}
                          </Typography>
                        </Box>
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
                  <Divider sx={{ mt: 3 }} />
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
                10% discount applied!
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  InputProps={{
                    startAdornment: <LocalOffer sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  sx={{ minWidth: 120 }}
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
          <Paper
            sx={{
              position: 'sticky',
              top: 20,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
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
              {restaurant && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {restaurant.name}
                </Typography>
              )}
            </Box>

            {/* Summary Details */}
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Item Total
                  </Typography>
                  <Typography variant="body2">₹{cartSummary.itemTotal.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Fee
                  </Typography>
                  <Typography variant="body2">₹{cartSummary.deliveryFee.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tax & Charges
                  </Typography>
                  <Typography variant="body2">₹{cartSummary.tax.toFixed(2)}</Typography>
                </Box>

                {couponApplied && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="success.main">
                      Discount Applied
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      -₹{cartSummary.discount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                    ₹{cartSummary.total.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>

              {/* Minimum Order Notice */}
              {cartSummary.itemTotal < cartSummary.minOrder && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Add ₹{(cartSummary.minOrder - cartSummary.itemTotal).toFixed(2)} more to reach minimum order
                </Alert>
              )}

              {/* Checkout Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, borderRadius: 2, py: 1.5 }}
                onClick={handleCheckout}
                disabled={cartSummary.itemTotal < cartSummary.minOrder}
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
              </Box>
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