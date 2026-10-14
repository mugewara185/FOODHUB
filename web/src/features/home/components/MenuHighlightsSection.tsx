import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Skeleton,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { ShoppingCart, RestaurantMenu, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { addToCart, clearCart, selectIsCartEmpty } from '@/features/cart/cartSlice/V/cartSlice_V';
import type { RootState } from '@/app/store';
import { showToast } from '@/features/ui/uiSlice';
import { SafeImage } from '@/shared/components/ui/SafeImage';
import type { MenuHighlightItem } from '@/features/restaurant/restaurantSlice';
import { SectionHeader } from './shared/SectionHeader';
import { Reveal } from './shared/Reveal';

interface MenuHighlightsSectionProps {
  highlights?: MenuHighlightItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const MenuHighlightsSection: React.FC<MenuHighlightsSectionProps> = ({
  highlights = [],
  loading = false,
  error = null,
  onRetry,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const cartRestaurantId = useAppSelector((state: RootState) => state.cart.restaurantId);
  const cartRestaurantName = useAppSelector((state: RootState) => state.cart.restaurantName);
  const isCartEmpty = useAppSelector(selectIsCartEmpty);

  const [pendingItem, setPendingItem] = useState<MenuHighlightItem | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  const executeAddToCart = (highlight: MenuHighlightItem) => {
    dispatch(
      addToCart({
        foodItemId: highlight.item.id,
        name: highlight.item.name,
        price: highlight.item.price,
        quantity: 1,
        image: highlight.item.image,
        restaurantId: highlight.restaurantId,
        restaurantName: highlight.restaurantName,
        isVeg: Boolean(highlight.item.isVeg),
      })
    );
    dispatch(
      showToast({
        message: `${highlight.item.name} added to cart!`,
        type: 'success',
      })
    );
  };

  const handleAddDish = (highlight: MenuHighlightItem) => {
    // Check for single-restaurant cart conflict
    if (!isCartEmpty && cartRestaurantId && cartRestaurantId !== highlight.restaurantId) {
      setPendingItem(highlight);
      setConflictDialogOpen(true);
      return;
    }
    executeAddToCart(highlight);
  };

  const handleConfirmConflict = () => {
    if (pendingItem) {
      dispatch(clearCart());
      executeAddToCart(pendingItem);
      setPendingItem(null);
    }
    setConflictDialogOpen(false);
  };

  const handleCancelConflict = () => {
    setPendingItem(null);
    setConflictDialogOpen(false);
  };

  const itemsToDisplay = highlights.slice(0, 6);

  return (
    <Box>
      <SectionHeader
        title="Menu Highlights"
        subtitle="Popular available dishes from featured kitchens"
        actionLabel="Explore Menus"
        onActionClick={() => navigate('/restaurants')}
      />

      {/* Error state */}
      {error && (
        <Alert
          severity="warning"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry} startIcon={<Refresh />}>
                Retry
              </Button>
            ) : undefined
          }
          sx={{ mb: 4, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Menu Items Grid */}
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {itemsToDisplay.map((highlight, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={`${highlight.restaurantId}-${highlight.item.id}`}
                sx={{ display: 'flex' }}
              >
                <Reveal delay={index * 0.06} style={{ width: '100%', display: 'flex' }}>
                  <Card
                    elevation={0}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      minHeight: 124,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {/* Left Side: Dish Cover Image */}
                    <Box sx={{ position: 'relative', width: 110, height: '100%', minHeight: 124, flexShrink: 0, p: 1 }}>
                      <SafeImage
                        src={highlight.item.image}
                        alt={highlight.item.name}
                        fallbackIcon={<RestaurantMenu sx={{ fontSize: '2rem', opacity: 0.45, color: 'text.secondary' }} />}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 2,
                        }}
                      />
                      {highlight.item.isVeg && (
                        <Chip
                          label="VEG"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 14,
                            left: 14,
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            bgcolor: 'success.main',
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>

                    {/* Right Side: Details & Actions */}
                    <CardContent
                      sx={{
                        flex: 1,
                        p: '12px 14px 12px 6px !important',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{
                            lineHeight: 1.25,
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {highlight.item.name}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.25,
                            fontSize: '0.78rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {highlight.restaurantName}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mt: 1 }}
                      >
                        <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                          ₹{highlight.item.price}
                        </Typography>

                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Button
                            size="small"
                            onClick={() => navigate(`/restaurants/${highlight.restaurantId}`)}
                            sx={{
                              minWidth: 0,
                              p: '4px 6px',
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            Menu
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ShoppingCart sx={{ fontSize: '15px !important' }} />}
                            onClick={() => handleAddDish(highlight)}
                            sx={{
                              minHeight: 32,
                              px: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: 2,
                            }}
                          >
                            Add
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Reveal>
              </Grid>
            ))}
          </Grid>

          {/* Empty state */}
          {itemsToDisplay.length === 0 && !error && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 3, mt: 2, borderRadius: 2 }}>
              No menu items available at the moment.
            </Alert>
          )}
        </>
      )}

      {/* Conflict Confirmation Dialog */}
      <Dialog
        open={conflictDialogOpen}
        onClose={handleCancelConflict}
        aria-labelledby="cart-conflict-dialog-title"
        aria-describedby="cart-conflict-dialog-description"
      >
        <DialogTitle id="cart-conflict-dialog-title" sx={{ fontWeight: 700 }}>
          Replace items in cart?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cart-conflict-dialog-description">
            Your cart contains items from <strong>{cartRestaurantName || 'another restaurant'}</strong>.
            FoodHub allows ordering from only one restaurant at a time.
            <br /><br />
            Would you like to discard your current cart and start a new order with{' '}
            <strong>{pendingItem?.restaurantName}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConflict} color="inherit">
            Keep existing items
          </Button>
          <Button onClick={handleConfirmConflict} variant="contained" color="primary">
            Start new order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuHighlightsSection;
