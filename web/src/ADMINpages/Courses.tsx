import React, { useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Pagination,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Search, FilterList, Sort } from '@mui/icons-material';
import CourseCard from '../components/ui/CourseCard';
import { type Course } from '../types';
import { COURSE_CATEGORIES, DIFFICULTY_LEVELS } from '../constants';

// Mock courses data
const mockCourses: Course[] = [
  // Add 8-10 mock courses here
  {
    id: '1',
    title: 'React Fundamentals',
    description: 'Master React with modern best practices',
    progress: 0,
    totalLessons: 15,
    completedLessons: 0,
    category: 'Frontend',
    level: 'beginner',
    duration: 20,
    rating: 4.8,
  },
  // ... more courses
];

const Courses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficulty(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      category === 'all' || course.category === category;
    const matchesDifficulty =
      difficulty === 'all' || course.level === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          All Courses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore our collection of courses to boost your skills
        </Typography>
      </Box>

      {/* Filters & Search */}
      <Card sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search courses..."
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
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={handleCategoryChange}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Categories</MenuItem>
                {COURSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={handleDifficultyChange}
              >
                <MenuItem value="all">All Levels</MenuItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={handleSortChange}
                startAdornment={
                  <InputAdornment position="start">
                    <Sort fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="duration">Duration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Courses Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredCourses.map((course) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
            <CourseCard
              course={course}
              onEnroll={(id) => console.log('Enroll:', id)}
              onView={(id) => console.log('View:', id)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={5}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>
    </Container>
  );
};

export default Courses;