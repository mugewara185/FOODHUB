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
  const fallBackImgSrc = 'https://th.bing.com/th/id/OIP.PLyeERi4uNYToVEWGHbhngHaEK?w=321&h=181&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3'
  const { id, name, image, address, cuisine, rating, deliveryTime, minOrder, deliveryFee } = restaurant;
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

      {/* Image Container */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <img
          src={`${image}?w=400&h=225&fit=crop&q=80`}
          srcSet={`
            ${image}?w=400&h=225&fit=crop&q=80 400w,
            ${image}?w=800&h=450&fit=crop&q=80 800w
          `}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 400px"
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null; // Prevent infinite loop if fallback fails
            target.src = fallBackImgSrc;
            target.removeAttribute('srcset'); // srcSet overrides src, so we must remove it
          }}
        />
      </div>

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