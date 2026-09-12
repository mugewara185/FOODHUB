// Determine environment
export const IS_DEV = import.meta.env.MODE === 'development';
export const IS_PROD = import.meta.env.MODE === 'production';

// Application wide configuration
export const APP_CONFIG = {
  // DEV ONLY: Bypasses authentication checks for rapid UI development
  // WARNING: MUST BE FALSE IN PRODUCTION!
  DEV_BYPASS_AUTH: import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' && IS_DEV
  // && false
  ,

  // Analytics and tracking
  enableAnalytics: IS_PROD,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,

  // --- Restaurant (and future feature) data source ---
  // 'mock' = local factory data, no backend needed
  // 'api'  = real backend API calls
  DATA_SOURCE: (import.meta.env.VITE_DATA_SOURCE || 'mock') as 'mock' | 'api',

  // Backend API base URL (used in API mode)
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};
console.log({ APP_CONFIG })

