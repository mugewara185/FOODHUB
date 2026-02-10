import React from 'react';
import {
  Grid,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  AvatarGroup,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  School,
  CheckCircle,
  Schedule,
  Add,
  ArrowForward,
} from '@mui/icons-material';
import StatCard from '../components/ui/StatCard';
import CourseCard from '../components/ui/CourseCard';
import { type Course } from '../types';
import { MOCK_DATA } from '../constants';

// Mock data for dashboard
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'React Fundamentals',
    description: 'Learn React from scratch with hands-on projects',
    progress: 85,
    totalLessons: 12,
    completedLessons: 10,
    category: 'Frontend',
    level: 'beginner',
    duration: 12,
    rating: 4.8,
  },
  {
    id: '2',
    title: 'TypeScript Mastery',
    description: 'Master TypeScript for better JavaScript development',
    progress: 60,
    totalLessons: 18,
    completedLessons: 11,
    category: 'Language',
    level: 'intermediate',
    duration: 16,
    rating: 4.9,
  },
  {
    id: '3',
    title: 'Material-UI Design',
    description: 'Build beautiful UIs with Material-UI and React',
    progress: 45,
    totalLessons: 10,
    completedLessons: 4,
    category: 'UI/UX',
    level: 'intermediate',
    duration: 8,
    rating: 4.7,
  },
  {
    id: '4',
    title: 'Node.js Backend',
    description: 'Build scalable backend services with Node.js',
    progress: 30,
    totalLessons: 15,
    completedLessons: 5,
    category: 'Backend',
    level: 'advanced',
    duration: 20,
    rating: 4.6,
  },
];

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Courses',
      value: '12',
      icon: <School />,
      color: 'primary' as const,
      progress: 75,
      change: 12,
    },
    {
      title: 'Completed',
      value: '8',
      icon: <CheckCircle />,
      color: 'success' as const,
      progress: 100,
      change: 8,
    },
    {
      title: 'In Progress',
      value: '4',
      icon: <Schedule />,
      color: 'warning' as const,
      progress: 50,
      change: -2,
    },
    {
      title: 'Learning Streak',
      value: '15 days',
      icon: <TrendingUp />,
      color: 'info' as const,
      change: 25,
    },
  ];

  const handleEnroll = (courseId: string) => {
    console.log('Enroll in course:', courseId);
  };

  const handleViewCourse = (courseId: string) => {
    console.log('View course:', courseId);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {MOCK_DATA.USER.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Continue your learning journey. You're doing great!
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Courses */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Continue Learning
                </Typography>
                <Button endIcon={<ArrowForward />} size="small">
                  View All
                </Button>
              </Box>

              <Grid container spacing={3}>
                {mockCourses.map((course) => (
                  <Grid item xs={12} sm={6} key={course.id}>
                    <CourseCard
                      course={course}
                      onEnroll={handleEnroll}
                      onView={handleViewCourse}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Activity
              </Typography>
              <Stack spacing={2}>
                {[
                  { user: 'Alex', action: 'completed React Hooks lesson' },
                  { user: 'Maria', action: 'shared a resource' },
                  { user: 'David', action: 'earned a new badge' },
                ].map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                      {activity.user[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {activity.user}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.action}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 'auto' }}
                    >
                      2h ago
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Quick Actions & Progress */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button variant="contained" fullWidth startIcon={<Add />}>
                  New Course
                </Button>
                <Button variant="outlined" fullWidth>
                  Take Quiz
                </Button>
                <Button variant="outlined" fullWidth>
                  View Progress
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Top Learners
              </Typography>
              <AvatarGroup max={4} sx={{ justifyContent: 'center', mb: 2 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />
                <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />
                <Avatar alt="Cindy Baker" src="/static/images/avatar/3.jpg" />
                <Avatar alt="Agnes Walker" src="/static/images/avatar/4.jpg" />
                <Avatar alt="Trevor Henderson" src="/static/images/avatar/5.jpg" />
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary" align="center">
                Join the community of 1,000+ active learners
              </Typography>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Weekly Progress
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" color="primary.main" fontWeight={700}>
                  78%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion Rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;