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
  LinearProgress,
} from '@mui/material';
import { Bolt, LocalFireDepartment, Favorite } from '@mui/icons-material';

interface QuickDeliveryItem {
  id: string;
  name: string;
  category: string;
  deliveryTime: string;
  discount: number;
  image: string;
  icon: React.ReactNode;
}

const QUICK_ITEMS: QuickDeliveryItem[] = [
  {
    id: '1',
    name: 'Pizza Express',
    category: 'Pizza & Fast Food',
    deliveryTime: '15 min',
    discount: 30,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop',
    icon: <Bolt sx={{ color: '#FFD93D', fontSize: 28 }} />,
  },
  {
    id: '2',
    name: 'Dessert Heaven',
    category: 'Sweets & Pastries',
    deliveryTime: '10 min',
    discount: 25,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop',
    icon: <LocalFireDepartment sx={{ color: '#FF6B6B', fontSize: 28 }} />,
  },
  {
    id: '3',
    name: 'Fresh Juice Co',
    category: 'Beverages',
    deliveryTime: '8 min',
    discount: 20,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop',
    icon: <Bolt sx={{ color: '#4ECDC4', fontSize: 28 }} />,
  },
];

const QuickDeliverySection: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#FFF8E7', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Stack direction="row" justify="center" spacing={1} sx={{ mb: 2 }}>
            <Bolt sx={{ color: '#FFD93D' }} />
            <Typography variant="overline" sx={{ fontWeight: 600, color: 'warning.main' }}>
              SUPER FAST
            </Typography>
          </Stack>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Quick Commerce
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Instant delivery in 15 minutes or less
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {QUICK_ITEMS.map((item, index) => (
            <Grid item xs={12} md={4} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                {/* Background Image */}
                <Box
                  sx={{
                    height: 150,
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                    },
                  }}
                />

                <CardContent>
                  <Stack spacing={2}>
                    {/* Icon & Category */}
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      {item.icon}
                      <Typography variant="caption" color="textSecondary">
                        {item.category}
                      </Typography>
                    </Stack>

                    {/* Name */}
                    <Typography variant="h6" fontWeight={700}>
                      {item.name}
                    </Typography>

                    {/* Time Badge */}
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: '#FFE7E7',
                        color: '#FF6B6B',
                        px: 2,
                        py: 0.75,
                        borderRadius: 10,
                        width: 'fit-content',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      <Bolt sx={{ fontSize: 16 }} />
                      {item.deliveryTime}
                    </Box>

                    {/* Discount Progress */}
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          Get {item.discount}% OFF
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={item.discount}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#F0F0F0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#FF6B6B',
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Stack>
                    </Stack>

                    {/* Button */}
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      sx={{
                        textTransform: 'capitalize',
                        backgroundColor: index === 1 ? '#FFD93D' : 'primary.main',
                        color: index === 1 ? 'black' : 'white',
                        fontWeight: 700,
                        mt: 1,
                      }}
                    >
                      Order Now
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default QuickDeliverySection;
