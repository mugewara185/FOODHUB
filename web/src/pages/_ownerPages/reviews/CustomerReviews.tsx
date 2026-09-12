import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Rating, LinearProgress,
  Avatar, TextField, InputAdornment, Stack, Chip, Button, IconButton,
  Menu, MenuItem, ListItemIcon, ListItemText, Divider, Alert, CircularProgress
} from '@mui/material';
import {
  Search, ThumbUp, ThumbDown, MoreVert, Reply, Flag, Warning
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../core/hooks';
import { fetchOwnerData } from '../../../features/owner/store/ownerSlice';

const CustomerReviews: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reviews, analytics, status, error } = useAppSelector((state: any) => state.owner);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchOwnerData());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  if (status === 'failed') {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  const getPercentage = (count: number) => {
    if (!reviews.length) return 0;
    return (count / reviews.length) * 100;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reviewId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(reviewId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReview(null);
  };

  const filteredReviews = reviews.filter((r: any) => 
    r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>Customer Reviews</Typography>
        <Typography variant="body1" color="text.secondary">See what customers are saying about your restaurant</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" fontWeight={800}>{analytics?.averageRating.toFixed(1)}</Typography>
            <Rating value={analytics?.averageRating} readOnly precision={0.1} size="large" />
            <Typography variant="body2" color="text.secondary">Based on {reviews.length} reviews</Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r: any) => Math.round(r.rating) === star).length;
              return (
                <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>{star} ⭐</Typography>
                  <LinearProgress variant="determinate" value={getPercentage(count)} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>{count}</Typography>
                </Box>
              );
            })}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
      </Paper>

      <Stack spacing={3}>
        {filteredReviews.map((review: any) => (
          <Card key={review.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={review.userAvatar} sx={{ width: 48, height: 48 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{review.userName}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">{new Date(review.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={(e) => handleMenuOpen(e, review.id)}>
                  <MoreVert />
                </IconButton>
              </Box>

              <Typography variant="body1" paragraph>{review.comment}</Typography>

              {review.images && review.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {review.images.map((img: string, index: number) => (
                    <Box key={index} component="img" src={img} sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }} />
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip icon={<ThumbUp />} label={review.helpful || 0} size="small" variant="outlined" />
                <Chip icon={<ThumbDown />} label={review.unhelpful || 0} size="small" variant="outlined" />
              </Box>

              <Button startIcon={<Reply />}>Reply to Review</Button>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Reply fontSize="small" /></ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Flag fontSize="small" /></ListItemIcon>
          <ListItemText>Report Review</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomerReviews;