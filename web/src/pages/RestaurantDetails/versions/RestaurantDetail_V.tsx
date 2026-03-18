import React, { useEffect, useState } from 'react';
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
  Skeleton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Drawer,
} from '@mui/material';
import {
  ArrowBack,
  FavoriteBorder,
  Favorite,
  Share,
  LocationOn,
  AccessTime,
  DeliveryDining,
  Star,
  ShoppingCart,
  ExpandMore,
  Info,
  Phone,
  RestaurantMenu,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  fetchRestaurantById,
  selectSelectedRestaurant,
  selectMenuCategories,
  selectRestaurantLoading,
  selectRestaurantError,
  clearSelectedRestaurant,
} from '../../../features/restaurant/restaurantSlice';
import {
  addToCart,
  selectCartItems,
  selectCartRestaurant,
  selectCartTotals,
  selectIsCartEmpty,
} from '../../../features/cart/cartSlice';
import {
  toggleCartDrawer,
  showToast,
  selectCartDrawerOpen,
} from '../../../features/ui/uiSlice';
import FoodItemCard from '../../../features/food/components/FoodItemCard';
import FoodCustomizationModal from '../../../features/food/components/FoodCustomizationModal';
import Map from '../../../shared/components/maps/Map';

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
  const dispatch = useAppDispatch();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Restaurant selectors
  const restaurant = useAppSelector(selectSelectedRestaurant);
  const categories = useAppSelector(selectMenuCategories);
  const loading = useAppSelector(selectRestaurantLoading);
  const error = useAppSelector(selectRestaurantError);
  //cart selectors
  const cartItems = useAppSelector(selectCartItems);
  const cartRestaurant = useAppSelector(selectCartRestaurant);
  const isCartEmpty = useAppSelector(selectIsCartEmpty);
  const {subtotal, deliveryFee, tax, itemCount, total} = useAppSelector(selectCartTotals)
  //ui selectors
  const isCartDrawerOpen = useAppSelector(selectCartDrawerOpen);

  // Fetch restaurant data
  useEffect(() => {
    if (id) {
      dispatch(fetchRestaurantById(id));
    }
    return () => {
      dispatch(clearSelectedRestaurant());
    };
  }, [id, dispatch]);

  // Filter items by category
  const filteredCategories = selectedCategory === 'all'
    ? categories
    : categories.filter(cat => cat.id === selectedCategory);

  // Handle add to cart
  const handleAddToCart = (foodItem: any) => {
    // Check if adding from different restaurant
    if (!isCartEmpty && cartRestaurant.id !== restaurant?.id) {
      if (!window.confirm('Your cart contains items from a different restaurant. Do you want to clear it and add this item?')) {
        return;
      }
      // Clear cart logic would go here
    }

    if (foodItem.addons?.length || foodItem.variants?.length) {
      setSelectedFoodItem(foodItem);
      setModalOpen(true);
    } else {
      dispatch(addToCart({
        foodItemId: foodItem.id,
        name: foodItem.name,
        price: foodItem.price,
        quantity: 1,
        image: foodItem.image,
        restaurantId: restaurant!.id,
        restaurantName: restaurant!.name,
        isVeg: foodItem.isVeg,
      }));
      
      dispatch(showToast({
        message: `${foodItem.name} added to cart`,
        type: 'success'
      }));
    }
  };

  // Handle customized item
  const handleAddCustomizedItem = (customizedItem: any) => {
    dispatch(addToCart({
      foodItemId: customizedItem.foodItem.id,
      name: customizedItem.foodItem.name,
      price: customizedItem.foodItem.price + 
             customizedItem.selectedAddons.reduce((sum: number, a: any) => sum + a.price, 0),
      quantity: customizedItem.quantity,
      image: customizedItem.foodItem.image,
      restaurantId: restaurant!.id,
      restaurantName: restaurant!.name,
      isVeg: customizedItem.foodItem.isVeg,
      specialInstructions: customizedItem.specialInstructions,
    }));
    
    dispatch(showToast({
      message: `${customizedItem.quantity}x ${customizedItem.foodItem.name} added to cart`,
      type: 'success'
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={60} />
        <Skeleton variant="text" height={40} width="60%" />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 4 }} />
      </Container>
    );
  }

  if (error || !restaurant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Restaurant not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: { xs: 7, md: 0 } }}>
      {/* Header Banner */}
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
                    <Rating value={restaurant.rating} readOnly precision={0.5} />
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {restaurant.rating}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {restaurant.cuisine.join(', ')}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
              
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => setIsFavorite(!isFavorite)} size="large">
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

            {/* Restaurant Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="body2">{restaurant.address}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="primary" />
                  <Typography variant="body2">
                    Delivery: {restaurant.deliveryTime}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeliveryDining color="primary" />
                  <Typography variant="body2">
                    ₹{restaurant.deliveryFee} delivery • Min ₹{restaurant.minOrder}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Tags */}
            <Stack direction="row" spacing={1}>
               {restaurant?.isVeg && (
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
              {restaurant.tags.map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
            </Stack>
          </Paper>
        </Container>
      </Box>
    {/* /*Location & Map */}
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocationOn />
          <Typography variant="h6">Location & Directions</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Restaurant Location
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {restaurant.address}
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<LocationOn />}
              fullWidth
              onClick={() => {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`);
              }}
            >
              Get Directions
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 200, borderRadius: 2, overflow: 'hidden' }}>
              <Map
                center={restaurant.geoLocation || { lat: 0, lng: 0 }}
                markers={[{
                  id: restaurant.id,
                  position: restaurant.geoLocation || { lat: 0, lng: 0 },
                  type: 'restaurant',
                  title: restaurant.name,
                }]}
                height="100%"
                zoom={15}
              />
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>

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
              >
                <Tab label="All" value="all" />
                {/* dc  */}
                {categories.map((category) => (
                   <Tab
                    key={category.id}
                    value={category.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* dev:i: add icon logic here if needed */}
                        <span>{category?.icon}</span>
                        <span>{category.name}</span>
                      </Box>
                    }
                  />
                  // <Tab key={category.id} label={category.name} value={category.id} />
                ))}
              </Tabs>
            </Box>

            {/* Food Items */}
            {filteredCategories.map((category) => (
              <Box key={category.id} sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {category.name}
                </Typography>

                {category.items.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <RestaurantMenu sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No items in this category
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {category.items.map((item) => {
                      const cartItem = cartItems.find(ci => ci.foodItemId === item.id);

                      return (
                        <FoodItemCard
                          key={item.id}
                          foodItem={item}
                          quantity={cartItem?.quantity || 0}
                          onAddToCart={() => handleAddToCart(item)}
                        />
                      );
                    })}
                  </Stack>
                )}
              </Box>
            ))}

            {/* /*Reviews Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Customer Reviews
              </Typography>
              
              {/* /*Review Stats */}
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

              {/* /*Reviews List */}
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

            {/* /*Restaurant Info */}
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
                      secondary={restaurant?.contact?.phone || restaurant?.contact?.email || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime />
                    </ListItemIcon>
                    <ListItemText
                      primary="Opening Hours"
                      secondary={restaurant?.openingHours?.map(oh => 
                        oh.open && oh.close ? `${oh.open} - ${oh.close}` : null)
                      .filter((v): v is string => !!v).join(', ') //type predicate to filter out nulls
                      || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Full Address"
                      secondary={restaurant?.address || 'N/A'}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Right Column - Cart Summary */}
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
              {/* Header */}
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
                <Typography variant="body2">{restaurant.name}</Typography>
              </Box>

              {/* Cart Items */}
              <Box sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
                {cartItems.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">Your cart is empty</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {cartItems.map((item) => (
                      <Box key={item.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography fontWeight={600}>
                              {item.quantity} × {item.name}
                            </Typography>

                            {item.specialInstructions && (
                              <Typography variant="caption" color="text.secondary">
                                Note: {item.specialInstructions}
                              </Typography>
                            )}
                          </Box>

                          <Typography fontWeight={600}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Summary */}
              {cartItems.length > 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Item Total</Typography>
                      <Typography>₹{subtotal.toFixed(2)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Delivery Fee</Typography>
                      <Typography>₹{deliveryFee}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Taxes & Charges</Typography>
                      <Typography>₹{tax.toFixed(2)}</Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={700}>
                        Total Amount
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        ₹{total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mt: 3, borderRadius: 2 }}
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Min Order */}
                  {subtotal < restaurant.minOrder && (
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

          {/* Food Customization Modal */}
          {selectedFoodItem && (
            <FoodCustomizationModal
              open={modalOpen}
              foodItem={selectedFoodItem}
              onClose={() => setModalOpen(false)}
              onAddToCart={handleAddCustomizedItem}
            />
          )}

          {/* Floating Cart Button (mobile)*/}
          {cartItems.length >= 0 && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 70,
                right: 20,
                zIndex: 1000,
                display: { xs: 'block', lg: 'none' },
              }}
            >
              <Badge badgeContent={itemCount} color="error">
                <Button
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={() => dispatch(toggleCartDrawer())}
                  sx={{
                    borderRadius: 10,
                    px: 3,
                    py: 1.5,
                    boxShadow: 6,
                  }}
                >
                  View Cart • ₹{total.toFixed(2)}
                </Button>
              </Badge>
            </Box>
          )}

          {/* Cart Drawer (mobile)*/}
          <Drawer
            anchor="bottom"
            open={isCartDrawerOpen}  //set true to open
            onClose={() => dispatch(toggleCartDrawer())} //i.e: close on esc/outside click or swipe down
            PaperProps={{
              sx: {
                height: '80vh',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              },
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  Your Cart ({itemCount} items)
                </Typography>

                <IconButton onClick={() => dispatch(toggleCartDrawer())}>
                  <ArrowBack />
                </IconButton>
              </Box>

              {cartItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography>Your cart is empty</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ maxHeight: '50vh', overflow: 'auto', mb: 3 }}>
                    <Stack spacing={2}>
                      {cartItems.map((item) => (
                        <Box key={item.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography>
                              {item.quantity} × {item.name}
                            </Typography>

                            <Typography>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>

                          <Divider sx={{ my: 1 }} />
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Item Total</Typography>
                      <Typography>₹{subtotal.toFixed(2)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Delivery Fee</Typography>
                      <Typography>₹{deliveryFee}</Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontWeight={700}>Total</Typography>
                      <Typography fontWeight={700} color="primary">
                        ₹{total.toFixed(2)}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/checkout')}
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