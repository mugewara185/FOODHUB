export type { NavigateFunction } from 'react-router-dom';
// ============================================================================
// RE-EXPORTS FROM CORE TYPES (Single source of truth)
// ============================================================================
export {
  // User & Auth
  type User,
  type AuthUser,
  type UserRole,
  type Permission,

  // Restaurant & Location
  type Restaurant,
  type Coordinates,
  type OpeningHours,
  type ContactInfo,

  // Food Items
  type FoodItem,
  type MenuItem,
  type Category,
  type Addon,
  type Variant,
  type DietaryInfo,

  // Cart
  type Cart,
  type CartItem,
  type CustomizedCartItem,

  // Orders
  type Order,  

  type OrderItem,
  type DeliveryInfo,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,

  // Reviews
  type Review,

  // Delivery & Logistics
  type DeliveryPartner,
  type LiveTracking,

  // Factory Interfaces
  type FactoryInput,
  type RestaurantFactoryInput,
  type FoodItemFactoryInput,
  type UserFactoryInput,
  type OrderFactoryInput,
  type ReviewFactoryInput,
} from '@core/types';

// ============================================================================
// UI & COMPONENT PROP TYPES (Specific to UI layer)
// ============================================================================

// Button styling
export type ButtonVariant = 'text' | 'contained' | 'outlined';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

// Theme
export type ThemeMode = 'light' | 'dark';

// ============================================================================
// API RESPONSE WRAPPER TYPES
// ============================================================================

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

// ============================================================================
// DEPRECATED / UNUSED (Commented out - kept for reference)
// ============================================================================
/*
// These types were for a different feature (courseware/learning)
// They are NOT used in the current food delivery app

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
*/