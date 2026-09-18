import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
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
//features
import { useRestaurantLogic } from '@/features/restaurant/hooks/useRestaurantLogic';

interface RestaurantsCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const RestaurantsCard: React.FC<RestaurantsCardProps> = React.memo<RestaurantsCardProps>(({ 
  restaurant,
  isFavorite = false,
  onToggleFavorite
}
) => {
  const { id, name, image, address, cuisine, rating, deliveryTime, minOrder, deliveryFee } = restaurant;
  const navigate = useNavigate();

  return (
    <Card 
      onClick={() => navigate(`/restaurants/${id}`)}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Button
          variant="contained"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(id);
          }}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            minWidth: 'auto',
            p: 1,
            zIndex: 1,
            bgcolor: 'background.paper',
            color: isFavorite ? 'error.main' : 'text.secondary',
            '&:hover': {
              bgcolor: 'background.paper',
              color: 'error.main',
              transform: 'scale(1.1)',
            }
          }}
        >
          {isFavorite ? (
            <Favorite fontSize="small" />
          ) : (
            <FavoriteBorder fontSize="small" />
          )}
        </Button>

        {/* Image Container */}
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <SafeImage
            src={image ? `${image}?w=400&h=225&fit=crop&q=80` : undefined}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Restaurant Name and Rating */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" fontWeight={600} noWrap>
            {restaurant.name}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'success.dark',
              px: 1,
              borderRadius: 1,
              minWidth: 50,
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {restaurant.rating && restaurant?.rating?.toFixed(1)}
            </Typography>
            <Rating
              value={restaurant.rating}
              readOnly
              size="small"
              precision={0.5}
              sx={{ ml: 0.5, '& .MuiRating-icon': { fontSize: 16 } }}
            />
          </Box>
        </Box>

        {/* Cuisine Tags */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
          {restaurant?.cuisine.slice(0, 2).map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
          {restaurant.cuisine.length > 2 && (
            <Chip
              label={`+${restaurant.cuisine.length - 2}`}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        {/* Restaurant Info */}
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {restaurant.address.split(',')[0]}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {restaurant.deliveryTime}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DeliveryDining fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              ₹{restaurant.deliveryFee} delivery fee
            </Typography>
            {restaurant.minOrder > 0 && (
              <Typography variant="body2" color="text.secondary">
                • Min ₹{restaurant.minOrder}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Tags */}
        {restaurant.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {restaurant.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.65rem' }}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
});

export default RestaurantsCard;