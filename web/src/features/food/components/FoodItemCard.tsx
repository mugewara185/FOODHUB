import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Add,
  Remove,
  FavoriteBorder,
  Favorite,
  LocalFireDepartment,
} from '@mui/icons-material';
import type { CustomizedCartItem as CustomizedItem, FoodItem } from '../../../core/types';
import FoodCustomizationModal from './FoodCustomizationModal';
import { useAppDispatch } from '../../../app/store';

interface FoodItemCardProps {
  foodItem: FoodItem;
  quantity?: number;
  onAddToCart?: (foodItem: FoodItem | CustomizedItem) => void;
  onAddToCartWithCustomization?: (customizedItem: CustomizedItem) => void;
  onUpdateQuantity?: (foodItemId: string, quantity: number) => void;
  onToggleFavorite?: (foodItemId: string) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({
  foodItem,
  quantity = 0,
  onAddToCart,
  onAddToCartWithCustomization,
  onUpdateQuantity,
  onToggleFavorite,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);

  // const dispatch= useAppDispatch();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onToggleFavorite?.(foodItem.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); //i.e.., stop event bubbling to card click
    if (foodItem.addons?.length || foodItem.variants?.length) {
      setCustomizationOpen(true);
    } else {
      onAddToCart?.(foodItem);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity?.(foodItem.id, quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      onUpdateQuantity?.(foodItem.id, quantity - 1);
    } else {
      onUpdateQuantity?.(foodItem.id, 0);
    }
  };

  const isDiscounted = foodItem?.originalPrice && foodItem.originalPrice > foodItem.price;
  const discountPercentage = isDiscounted
    ? Math.round(((foodItem.originalPrice! - foodItem.price) / foodItem.originalPrice!) * 100)
    : 0;

  return (
    <>
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          p: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {/* Food Image */}
        <Box sx={{ position: 'relative', width: { xs: '100%', sm: 120 }, height: 120 }}>
          <CardMedia
            component="img"
            image={foodItem.image}
            alt={foodItem.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 2,
            }}
          />

          {/* Favorite Button */}
          <IconButton
            size="small"
            onClick={handleToggleFavorite}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            {isFavorite ? (
              <Favorite sx={{ color: 'error.main', fontSize: 20 }} />
            ) : (
              <FavoriteBorder sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          {/* Tags */}
          <Stack
            direction="column"
            spacing={0.5}
            sx={{ position: 'absolute', top: 8, left: 8 }}
          >
            {foodItem.isBestSeller && (
              <Chip
                label="Bestseller"
                size="small"
                color="warning"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            )}
            {discountPercentage > 0 && (
              <Chip
                label={`${discountPercentage}% OFF`}
                size="small"
                color="error"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            )}
          </Stack>
        </Box>

        {/* Food Details */}
        <CardContent sx={{ flex: 1, p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {foodItem.name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating
                  value={foodItem.rating}
                  readOnly
                  size="small"
                  precision={0.5}
                  sx={{ '& .MuiRating-icon': { fontSize: 16 } }}
                />
                <Typography variant="body2" color="text.secondary">
                  ({foodItem.rating.toFixed(1)})
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  ₹{foodItem.price}
                </Typography>
                {isDiscounted && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    ₹{foodItem.originalPrice}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {foodItem?.dietaryInfo && foodItem.dietaryInfo.calories + ' kcal'}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {foodItem.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Food Tags */}
            <Stack direction="row" spacing={1}>
              <Chip
                label={foodItem.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                size="small"
                color={foodItem.isVeg ? 'success' : 'error'}
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {foodItem.isSpicy && (
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

            {/* Add to Cart Button */}
            {quantity === 0 ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={handleAddToCart}
                sx={{ borderRadius: 20, px: 2 }}
              >
                ADD
              </Button>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handleDecrease}
                  sx={{ color: 'white' }}
                >
                  <Remove fontSize="small" />
                </IconButton>
                <Typography sx={{ px: 1, minWidth: 20, textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleIncrease}
                  sx={{ color: 'white' }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      {/* //modal component */}
      {customizationOpen && (
        // console.log('FoodCustomizationModal'),
        <FoodCustomizationModal
          open={customizationOpen}
          foodItem={foodItem}
          onClose={() => setCustomizationOpen(false)}
          onAddToCart={(customizedItem: CustomizedItem) => {
            // Handle customized item addition
            // console.log('Customized item:', customizedItem);
            onAddToCartWithCustomization?.(customizedItem);
          }}
        />
      )}
    </>
  );
};

export default FoodItemCard;