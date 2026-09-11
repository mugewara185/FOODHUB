import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Button,
  Skeleton,
  Alert,
  Typography,
  TextField,
  Rating,
  CircularProgress,
  Stack,
} from '@mui/material';
import { ArrowBack, ShoppingCart } from '@mui/icons-material';

//store
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
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
  ReviewCard,
} from '../../../features/ui/components';
import { reviewApi } from '../../../services/api/reviewApi';
import type { ReviewItem } from '../../../shared/components/ui/ReviewComponents/ReviewComponents';
import { logger, logComponent } from '../../../core/dev/logger';

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const {
    SelectedRestaurant: restaurant,
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

  useEffect(() => {
    let active = true;
    logComponent.mount('RestaurantDetail');

    if (!id) {
      setReviews([]);
      setReviewLoading(false);
      return () => {
        active = false;
      };
    }

    const loadReviews = async () => {
      setReviewLoading(true);
      setReviewError(null);
      logger.info('REVIEW', `Loading reviews for restaurant ${id}`, { event: 'REVIEW.LOAD.START', data: { restaurantId: id } });
      try {
        const nextReviews = await reviewApi.listRestaurantReviews(id);
        if (active) {
          logger.info('REVIEW', `Reviews loaded successfully`, { event: 'REVIEW.LOAD.SUCCESS', data: { count: nextReviews.length } });
          setReviews(nextReviews);
        }
      } catch (error) {
        if (active) {
          logger.error('REVIEW', `Failed to load reviews`, { event: 'REVIEW.LOAD.FAILURE', error });
          setReviewError(error instanceof Error ? error.message : 'Unable to load reviews right now.');
        }
      } finally {
        if (active) {
          setReviewLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      active = false;
      logComponent.unmount('RestaurantDetail');
    };
  }, [id]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : restaurant?.rating ?? 0;
  const reviewCount = reviews.length;

// Replacing handleSubmitReview
  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();

    const trace = logger.startTrace('REVIEW', 'Review submission started', { event: 'REVIEW.SUBMIT.START' });

    if (!id) {
      setReviewError('Restaurant information is missing.');
      trace.error('Missing restaurant ID', { event: 'REVIEW.SUBMIT.FAILURE' });
      return;
    }

    if (!authUser?.token) {
      setReviewError('Please sign in to leave a review.');
      trace.error('Unauthenticated user', { event: 'REVIEW.SUBMIT.FAILURE' });
      return;
    }

    if (reviewForm.comment.trim().length < 5) {
      setReviewError('Please share a few more words so your review feels helpful.');
      trace.error('Comment too short', { event: 'REVIEW.SUBMIT.FAILURE' });
      return;
    }

    trace.info('Payload ready for submission', { 
      event: 'REVIEW.SUBMIT.PAYLOAD_READY',
      data: { restaurantId: id, rating: reviewForm.rating, commentLength: reviewForm.comment.length }
    });

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const newReview = await reviewApi.createReview(
        id,
        {
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        },
        authUser.token
      );

      trace.end('Review submitted successfully', { event: 'REVIEW.SUBMIT.SUCCESS' });
      setReviews((current) => [newReview, ...current]);
      setReviewForm({ rating: 5, comment: '' });
      setReviewSuccess('Thanks! Your review has been posted.');
    } catch (error) {
      trace.error('Review submission failed', { event: 'REVIEW.SUBMIT.FAILURE', error });
      setReviewError(error instanceof Error ? error.message : 'Unable to submit your review right now.');
    } finally {
      setSubmittingReview(false);
    }
  };

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
              <ReviewStats averageRating={averageRating} totalReviews={reviewCount} />
              <Box sx={{ mt: 3 }}>
                <Stack spacing={2}>
                  {!authUser ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Sign in to leave a review for this restaurant.
                      <Button size="small" sx={{ ml: 1 }} onClick={() => navigate('/login')}>
                        Log in
                      </Button>
                    </Alert>
                  ) : (
                    <Box
                      component="form"
                      onSubmit={handleSubmitReview}
                      sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}
                    >
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Share your experience
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Your feedback helps other diners pick the right spot.
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                            Rating
                          </Typography>
                          <Rating
                            name="new-review-rating"
                            value={reviewForm.rating}
                            onChange={(_, value) => setReviewForm((current) => ({ ...current, rating: value ?? 5 }))}
                          />
                        </Box>
                        <TextField
                          label="Write your review"
                          multiline
                          minRows={3}
                          value={reviewForm.comment}
                          onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                        />
                        {reviewError && <Alert severity="error">{reviewError}</Alert>}
                        {reviewSuccess && <Alert severity="success">{reviewSuccess}</Alert>}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button type="submit" variant="contained" disabled={submittingReview}>
                            {submittingReview ? <CircularProgress size={20} color="inherit" /> : 'Submit review'}
                          </Button>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  {reviewLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => <ReviewCard key={review.id} review={review} sx={{ mb: 1 }} />)
                  ) : (
                    <Alert severity="info">No reviews yet. Be the first to share your experience.</Alert>
                  )}
                </Stack>
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