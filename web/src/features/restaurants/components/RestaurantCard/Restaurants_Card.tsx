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
// import { type Restaurant } from '../../../../data/types/food';
import { type Restaurant } from '../../../../core/types';
import { useNavigate } from 'react-router-dom';

interface RestaurantsCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const RestaurantsCard: React.FC<RestaurantsCardProps> = ({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
        },
      }}
      onClick={() => navigate(`/restaurants/${restaurant.id}`)}
    >
      {/* Favorite Button */}
      <Button
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          minWidth: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: 'background.paper',
          boxShadow: 2,
          zIndex: 1,
          '&:hover': {
            bgcolor: 'background.paper',
            transform: 'scale(1.1)',
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(restaurant.id);
        }}
      >
        {isFavorite ? (
          <Favorite sx={{ color: 'error.main' }} />
        ) : (
          <FavoriteBorder />
        )}
      </Button>

      {/* Restaurant Image */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="160"
          image={restaurant.image}
          alt={restaurant.name}
          sx={{ objectFit: 'cover' }}
        />
        {restaurant.isFeatured && (
          <Chip
            label="Featured"
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              fontWeight: 600,
            }}
          />
        )}
        {!restaurant.isOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Chip
              label="Closed"
              color="error"
              sx={{ fontWeight: 600, color: 'white' }}
            />
          </Box>
        )}
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
              {restaurant.rating.toFixed(1)}
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
          {restaurant.cuisine.slice(0, 2).map((cuisine) => (
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
};

export default RestaurantsCard;