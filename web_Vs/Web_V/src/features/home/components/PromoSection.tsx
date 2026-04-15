import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { LocalOffer, TrendingUp } from '@mui/icons-material';

interface Promo {
  id: string;
  title: string;
  description: string;
  discount: string;
  code: string;
  color: string;
}

const PROMOS: Promo[] = [
  {
    id: '1',
    title: 'New User Special',
    description: 'Get 50% off on your first order',
    discount: '50%',
    code: 'FIRST50',
    color: '#FF6B6B',
  },
  {
    id: '2',
    title: 'Mega Food Week',
    description: 'Save up to 40% on selected restaurants',
    discount: '40%',
    code: 'MEGA40',
    color: '#4ECDC4',
  },
  {
    id: '3',
    title: 'Free Delivery',
    description: 'On orders above ₹299',
    discount: 'FREE',
    code: 'FREEDELIVERY',
    color: '#FFE66D',
  },
];

const PromoSection: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Stack direction="row" justify="center" spacing={1} sx={{ mb: 2 }}>
          <TrendingUp sx={{ color: 'primary.main' }} />
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main' }}>
            SPECIAL OFFERS
          </Typography>
        </Stack>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Exclusive Deals Just For You
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Limited time offers on your favorite restaurants and cuisines
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {PROMOS.map((promo) => (
          <Grid item xs={12} sm={6} md={4} key={promo.id}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${promo.color}15 0%, ${promo.color}05 100%)`,
                border: `2px solid ${promo.color}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 24px ${promo.color}30`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Chip
                      icon={<LocalOffer />}
                      label={promo.discount}
                      sx={{
                        bgcolor: promo.color,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        height: 'auto',
                        padding: '8px 4px',
                        '& .MuiChip-icon': {
                          color: 'white',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {promo.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {promo.description}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'white',
                      p: 1.5,
                      borderRadius: 1,
                      border: `1px dashed ${promo.color}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: 'textSecondary', display: 'block', mb: 0.5 }}
                    >
                      Use Code
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: promo.color, fontFamily: 'monospace' }}
                    >
                      {promo.code}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      textTransform: 'capitalize',
                      bgcolor: promo.color,
                      '&:hover': { bgcolor: promo.color, opacity: 0.9 },
                    }}
                  >
                    Claim Offer
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PromoSection;
