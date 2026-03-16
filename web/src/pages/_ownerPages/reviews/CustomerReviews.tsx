import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Star,
  ThumbUp,
  ThumbDown,
  Reply,
  Flag,
  MoreVert,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

interface Review {
  id: string;
  customer: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  dislikes: number;
  reply?: string;
  images?: string[];
  reported: boolean;
}

const mockReviews: Review[] = [
  {
    id: '1',
    customer: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    comment: 'Amazing food! The butter chicken was delicious and the service was excellent. Will definitely order again.',
    date: '2024-01-15',
    likes: 12,
    dislikes: 1,
    reply: 'Thank you for your kind words, John! We're glad you enjoyed your meal.',
    images: ['image1.jpg', 'image2.jpg'],
    reported: false,
  },
  {
    id: '2',
    customer: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=2',
    rating: 4,
    comment: 'Good food but delivery was a bit late. The biryani was tasty though.',
    date: '2024-01-14',
    likes: 8,
    dislikes: 2,
    reported: false,
  },
  {
    id: '3',
    customer: 'Mike Johnson',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 2,
    comment: 'Disappointed with the quality. The food was cold and not as expected.',
    date: '2024-01-13',
    likes: 3,
    dislikes: 5,
    reported: true,
  },
];

const CustomerReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [replyDialog, setReplyDialog] = useState(false);

  const stats = {
    average: 4.2,
    total: reviews.length,
    fiveStar: reviews.filter(r => r.rating === 5).length,
    fourStar: reviews.filter(r => r.rating === 4).length,
    threeStar: reviews.filter(r => r.rating === 3).length,
    twoStar: reviews.filter(r => r.rating === 2).length,
    oneStar: reviews.filter(r => r.rating === 1).length,
    reported: reviews.filter(r => r.reported).length,
  };

  const getPercentage = (count: number) => (count / stats.total) * 100;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reviewId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(reviewId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReview(null);
  };

  const handleReply = (reviewId: string) => {
    // Open reply dialog
    handleMenuClose();
  };

  const handleReport = (reviewId: string) => {
    // Report review
    handleMenuClose();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Customer Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary">
          See what customers are saying about your restaurant
        </Typography>
      </Box>

      {/* Rating Summary */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" fontWeight={800}>
              {stats.average.toFixed(1)}
            </Typography>
            <Rating value={stats.average} readOnly precision={0.1} size="large" />
            <Typography variant="body2" color="text.secondary">
              Based on {stats.total} reviews
            </Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats[`${star}Star` as keyof typeof stats] as number;
              return (
                <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {star} ★
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getPercentage(count)}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                    {count}
                  </Typography>
                </Box>
              );
            })}
          </Grid>
        </Grid>
      </Paper>

      {/* Reported Reviews Alert */}
      {stats.reported > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          {stats.reported} reviews have been reported and need attention.
        </Alert>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Reviews List */}
      <Stack spacing={3}>
        {reviews.map((review) => (
          <Card key={review.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={review.avatar} sx={{ width: 48, height: 48 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {review.customer}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={(e) => handleMenuOpen(e, review.id)}>
                  <MoreVert />
                </IconButton>
              </Box>

              {/* Review Text */}
              <Typography variant="body1" paragraph>
                {review.comment}
              </Typography>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {review.images.map((img, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        bgcolor: 'grey.200',
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Helpful Count */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  icon={<ThumbUp />}
                  label={review.likes}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<ThumbDown />}
                  label={review.dislikes}
                  size="small"
                  variant="outlined"
                />
                {review.reported && (
                  <Chip
                    icon={<Flag />}
                    label="Reported"
                    color="error"
                    size="small"
                  />
                )}
              </Box>

              {/* Reply */}
              {review.reply ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Reply fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Your Reply
                    </Typography>
                  </Box>
                  <Typography variant="body2">{review.reply}</Typography>
                </Paper>
              ) : (
                <Button
                  startIcon={<Reply />}
                  onClick={() => handleReply(review.id)}
                >
                  Reply to Review
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleReply(selectedReview!)}>
          <ListItemIcon><Reply fontSize="small" /></ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleReport(selectedReview!)}>
          <ListItemIcon><Flag fontSize="small" /></ListItemIcon>
          <ListItemText>Report Review</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ color: 'error.main' }}>
          <ListItemIcon><Warning fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Hide Review</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomerReviews;