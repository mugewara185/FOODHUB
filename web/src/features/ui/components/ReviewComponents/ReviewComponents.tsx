import React from 'react';
import {
  Box,
  Paper,
  Card,
  CardContent,
  Avatar,
  Rating,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';

export interface ReviewItem {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewStatsProps {
  averageRating: number;
  totalReviews?: number;
}

export interface ReviewCardProps {
  review: ReviewItem;
  sx?: SxProps<Theme>;
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({
  averageRating,
  totalReviews,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center', minWidth: 100 }}>
            <Typography variant="h2" color="primary.main" fontWeight={800}>
              {averageRating.toFixed(1)}
            </Typography>
            <Rating value={averageRating} readOnly precision={0.5} />
            {totalReviews && (
              <Typography variant="body2" color="text.secondary">
                Based on {totalReviews}+ reviews
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            {[5, 4, 3, 2, 1].map((star) => (
              <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 30 }}>
                  {star} ★
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 4,
                    mx: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${(star / 5) * 100}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, sx }) => {
  return (
    <Card sx={sx}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={review.userAvatar}>{review.userName.charAt(0)}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {review.userName}
              </Typography>
              <Rating value={review.rating} readOnly size="small" />
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(review.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Typography variant="body1">{review.comment}</Typography>
      </CardContent>
    </Card>
  );
};
