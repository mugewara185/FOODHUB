import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Chip,
  Rating,
  Button,
  Divider,
  Stack,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Drawer,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  FavoriteBorder,
  Favorite,
  Share,
  Phone,
  LocationOn,
  AccessTime,
  DeliveryDining,
  Star,
  ExpandMore,
  Add,
  Remove,
  ShoppingCart,
  LocalFireDepartment,
  CheckCircle,
  Info,
  MenuBook,
  RestaurantMenu,
} from '@mui/icons-material';
import FoodItemCard from '../../../features/food/components/FoodItemCard';
import { type FoodItem, type Restaurant, type CartItem } from '../../../types/food';
import { MOCK_RESTAURANTS, MOCK_FOOD_ITEMS, FOOD_CATEGORIES } from '../../../constants/food';

// Mock reviews data
const MOCK_REVIEWS = [
  {
    id: '1',
    userName: 'John Doe',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    comment: 'Amazing food! The butter chicken was delicious.',
    createdAt: '2024-01-15',
    images: [],
  },
  {
    id: '2',
    userName: 'Jane Smith',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    rating: 4,
    comment: 'Good quality food, but delivery was a bit late.',
    createdAt: '2024-01-10',
    images: [],
  },
];

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Find restaurant by ID
  const restaurant: Restaurant | undefined = useMemo(() => {
    return MOCK_RESTAURANTS.find(r => r.id === id) || MOCK_RESTAURANTS[0];
  }, [id]);

  // Get restaurant's food items
  const restaurantFoodItems: FoodItem[] = useMemo(() => {
    return MOCK_FOOD_ITEMS.filter(item => item.restaurantId === id);
  }, [id]);

  // Filter food items by category
  const filteredFoodItems = useMemo(() => {
    if (selectedCategory === 'all') return restaurantFoodItems;
    return restaurantFoodItems.filter(item => item.category === selectedCategory);
  }, [restaurantFoodItems, selectedCategory]);

  // Get unique categories from restaurant's food items
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(restaurantFoodItems.map(item => item.category))];
    return [{ id: 'all', name: 'All', icon: '🍽️' }, ...uniqueCategories.map(cat => ({
      id: cat,
      name: cat,
      icon: FOOD_CATEGORIES.find(fc => fc.name === cat)?.icon || '🍽️'
    }))];
  }, [restaurantFoodItems]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.foodItem.price;
      const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      const variantPrice = item.selectedVariant?.price || 0;
      return total + (itemPrice + addonsPrice + variantPrice) * item.quantity;
    }, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Handle add to cart
  const handleAddToCart = (foodItem: FoodItem) => {
    const existingItemIndex = cart.findIndex(item => item.foodItem.id === foodItem.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      const newCartItem: CartItem = {
        id: `${foodItem.id}-${Date.now()}`,
        foodItem,
        quantity: 1,
        selectedAddons: [],
        selectedVariant: foodItem.variants?.[0],
      };
      setCart([...cart, newCartItem]);
    }
    
    // Open cart drawer on mobile
    if (window.innerWidth < 768) {
      setCartDrawerOpen(true);
    }
  };

  // Handle update quantity
  const handleUpdateQuantity = (foodItemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.foodItem.id !== foodItemId));
    } else {
      setCart(cart.map(item => 
        item.foodItem.id === foodItemId 
          ? { ...item, quantity } 
          : item
      ));
    }
  };

  // Handle remove from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length > 0) {
      navigate('/checkout');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (!restaurant) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4">Restaurant not found</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: { xs: 7, md: 0 } }}>
      {/* Restaurant Header Banner */}
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            height: { xs: 200, md: 300 },
            backgroundImage: `url(${restaurant.bannerImage || restaurant.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
            },
          }}
        />
        
        {/* Back Button and Actions */}
        <Container maxWidth="lg" sx={{ position: 'relative', mt: -4 }}>
          <Paper
            elevation={4}
            sx={{
              borderRadius: 3,
              p: 3,
              bgcolor: 'background.paper',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(-1)}>
                  <ArrowBack />
                </IconButton>
                <Box>
                  <Typography variant="h4" fontWeight={800} gutterBottom>
                    {restaurant.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating
                      value={restaurant.rating}
                      readOnly
                      precision={0.5}
                      sx={{ '& .MuiRating-icon': { fontSize: 20 } }}
                    />
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {restaurant.rating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {restaurant.cuisine.join(', ')}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
              
              <Stack direction="row" spacing={1}>
                <IconButton onClick={handleToggleFavorite} size="large">
                  {isFavorite ? (
                    <Favorite sx={{ color: 'error.main' }} />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
                <IconButton size="large">
                  <Share />
                </IconButton>
              </Stack>
            </Box>

            {/* Restaurant Info Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {restaurant.address}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Time
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {restaurant.deliveryTime}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeliveryDining color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Fee
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      ₹{restaurant.deliveryFee} • Min ₹{restaurant.minOrder}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Tags */}
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {restaurant.isVeg && (
                <Chip
                  label="🟢 Pure Veg"
                  color="success"
                  variant="outlined"
                />
              )}
              {restaurant.tags.map((tag) => (
                <Chip key={tag} label={tag} color="primary" variant="outlined" />
              ))}
              <Chip
                label={restaurant.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                color={restaurant.isOpen ? 'success' : 'error'}
              />
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Column - Menu */}
          <Grid item xs={12} lg={8}>
            {/* Category Tabs */}
            <Box sx={{ mb: 4, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10, pt: 2 }}>
              <Tabs
                value={selectedCategory}
                onChange={(_, newValue) => setSelectedCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    minHeight: 60,
                  },
                }}
              >
                {categories.map((category) => (
                  <Tab
                    key={category.id}
                    value={category.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            {/* Food Items */}
            <Box sx={{ mb: 4 }}>
              {filteredFoodItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <RestaurantMenu sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No items in this category
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {filteredFoodItems.map((foodItem) => {
                    const cartItem = cart.find(item => item.foodItem.id === foodItem.id);
                    return (
                      <FoodItemCard
                        key={foodItem.id}
                        foodItem={foodItem}
                        quantity={cartItem?.quantity || 0}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Reviews Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Customer Reviews
              </Typography>
              
              {/* Review Stats */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" color="primary.main" fontWeight={800}>
                        {restaurant.rating.toFixed(1)}
                      </Typography>
                      <Rating value={restaurant.rating} readOnly precision={0.5} />
                      <Typography variant="body2" color="text.secondary">
                        Based on 250+ reviews
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      {[5, 4, 3, 2, 1].map((star) => (
                        <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ minWidth: 30 }}>
                            {star} ★
                          </Typography>
                          <Box
                            sx={{
                              flex: 1,
                              height: 8,
                              bgcolor: 'grey.200',
                              borderRadius: 4,
                              mx: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${(star / 5) * 100}%`,
                                height: '100%',
                                bgcolor: 'primary.main',
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            75%
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <Stack spacing={3}>
                {MOCK_REVIEWS.map((review) => (
                  <Card key={review.id}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={review.userAvatar} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {review.userName}
                            </Typography>
                            <Rating value={review.rating} readOnly size="small" />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body1">{review.comment}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>

            {/* Restaurant Info */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Info />
                  <Typography variant="h6">Restaurant Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="Contact"
                      secondary={restaurant.contact}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime />
                    </ListItemIcon>
                    <ListItemText
                      primary="Opening Hours"
                      secondary={restaurant.openingHours.map(oh => 
                        `${oh.open} - ${oh.close}`
                      ).join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Full Address"
                      secondary={restaurant.address}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Right Column - Cart Summary (Desktop) */}
          <Grid item xs={12} lg={4} sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Paper
              elevation={4}
              sx={{
                position: 'sticky',
                top: 20,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Cart Header */}
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Your Order
                </Typography>
                <Typography variant="body2">
                  {restaurant.name}
                </Typography>
              </Box>

              {/* Cart Items */}
              <Box sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
                {cart.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Your cart is empty
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add items from the menu
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {cart.map((item) => (
                      <Box key={item.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {item.quantity} × {item.foodItem.name}
                            </Typography>
                            {item.selectedAddons.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Addons: {item.selectedAddons.map(a => a.name).join(', ')}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            ₹{(item.foodItem.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Item Total
                      </Typography>
                      <Typography variant="body2">₹{cartTotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Delivery Fee
                      </Typography>
                      <Typography variant="body2">₹{restaurant.deliveryFee}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taxes & Charges
                      </Typography>
                      <Typography variant="body2">₹{(cartTotal * 0.05).toFixed(2)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={700}>
                        Total Amount
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        ₹{(cartTotal + restaurant.deliveryFee + (cartTotal * 0.05)).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Checkout Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mt: 3, borderRadius: 2 }}
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Minimum Order Notice */}
                  {cartTotal < restaurant.minOrder && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                    >
                      Minimum order: ₹{restaurant.minOrder}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 70,
            right: 20,
            zIndex: 1000,
            display: { xs: 'block', lg: 'none' },
          }}
        >
          <Badge badgeContent={cartItemsCount} color="error">
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => setCartDrawerOpen(true)}
              sx={{
                borderRadius: 10,
                px: 3,
                py: 1.5,
                boxShadow: 6,
              }}
            >
              View Cart • ₹{cartTotal.toFixed(2)}
            </Button>
          </Badge>
        </Box>
      )}

      {/* Cart Drawer (Mobile) */}
      <Drawer
        anchor="bottom"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{
          sx: {
            height: '80vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              Your Cart ({cartItemsCount} items)
            </Typography>
            <IconButton onClick={() => setCartDrawerOpen(false)}>
              <ArrowBack />
            </IconButton>
          </Box>

          {cart.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Your cart is empty
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: '50vh', overflow: 'auto', mb: 3 }}>
                <Stack spacing={2}>
                  {cart.map((item) => (
                    <Box key={item.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {item.quantity} × {item.foodItem.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{item.foodItem.price} each
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          ₹{(item.foodItem.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Cart Summary */}
              <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Item Total
                    </Typography>
                    <Typography variant="body2">₹{cartTotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Fee
                    </Typography>
                    <Typography variant="body2">₹{restaurant.deliveryFee}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total Amount
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      ₹{(cartTotal + restaurant.deliveryFee).toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, borderRadius: 2 }}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </Paper>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default RestaurantDetail;