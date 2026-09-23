import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Rating,
  TextField,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { ArrowBack, Restaurant, LocalShipping } from '@mui/icons-material';
import { useAppDispatch } from '../../app/hooks';
import { submitReviewThunk, updateOrderStatusLocally } from '../../features/orders/orderSlice';

const OrderReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [restaurantRating, setRestaurantRating] = useState<number | null>(0);
  const [partnerRating, setPartnerRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!restaurantRating || !partnerRating || !id) return;
    
    try {
      setSubmitting(true);
      await dispatch(submitReviewThunk({ 
        orderId: id, 
        restaurantRating, 
        partnerRating, 
        comment 
      })).unwrap();
      
      // Update locally to skip another fetch
      dispatch(updateOrderStatusLocally({ orderId: id, status: 'reviewed' }));
      
      navigate('/orders');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
      setSubmitting(false);
    }
  };

  const isFormValid = restaurantRating && partnerRating && restaurantRating > 0 && partnerRating > 0;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Rate your experience
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Restaurant sx={{ mr: 1, verticalAlign: 'middle' }} />
          How was the food?
        </Typography>
        <Rating
          name="restaurant-rating"
          value={restaurantRating}
          onChange={(_, newValue) => setRestaurantRating(newValue)}
          size="large"
          sx={{ mb: 4 }}
        />
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
          How was the delivery?
        </Typography>
        <Rating
          name="partner-rating"
          value={partnerRating}
          onChange={(_, newValue) => setPartnerRating(newValue)}
          size="large"
          sx={{ mb: 4 }}
        />
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Additional Comments
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="What did you like or dislike?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mb: 4 }}
        />
        
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!isFormValid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Paper>
    </Container>
  );
};

export default OrderReview;