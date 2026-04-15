import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Rating,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  LocationOn,
  AccessTime,
  DeliveryDining,
} from '@mui/icons-material';
import type { Restaurant } from '@core/types';

export interface RestaurantHeroProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onShare?: () => void;
}

const RestaurantHero: React.FC<RestaurantHeroProps> = ({
  restaurant,
  isFavorite,
  onToggleFavorite,
  onShare,
}) => {
  return (
    <Box>
      {/* Banner Image */}
      <Box
        sx={{
          height: { xs: 200, md: 350 },
          backgroundImage: `url(${restaurant.bannerImage || restaurant.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          borderRadius: { xs: 0, md: 4 },
          mb: 4,
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 2, md: 4 },
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <Box>
            <Typography variant="h3" color="white" fontWeight={800} gutterBottom>
              {restaurant.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'success.main', color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={700} sx={{ mr: 0.5 }}>
                  {restaurant.rating.toFixed(1)}
                </Typography>
                <Rating value={1} max={1} size="small" readOnly sx={{ color: 'white' }} />
              </Box>
              <Typography color="grey.300">•</Typography>
              <Typography color="grey.300">{restaurant.cuisine.join(', ')}</Typography>
              <Typography color="grey.300">•</Typography>
              <Typography color="grey.300">{restaurant.address}</Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton
              sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
              onClick={() => onToggleFavorite(restaurant.id)}
            >
              {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            {onShare && (
              <IconButton sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }} onClick={onShare}>
                <Share />
              </IconButton>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Info Cards Row */}
      <Stack direction="row" spacing={2} sx={{ mb: 4, overflowX: 'auto', pb: 1 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', minWidth: 150 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccessTime color="primary" />
            <Box>
              <Typography variant="body2" color="text.secondary">Delivery in</Typography>
              <Typography fontWeight={700}>{restaurant.deliveryTime}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', minWidth: 150 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DeliveryDining color="primary" />
            <Box>
              <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
              <Typography fontWeight={700}>₹{restaurant.deliveryFee}</Typography>
            </Box>
          </Stack>
        </Paper>

        {restaurant.tags.map((tag, idx) => (
          <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography fontWeight={600} color="primary.main">{tag}</Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default RestaurantHero;
