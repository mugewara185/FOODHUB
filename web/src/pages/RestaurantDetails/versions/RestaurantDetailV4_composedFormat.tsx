import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Tabs, Tab, Stack,
  Paper, IconButton, Badge, Drawer, Divider, Button, Skeleton, Alert
} from '@mui/material';
import {
  ArrowBack, ShoppingCart
} from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  fetchRestaurantById,
  selectSelectedRestaurant,
  selectMenuCategories,
  selectRestaurantLoading,
  selectRestaurantError,
} from '../../../features/restaurant/restaurantSlice';

import {
  addToCart,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectCartTotals,
  selectCartRestaurant,
  selectIsCartEmpty,
} from '../../../features/cart/cartSlice';

import {
  toggleCartDrawer,
  selectCartDrawerOpen,
  showToast,
} from '../../../features/ui/uiSlice';

import FoodItemCard from '../../../features/food/components/FoodItemCard';
import FoodCustomizationModal from '../../../features/food/components/FoodCustomizationModal';

import type { FoodItem, CustomizedItem } from '../../../core/types';

const RestaurantDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // STATE
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // SELECTORS
  const restaurant = useAppSelector(selectSelectedRestaurant);
  const categories = useAppSelector(selectMenuCategories);
  const loading = useAppSelector(selectRestaurantLoading);
  const error = useAppSelector(selectRestaurantError);

  const cartItems = useAppSelector(selectCartItems);
  const cartRestaurant = useAppSelector(selectCartRestaurant);
  const isCartEmpty = useAppSelector(selectIsCartEmpty);
  const { subtotal, deliveryFee, tax, total, itemCount } = useAppSelector(selectCartTotals);
  const isCartDrawerOpen = useAppSelector(selectCartDrawerOpen);

  // FETCH
  useEffect(() => {
    if (id) dispatch(fetchRestaurantById(id));
  }, [id]);

  // FILTER
  const filteredCategories =
    selectedCategory === 'all'
      ? categories
      : categories.filter((c) => c.id === selectedCategory);

  // HANDLERS
  const handleAddToCart = (foodItem: FoodItem) => {
    if (!isCartEmpty && cartRestaurant.id !== restaurant?.id) {
      if (!window.confirm('Clear cart and add item?')) return;
      dispatch(clearCart());
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

      dispatch(showToast({ message: `${foodItem.name} added`, type: 'success' }));
    }
  };

  const handleAddCustomizedItem = (item: CustomizedItem) => {
    const key = [
      item.foodItem.id,
      item.selectedVariant?.id || '',
      ...item.selectedAddons.map(a => a.id)
    ].join('_');

    const price =
      item.foodItem.price +
      item.selectedAddons.reduce((s, a) => s + a.price, 0) +
      (item.selectedVariant?.price || 0);

    dispatch(addToCart({
      foodItemId: key,
      name: item.foodItem.name,
      price,
      quantity: item.quantity,
      image: item.foodItem.image,
      restaurantId: restaurant!.id,
      restaurantName: restaurant!.name,
      isVeg: item.foodItem.isVeg,
      specialInstructions: item.specialInstructions,
    }));

    dispatch(showToast({ message: 'Item added', type: 'success' }));
  };

  const handleUpdateQty = (foodItemId: string, qty: number) => {
    const item = cartItems.find(i => i.foodItemId === foodItemId);
    if (!item) return;
    dispatch(updateQuantity({ itemId: item.id, quantity: qty }));
  };

  // STATES
  if (loading) return <Skeleton variant="rectangular" height={300} />;
  if (error || !restaurant) return <Alert severity="error">Error loading</Alert>;

  // =========================
  // 🧩 INTERNAL COMPONENTS
  // =========================

  const Header = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">{restaurant.name}</Typography>
    </Box>
  );

  const Menu = () => (
    <Grid item xs={12} lg={8}>
      <Tabs value={selectedCategory} onChange={(_, v) => setSelectedCategory(v)}>
        <Tab value="all" label="All" />
        {categories.map(c => <Tab key={c.id} value={c.id} label={c.name} />)}
      </Tabs>

      {filteredCategories.map(cat => (
        <Box key={cat.id} sx={{ mt: 3 }}>
          <Typography variant="h6">{cat.name}</Typography>

          <Stack spacing={2}>
            {cat.items.map(item => {
              const cartItem = cartItems.find(ci => ci.foodItemId === item.id);

              return (
                <FoodItemCard
                  key={item.id}
                  foodItem={item}
                  quantity={cartItem?.quantity || 0}
                  onAddToCart={() => handleAddToCart(item)}
                  onUpdateQuantity={handleUpdateQty}
                />
              );
            })}
          </Stack>
        </Box>
      ))}
    </Grid>
  );

  const CartSidebar = () => (
    <Grid item xs={12} lg={4}>
      <Paper sx={{ p: 2, position: 'sticky', top: 120 }}>
        <Typography fontWeight={700}>Cart</Typography>

        {cartItems.map(item => (
          <Typography key={item.id}>
            {item.quantity} × {item.name}
          </Typography>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography>Total ₹{total}</Typography>
      </Paper>
    </Grid>
  );

  const FloatingCart = () => {
    if (!itemCount) return null;

    return (
      <Box sx={{ position: 'fixed', bottom: 70, right: 20 }}>
        <Badge badgeContent={itemCount}>
          <Button onClick={() => dispatch(toggleCartDrawer())}>
            ₹{total}
          </Button>
        </Badge>
      </Box>
    );
  };

  const CartDrawer = () => (
    <Drawer open={isCartDrawerOpen} onClose={() => dispatch(toggleCartDrawer())}>
      <Box sx={{ p: 2 }}>
        <Typography>Cart ({itemCount})</Typography>
        {cartItems.map(i => (
          <Typography key={i.id}>
            {i.quantity} × {i.name}
          </Typography>
        ))}
      </Box>
    </Drawer>
  );

  // =========================
  // 🔥 RENDER
  // =========================

  return (
    <Box>
      <Header />

      <Container>
        <Grid container spacing={4}>
          <Menu />
          <CartSidebar />
        </Grid>
      </Container>

      <FloatingCart />
      <CartDrawer />

      {selectedFoodItem && (
        <FoodCustomizationModal
          open={modalOpen}
          foodItem={selectedFoodItem}
          onClose={() => setModalOpen(false)}
          onAddToCart={handleAddCustomizedItem}
        />
      )}
    </Box>
  );
};

export default RestaurantDetail;