import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Rating,
  Button,
  Stack,
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  DeliveryDining,
  FavoriteBorder,
  Favorite,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
//core
import { type Restaurant } from '../../../../core/types';
import { SafeImage } from '../../../../shared/components/ui/SafeImage';
import { buildRestaurantImageUrl } from '../../../../shared/utils/image';
//features
import { useFavorites } from '@/features/auth/hooks/useFavorites';

export interface RestaurantsCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean; // Kept for backwards compatibility
  onToggleFavorite?: (id: string) => void;
}

const formatDeliveryTime = (deliveryTime: unknown): string => {
  if (typeof deliveryTime === 'number' && !isNaN(deliveryTime)) {
    return `${deliveryTime}-${deliveryTime + 10} min`;
  }
  if (typeof deliveryTime === 'string') {
    const trimmed = deliveryTime.trim();
    if (trimmed && !trimmed.includes('undefined') && !trimmed.includes('NaN')) {
      return trimmed;
    }
  }
  return '25-35 min';
};

export const RestaurantsCard: React.FC<RestaurantsCardProps> = React.memo<RestaurantsCardProps>(({
  restaurant,
  isFavorite: propIsFavorite,
  onToggleFavorite: propOnToggleFavorite,
}) => {
  const { id, name } = restaurant;
  const rawImage = restaurant.image || (restaurant as unknown as { imageUrl?: string }).imageUrl;
  const imageSrc = buildRestaurantImageUrl(rawImage);
  const navigate = useNavigate();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();

  const isFavorite = propIsFavorite !== undefined ? propIsFavorite : checkFavorite({ kind: 'restaurant', id });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (propOnToggleFavorite) {
      propOnToggleFavorite(id);
    } else {
      toggleFavorite({ kind: 'restaurant', id });
    }
  };

  return (
    <Card
      onClick={() => navigate(`/restaurants/${id}`)}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      {/* Normalized 16:9 Image Region */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          bgcolor: 'action.hover',
          flexShrink: 0,
        }}
      >
        <SafeImage
          src={imageSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
          }}
        />

        {/* Favorite Button */}
        <Button
          variant="contained"
          size="small"
          aria-label={isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
          onClick={handleFavoriteClick}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            minWidth: 36,
            width: 36,
            height: 36,
            p: 0,
            zIndex: 2,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            color: isFavorite ? 'error.main' : 'text.secondary',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'background.paper',
              color: 'error.main',
              transform: 'scale(1.1)',
            },
          }}
        >
          {isFavorite ? (
            <Favorite fontSize="small" />
          ) : (
            <FavoriteBorder fontSize="small" />
          )}
        </Button>
      </Box>

      {/* Structured Card Content */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        {/* Restaurant Name and Compact Rating Badge */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            minHeight: 28,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            noWrap
            title={restaurant.name}
            sx={{
              flex: 1,
              mr: 1,
              fontSize: '1.05rem',
              lineHeight: 1.25,
            }}
          >
            {restaurant.name}
          </Typography>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: restaurant.rating && restaurant.rating > 0 ? 'success.light' : 'action.selected',
              color: restaurant.rating && restaurant.rating > 0 ? 'success.dark' : 'text.secondary',
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              flexShrink: 0,
              gap: 0.5,
            }}
          >
            <Typography variant="caption" fontWeight={700}>
              {restaurant.rating && restaurant.rating > 0
                ? restaurant.rating.toFixed(1)
                : 'New'}
            </Typography>
            {restaurant.rating && restaurant.rating > 0 ? (
              <Rating
                value={1}
                max={1}
                readOnly
                size="small"
                sx={{ '& .MuiRating-icon': { fontSize: 13 } }}
              />
            ) : null}
          </Box>
        </Box>

        {/* Cuisine Chips with Reserved Slot */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            mb: 1.25,
            minHeight: 24,
            alignItems: 'center',
            overflow: 'hidden',
            flexWrap: 'nowrap',
          }}
        >
          {(restaurant.cuisine || []).slice(0, 2).map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          ))}
          {(restaurant.cuisine || []).length > 2 && (
            <Chip
              label={`+${restaurant.cuisine.length - 2}`}
              size="small"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          )}
        </Stack>

        {/* Restaurant Metadata */}
        <Stack spacing={0.5} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 18 }}>
            <LocationOn sx={{ color: 'text.secondary', fontSize: 15, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
              {restaurant.address ? restaurant.address.split(',')[0] : 'Local area'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 18 }}>
            <AccessTime sx={{ color: 'text.secondary', fontSize: 15, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
              {formatDeliveryTime(restaurant.deliveryTime)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 18 }}>
            <DeliveryDining sx={{ color: 'text.secondary', fontSize: 15, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
              ₹{restaurant.deliveryFee ?? 0} delivery fee
              {restaurant.minOrder && restaurant.minOrder > 0 ? ` • Min ₹${restaurant.minOrder}` : ''}
            </Typography>
          </Box>
        </Stack>

        {/* Optional Badges pinned to bottom */}
        <Box sx={{ mt: 'auto', pt: 0.5, minHeight: 24, display: 'flex', alignItems: 'center' }}>
          {(restaurant.tags || []).length > 0 ? (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
              {restaurant.tags.slice(0, 2).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
              ))}
            </Stack>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
});

export default RestaurantsCard;