import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Restaurant,
  LocalShipping,
  Payment,
  Security,
  People,
  TrendingUp,
  EmojiEvents,
  Favorite,
} from '@mui/icons-material';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'John Doe',
      role: 'Founder & CEO',
      avatar: 'https://i.pravatar.cc/150?img=1',
      bio: 'Former food delivery executive with 10+ years of experience',
    },
    {
      name: 'Jane Smith',
      role: 'CTO',
      avatar: 'https://i.pravatar.cc/150?img=2',
      bio: 'Tech architect passionate about building scalable platforms',
    },
    {
      name: 'Mike Johnson',
      role: 'Head of Operations',
      avatar: 'https://i.pravatar.cc/150?img=3',
      bio: 'Ensuring smooth delivery operations across 50+ cities',
    },
    {
      name: 'Sarah Williams',
      role: 'Customer Experience',
      avatar: 'https://i.pravatar.cc/150?img=4',
      bio: 'Dedicated to making every customer smile',
    },
  ];

  const stats = [
    { icon: <Restaurant />, value: '500+', label: 'Restaurants' },
    { icon: <People />, value: '25k+', label: 'Happy Customers' },
    { icon: <LocalShipping />, value: '50+', label: 'Cities' },
    { icon: <EmojiEvents />, value: '4.8', label: 'App Rating' },
  ];

  const milestones = [
    {
      year: '2020',
      title: 'The Beginning',
      description: 'FoodHub was founded with a mission to make food delivery accessible to everyone.',
    },
    {
      year: '2021',
      title: 'First 10 Cities',
      description: 'Expanded operations to 10 major cities across India.',
    },
    {
      year: '2022',
      title: '1000+ Restaurants',
      description: 'Partnered with over 1000 restaurants nationwide.',
    },
    {
      year: '2023',
      title: '10 Million Orders',
      description: 'Celebrated delivering 10 million orders to happy customers.',
    },
    {
      year: '2024',
      title: 'The Future',
      description: 'Continuing to innovate and serve better food experiences.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          p: { xs: 4, md: 8 },
          mb: 6,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" fontWeight={800} gutterBottom>
          Bringing Food to Your Doorstep
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
          Since 2020, we've been connecting food lovers with their favorite restaurants
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          size="large"
          sx={{ color: 'primary.main', bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
        >
          Join Our Journey
        </Button>
      </Paper>

      {/* Stats */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          // <Grid item xs={6} md={3} key={index}> //fix: grid warning error
          <Grid size={{ xs: 6, md: 3 }} key={index}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {stat.icon}
              </Avatar>
              <Typography variant="h3" fontWeight={800} gutterBottom>
                {stat.value}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Mission & Vision */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main">
                Our Mission
              </Typography>
              <Typography variant="body1" paragraph>
                To revolutionize the food delivery experience by providing seamless,
                fast, and reliable service while supporting local restaurants and
                creating opportunities for delivery partners.
              </Typography>
              <Typography variant="body1">
                We believe that great food should be accessible to everyone, anytime, anywhere.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main">
                Our Vision
              </Typography>
              <Typography variant="body1" paragraph>
                To become the world's most trusted and innovative food delivery platform,
                setting new standards in customer satisfaction, partner success, and
                sustainable practices.
              </Typography>
              <Typography variant="body1">
                We envision a future where ordering food is effortless and every meal brings joy.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Values */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
          What We Stand For
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Our core values drive everything we do
        </Typography>

        <Grid container spacing={3}>
          {[
            {
              icon: <Security />,
              title: 'Trust & Safety',
              description: 'Your safety and trust are our top priorities in every interaction.',
            },
            {
              icon: <Favorite />,
              title: 'Customer First',
              description: 'We put our customers at the heart of every decision we make.',
            },
            {
              icon: <TrendingUp />,
              title: 'Innovation',
              description: 'Constantly evolving to serve you better with cutting-edge technology.',
            },
            {
              icon: <People />,
              title: 'Community',
              description: 'Building a community of food lovers, restaurants, and delivery partners.',
            },
          ].map((value, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 3,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {value.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {value.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {value.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Timeline */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
          Our Journey
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Milestones we've achieved along the way
        </Typography>

        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={3}>
            {milestones.map((milestone, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ minWidth: 80, color: 'primary.main' }}
                  >
                    {milestone.year}
                  </Typography>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {milestone.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {milestone.description}
                    </Typography>
                  </Box>
                </Box>
                {index < milestones.length - 1 && (
                  <Divider sx={{ mt: 3, ml: 15 }} />
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>

      {/* Team */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
          Meet the Team
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          The passionate people behind FoodHub
        </Typography>

        <Grid container spacing={4}>
          {teamMembers.map((member, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <Avatar
                  src={member.avatar}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid',
                    borderColor: 'primary.light',
                  }}
                />
                <Typography variant="h6" fontWeight={700}>
                  {member.name}
                </Typography>
                <Typography variant="body2" color="primary.main" gutterBottom>
                  {member.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {member.bio}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA */}
      <Paper
        sx={{
          p: 6,
          borderRadius: 4,
          bgcolor: 'success.light',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Ready to Start Your Food Journey?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
          Join thousands of food lovers who order with FoodHub every day
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="inherit"
            size="large"
            sx={{ color: 'success.main', bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Order Now
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Partner With Us
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default About;