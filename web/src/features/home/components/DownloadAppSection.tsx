import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { Download, Apple, Android, Check } from '@mui/icons-material';

const BENEFITS = [
  'Exclusive app-only deals',
  'Faster checkout process',
  'Track orders in real-time',
  'Save favorite restaurants',
  'Earn loyalty points',
  'Push notifications for offers',
];

const DownloadAppSection: React.FC = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 10,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          {/* Left: Text Content */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 600, opacity: 0.8 }}>
                  MOBILE APP
                </Typography>
                <Typography variant="h3" fontWeight={800} gutterBottom>
                  Get the App
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 400 }}>
                Download our mobile app for a better experience. Enjoy exclusive deals, faster
                ordering, and real-time tracking.
              </Typography>

              {/* Benefits List */}
              <Box>
                {BENEFITS.map((benefit, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={2}
                    sx={{ mb: 1.5, alignItems: 'center' }}
                  >
                    <Check sx={{ fontSize: 20 }} />
                    <Typography variant="body1">{benefit}</Typography>
                  </Stack>
                ))}
              </Box>

              {/* Download Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'grey.100' },
                    py: 1.5,
                    px: 3,
                    textTransform: 'none',
                  }}
                  startIcon={<Apple />}
                >
                  Download on App Store
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'grey.100' },
                    py: 1.5,
                    px: 3,
                    textTransform: 'none',
                  }}
                  startIcon={<Android />}
                >
                  Get it on Play Store
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* Right: App Screenshots/Mockup */}
          <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {[1, 2, 3].map((item) => (
                <Card
                  key={item}
                  sx={{
                    width: 120,
                    height: 240,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Download sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="caption">App Screen {item}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DownloadAppSection;
