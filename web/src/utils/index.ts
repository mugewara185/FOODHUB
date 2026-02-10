// Utility functions
import { type Course } from '../types';

/**
 * Format time in minutes to readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Calculate course progress percentage
 */
export const calculateProgress = (
  completed: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (
  progress: number
): 'success' | 'primary' | 'warning' | 'error' => {
  if (progress >= 80) return 'success';
  if (progress >= 50) return 'primary';
  if (progress >= 30) return 'warning';
  return 'error';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (
  text: string,
  maxLength: number
): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Generate avatar placeholder
 */
export const getAvatarPlaceholder = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Sort courses by progress
 */
export const sortCoursesByProgress = (courses: Course[]): Course[] => {
  return [...courses].sort((a, b) => b.progress - a.progress);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};