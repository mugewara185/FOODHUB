// App constants
export const APP_NAME = 'LearnHub';
export const APP_VERSION = '1.0.0';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    PROGRESS: (id: string) => `/courses/${id}/progress`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
  },
  LESSONS: {
    LIST: (courseId: string) => `/courses/${courseId}/lessons`,
    DETAIL: (courseId: string, lessonId: string) => 
      `/courses/${courseId}/lessons/${lessonId}`,
    COMPLETE: (courseId: string, lessonId: string) =>
      `/courses/${courseId}/lessons/${lessonId}/complete`,
  },
  USER: {
    PROGRESS: '/user/progress',
    ACHIEVEMENTS: '/user/achievements',
    ACTIVITY: '/user/activity',
  },
};

// Local Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
};

// Route paths
export const ROUTE_PATHS = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  LESSON: (courseId: string, lessonId: string) => 
    `/courses/${courseId}/lessons/${lessonId}`,
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
  NOT_FOUND: '/404',
};

// Course categories
export const COURSE_CATEGORIES = [
  'Frontend',
  'Backend',
  'Full Stack',
  'DevOps',
  'Mobile',
  'Data Science',
  'UI/UX',
  'Testing',
] as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'success' },
  { value: 'intermediate', label: 'Intermediate', color: 'warning' },
  { value: 'advanced', label: 'Advanced', color: 'error' },
] as const;

// Mock data (for development)
export const MOCK_DATA = {
  USER: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user' as const,
    avatar: 'https://i.pravatar.cc/300',
  },
};