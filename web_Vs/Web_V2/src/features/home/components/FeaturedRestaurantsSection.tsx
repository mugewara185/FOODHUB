import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Stack,
  Chip,
} from '@mui/material';
import {
  Star,
  Timer,
  DeliveryDining,
  ArrowForward,
} from '@mui/icons-material';

interface FeaturedRestaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  cuisine: string[];
  isFeatured?: boolean;
}

interface Props {
  restaurants: FeaturedRestaurant[];
}

const FeaturedRestaurantsSection: React.FC<Props> = ({ restaurants = [] }) => {
  const featured = (restaurants || []).slice(0, 6); // Show top 6 featured restaurants

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main' }}>
            FEATURED
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            Top Rated Restaurants
          </Typography>
        </Box>
        <Button
          variant="text"
          endIcon={<ArrowForward />}
          sx={{
            textTransform: 'capitalize',
            display: { xs: 'none', md: 'flex' },
          }}
        >
          View All
        </Button>
      </Box>

      <Grid container spacing={3}>
        {featured.map((restaurant) => (
          <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-8px)',
                },
              }}
            >
              {/* Image with Badge */}
              <Box sx={{ position: 'relative', overflow: 'hidden', height: 200 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={restaurant.image}
                  alt={restaurant.name}
                  sx={{
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                />
                {restaurant.isFeatured && (
                  <Chip
                    label="FEATURED"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ pb: 1 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {restaurant.name}
                </Typography>

                {/* Cuisines */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {restaurant.cuisine.slice(0, 2).map((c, i) => (
                    <Chip
                      key={i}
                      label={c}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  ))}
                </Box>

                {/* Info Stack */}
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Star sx={{ fontSize: 18, color: 'warning.main' }} />
                      <Typography variant="body2" fontWeight={700}>
                        {restaurant.rating}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="textSecondary">
                      (2.4k reviews)
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Timer sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="caption">{restaurant.deliveryTime}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <DeliveryDining sx={{ fontSize: 18, color: 'success.main' }} />
                      <Typography variant="caption">
                        ₹{restaurant.deliveryFee} delivery
                      </Typography>
                    </Stack>
                  </Stack>

                  <Typography variant="caption" color="textSecondary">
                    Min order: ₹{restaurant.minOrder}
                  </Typography>
                </Stack>
              </CardContent>

              <CardActions sx={{ pt: 0 }}>
                <Button fullWidth variant="contained" size="small">
                  Order Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* View All Button for Mobile */}
      <Box sx={{ textAlign: 'center', mt: 4, display: { xs: 'block', md: 'none' } }}>
        <Button variant="outlined" size="large" endIcon={<ArrowForward />}>
          View All Restaurants
        </Button>
      </Box>
    </Container>
  );
};

export default FeaturedRestaurantsSection;
