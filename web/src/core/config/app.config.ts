// Determine environment
export const IS_DEV = import.meta.env.MODE === 'development';
export const IS_PROD = import.meta.env.MODE === 'production';

// Application wide configuration
export const APP_CONFIG = {
  // DEV ONLY: Bypasses authentication checks for rapid UI development
  // WARNING: MUST BE FALSE IN PRODUCTION!
  DEV_BYPASS_AUTH: true && IS_DEV,

  // Analytics and tracking
  enableAnalytics: IS_PROD,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
};
console.log({ APP_CONFIG })
