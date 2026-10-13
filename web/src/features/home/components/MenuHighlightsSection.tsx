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
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { addToCart, clearCart, selectIsCartEmpty } from '@/features/cart/cartSlice/V/cartSlice_V';
import type { RootState } from '@/app/store';
import { showToast } from '@/features/ui/uiSlice';
import { SafeImage } from '@/shared/components/ui/SafeImage';
import type { MenuHighlightItem } from '@/features/restaurant/restaurantSlice';

interface MenuHighlightsSectionProps {
  highlights?: MenuHighlightItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const MenuHighlightsSection: React.FC<MenuHighlightsSectionProps> = ({
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
    <Box sx={{ my: 8 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <RestaurantMenu sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1.2 }}
            >
              CHEF'S PICKS
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Menu Highlights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Signature dishes curated from featured restaurant menus
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => navigate('/restaurants')}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 3,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          Explore Full Menus
        </Button>
      </Box>

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
          sx={{ mb: 4 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Menu Items Grid */}
          <Grid container spacing={3}>
            {itemsToDisplay.map((highlight, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={`${highlight.restaurantId}-${highlight.item.id}`}
                sx={{ display: 'flex' }}
              >
                <motion.div
                  style={{ height: '100%', width: '100%', display: 'flex' }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      minHeight: 120,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {/* Left Side: Dish Cover Image */}
                    <Box sx={{ position: 'relative', width: 115, height: 120, flexShrink: 0, p: 1 }}>
                      <SafeImage
                        src={highlight.item.image}
                        alt={highlight.item.name}
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
                          color="success"
                          sx={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            fontWeight: 800,
                            fontSize: '0.55rem',
                            height: 18,
                            px: 0.5,
                          }}
                        />
                      )}
                    </Box>

                    {/* Right Side: Content */}
                    <CardContent
                      sx={{
                        flex: 1,
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        '&:last-child': { pb: 1.5 },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          noWrap
                          title={highlight.item.name}
                          sx={{ fontSize: '0.95rem', lineHeight: 1.2 }}
                        >
                          {highlight.item.name}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          title={highlight.restaurantName}
                          onClick={() => navigate(`/restaurants/${highlight.restaurantId}`)}
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                          }}
                        >
                          {highlight.restaurantName}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 1,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                          ₹{highlight.item.price}
                        </Typography>

                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(`/restaurants/${highlight.restaurantId}`)}
                            sx={{
                              minWidth: 0,
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              textTransform: 'capitalize',
                            }}
                          >
                            Menu
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAddDish(highlight)}
                            startIcon={<ShoppingCart sx={{ fontSize: 14 }} />}
                            sx={{
                              fontSize: '0.75rem',
                              textTransform: 'capitalize',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 2,
                            }}
                          >
                            Add
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
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
