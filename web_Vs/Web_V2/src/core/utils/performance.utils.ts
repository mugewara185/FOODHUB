// import { lazy, type ComponentType } from 'react';

// // Lazy load with retry mechanism
// export function lazyLoad<T extends ComponentType<any>>(
//   importFn: () => Promise<{ default: T }>,
//   retryCount = 3
// ) {
//   return lazy(() =>
//     importFn().catch((error) => {
//       if (retryCount > 0) {
//         console.warn(`Retrying import, ${retryCount} attempts left`);
//         return lazyLoad(importFn, retryCount - 1);
//       }
//       throw error;
//     })
//   );
// }

// // Debounce function for performance
// export function debounce<T extends (...args: any[]) => any>(
//   func: T,
//   wait: number
// ): (...args: Parameters<T>) => void {
//   let timeout: NodeJS.Timeout;
//   return (...args: Parameters<T>) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// }

// // Throttle function for performance
// export function throttle<T extends (...args: any[]) => any>(
//   func: T,
//   limit: number
// ): (...args: Parameters<T>) => void {
//   let inThrottle: boolean;
//   return (...args: Parameters<T>) => {
//     if (!inThrottle) {
//       func(...args);
//       inThrottle = true;
//       setTimeout(() => (inThrottle = false), limit);
//     }
//   };
// }

// // Memoize expensive calculations
// export function memoize<T extends (...args: any[]) => any>(
//   func: T,
//   resolver?: (...args: Parameters<T>) => string
// ): T {
//   const cache = new Map();
//   return ((...args: Parameters<T>) => {
//     const key = resolver ? resolver(...args) : JSON.stringify(args);
//     if (cache.has(key)) {
//       return cache.get(key);
//     }
//     const result = func(...args);
//     cache.set(key, result);
//     return result;
//   }) as T;
// }

// // Intersection Observer for lazy loading
// export function createIntersectionObserver(
//   callback: (entry: IntersectionObserverEntry) => void,
//   options?: IntersectionObserverInit
// ) {
//   return new IntersectionObserver(
//     (entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           callback(entry);
//         }
//       });
//     },
//     options
//   );
// }