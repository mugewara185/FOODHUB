import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Button,
  Skeleton,
  Alert,
  Typography,
} from '@mui/material';
import { ArrowBack, ShoppingCart } from '@mui/icons-material';

//store
import { useAppDispatch } from '../../../app/store/hooks';
import { toggleCartDrawer } from '../../../features/ui/uiSlice';

// Feature Components
import { 
  RestaurantHero, 
  RestaurantInfo, 
  RestaurantMenu 
} from '../../../features/restaurant/components';
import FoodCustomizationModal from '../../../features/food/components/FoodCustomizationModal';
import { useRestaurantLogic } from '../../../features/restaurant/hooks/useRestaurantLogic';

// UI Components
import { 
  OrderSummaryPanel, 
  BottomSheetPanel, 
  FloatingActionButton,
  ReviewStats,
  ReviewCard
} from '../../../features/ui/components';

const MOCK_REVIEWS = [
  {
    id: '1',
    userName: 'John Doe',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    comment: 'Amazing food! The butter chicken was delicious.',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    userName: 'Jane Smith',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    rating: 4,
    comment: 'Good quality food, but delivery was a bit late.',
    createdAt: '2024-01-10',
  },
];

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    restaurant,
    categories,
    items,
    loading,
    error,
    cartItems,
    cartTotals,
    isFavorite,
    modalOpen,
    selectedFoodItem,
    isCartDrawerOpen,
    getItemQuantity,
    handleAddToCart,
    handleAddCustomizedItem,
    handleUpdateQuantity,
    handleToggleFavorite,
    closeCustomizationModal,
  } = useRestaurantLogic(id);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={350} sx={{ mb: 2, borderRadius: 4 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 4 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
      </Container>
    );
  }

  if (error || !restaurant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Restaurant not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: { xs: 7, md: 0 } }}>
      <RestaurantHero 
        restaurant={restaurant} 
        isFavorite={isFavorite} 
        onToggleFavorite={handleToggleFavorite} 
      />
      {/* Menu and Cart summary  */}
      <Container maxWidth="lg" sx={{ mt: -4, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4}>

          {/* left-menu  */}
          <Grid xs={12} md={8}>
            <RestaurantInfo restaurant={restaurant} />
            <RestaurantMenu 
              categories={categories} 
              items={items} 
              onAddToCart={handleAddToCart} 
              onAddToCartWithCustomization={handleAddCustomizedItem}
              onToggleFavorite={handleToggleFavorite}
              onUpdateQuantity={handleUpdateQuantity}
              getItemQuantity={getItemQuantity}
            />
            {/* Review section  */}
            <Box sx={{ mt: 6, mb: 4 }}>
              <ReviewStats averageRating={restaurant.rating} totalReviews={120} />
              <Box sx={{ mt: 3 }}>
                {MOCK_REVIEWS.map((review) => (
                  <ReviewCard key={review.id} review={review} sx={{ mb: 2 }} />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* right-cart summary  */}
          <Grid xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <OrderSummaryPanel
              cartItemsLength={cartItems.length}
              title="Your Cart"
              rows={[
                 { label: 'Item Total', value: `₹${cartTotals.subtotal.toFixed(2)}` },
                 { label: 'Delivery Fee', value: `₹${cartTotals.deliveryFee}` },
                 { label: 'Taxes', value: `₹${cartTotals.tax.toFixed(2)}` },
              ]}
              total={`₹${cartTotals.total.toFixed(2)}`}
              actionLabel="Proceed to Checkout"
              onAction={() => navigate('/cart')}
              actionDisabled={cartItems.length === 0}
              warning={cartTotals.subtotal > 0 && cartTotals.subtotal < restaurant.minOrder 
                ? `Add ₹${(restaurant.minOrder - cartTotals.subtotal).toFixed(2)} more to reach minimum order` 
                : undefined}
              footer={
                 cartItems.length === 0 && (
                   <Alert severity="info" sx={{ mt: 2 }}>Your cart is empty.</Alert>
                 )
              }
            />
          </Grid>
        </Grid>
      </Container>

      {/* Sm/Mobile Cart Button and Drawer */}
      <FloatingActionButton
        count={cartTotals.itemCount}
        label="View Cart"
        onClick={() => dispatch(toggleCartDrawer())}
        icon={<ShoppingCart />}
      />

      <BottomSheetPanel
        open={isCartDrawerOpen}
        onClose={() => dispatch(toggleCartDrawer())}
        items={cartItems}
        subtotal={cartTotals.subtotal}
        deliveryFee={cartTotals.deliveryFee}
        tax={cartTotals.tax}
        total={cartTotals.total}
        onAction={() => {
          dispatch(toggleCartDrawer());
          navigate('/cart');
        }}
      />

{/*Modal */}
      {selectedFoodItem && (
        <FoodCustomizationModal
          open={modalOpen}
          onClose={closeCustomizationModal}
          foodItem={selectedFoodItem}
          onAddToCart={handleAddCustomizedItem}
        />
      )}
    </Box>
  );
};

export default RestaurantDetail;