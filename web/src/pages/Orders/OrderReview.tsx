import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Rating,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  PhotoCamera,
  Restaurant,
  Fastfood,
  LocalShipping,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';

const OrderReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [foodRating, setFoodRating] = useState<number | null>(0);
  const [deliveryRating, setDeliveryRating] = useState<number | null>(0);
  const [review, setReview] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<boolean | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In real app, upload to server
    const files = e.target.files;
    if (files) {
      // Simulate image upload
      setImages(prev => [...prev, ...Array.from(files).map(f => URL.createObjectURL(f))]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = () => {
    // In real app, submit review to API
    console.log({
      orderId: id,
      foodRating,
      deliveryRating,
      review,
      isAnonymous,
      images,
      recommendation,
    });
    navigate('/orders');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Rate Your Experience
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Order #{id} from Spice Garden
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Review Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Stack spacing={4}>
              {/* Food Rating */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Fastfood />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    How was the food?
                  </Typography>
                </Box>
                <Box sx={{ ml: 6 }}>
                  <Rating
                    value={foodRating}
                    onChange={(_, value) => setFoodRating(value)}
                    size="large"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Rate the taste, quality, and presentation
                  </Typography>
                </Box>
              </Box>

              {/* Delivery Rating */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <LocalShipping />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    How was the delivery?
                  </Typography>
                </Box>
                <Box sx={{ ml: 6 }}>
                  <Rating
                    value={deliveryRating}
                    onChange={(_, value) => setDeliveryRating(value)}
                    size="large"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Rate the speed, packaging, and delivery partner
                  </Typography>
                </Box>
              </Box>

              {/* Written Review */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ThumbUp />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    Write a review
                  </Typography>
                </Box>
                <Box sx={{ ml: 6 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Tell us about your experience... What did you like? What could be better?"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Photo Upload */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Add Photos
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {images.map((image, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={image}
                            alt={`Review ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' },
                            }}
                            onClick={() => handleRemoveImage(index)}
                          >
                            ×
                          </IconButton>
                        </Box>
                      ))}
                      
                      <Button
                        component="label"
                        variant="outlined"
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          border: '2px dashed',
                        }}
                      >
                        <PhotoCamera />
                        <Typography variant="caption">Add</Typography>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          onChange={handleImageUpload}
                        />
                      </Button>
                    </Box>
                  </Box>

                  {/* Anonymous Switch */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                      variant={isAnonymous ? 'contained' : 'outlined'}
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      size="small"
                    >
                      {isAnonymous ? '✓ Posting Anonymously' : 'Post Anonymously'}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Your name won't be shown with this review
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Would you recommend? */}
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Would you recommend this restaurant?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={recommendation === true ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<ThumbUp />}
                    onClick={() => setRecommendation(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={recommendation === false ? 'contained' : 'outlined'}
                    color="error"
                    startIcon={<ThumbDown />}
                    onClick={() => setRecommendation(false)}
                  >
                    No
                  </Button>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Your Order
            </Typography>

            {/* Restaurant Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop" />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Spice Garden
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Indian • North Indian
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Ordered Items */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Items Ordered
            </Typography>
            <Stack spacing={1} sx={{ mb: 3 }}>
              {['Butter Chicken', 'Garlic Naan', 'Veg Biryani'].map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{item}</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {index === 0 ? '1x' : index === 1 ? '2x' : '1x'}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Delivery Info */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Delivery Details
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Delivered on Jan 15, 2024 at 7:30 PM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Delivery Partner: Rahul Sharma
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Tips */}
            <Alert severity="info" sx={{ mb: 3 }}>
              Your honest review helps other foodies make better choices!
            </Alert>

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmitReview}
              disabled={!foodRating || !deliveryRating}
              sx={{ borderRadius: 2 }}
            >
              Submit Review
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderReview;