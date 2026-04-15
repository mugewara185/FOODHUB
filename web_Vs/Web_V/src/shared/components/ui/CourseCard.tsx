import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  LinearProgress,
  Button,
  CardActions,
} from '@mui/material';
import { PlayCircle, Schedule, CheckCircle } from '@mui/icons-material';
import { type Course } from '../../../data/types';
import { formatDuration, getProgressColor } from '../../../core/utils';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll, onView }) => {
  const progressColor = getProgressColor(course.progress);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardMedia
        component="img"
        height="140"
        image={`https://source.unsplash.com/random/400x200?${course.category}`}
        alt={course.title}
        sx={{ objectFit: 'cover' }}
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip
            label={course.category}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={course.level}
            size="small"
            color={course.level === 'beginner' ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        <Typography gutterBottom variant="h6" component="div" noWrap>
          {course.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Schedule fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDuration(course.duration * 60)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            ⭐ {course.rating.toFixed(1)}
          </Typography>
        </Box>

        {course.progress > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {course.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={course.progress}
              color={progressColor}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {course.progress === 0 ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={<PlayCircle />}
            onClick={() => onEnroll?.(course.id)}
          >
            Enroll Now
          </Button>
        ) : (
          <Button
            fullWidth
            variant={course.progress === 100 ? 'outlined' : 'contained'}
            startIcon={course.progress === 100 ? <CheckCircle /> : <PlayCircle />}
            onClick={() => onView?.(course.id)}
          >
            {course.progress === 100 ? 'Completed' : 'Continue'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default CourseCard;