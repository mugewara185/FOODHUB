// Common types used throughout the app  
// Common types used throughout the app
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'instructor';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  rating: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  completed: boolean;
  content: string;
  videoUrl?: string;
  resources?: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link' | 'code';
  url: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Component Props types
export type ButtonVariant = 'text' | 'contained' | 'outlined';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

// Theme types
export type ThemeMode = 'light' | 'dark';