import type { LogLevel } from "../dev/logger";

// Determine environment
export const IS_DEV = import.meta.env.MODE === 'development';
export const IS_PROD = import.meta.env.MODE === 'production';

//types:
// const LOG_LEVELS: Record<LogLevel, number> = {
//   DEBUG: 0,
//   INFO: 1,
//   WARN: 2,
//   ERROR: 3,
//   CRITICAL: 4,
// };

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
  API_URL: import.meta.env.VITE_API_URL || '/api',

  Logger_Config: {
    maxLogs: 1000,
    persistLogs: false,
    logLevel: 'DEBUG',
    enableStackTrace: false,
    enableTimestamps: false,
    consoleLoggingEnabled: false,
    renderLoggingEnabled: false,
    routeTrackingEnabled: false,
    reduxLoggingEnabled: false,
    apiLoggingEnabled: false,
  }
};

// --- logger config (dev only) ---
export const LOGGER_CONFIG = {
  maxLogs: import.meta.env.VITE_LOGGER_MAX_LOGS || APP_CONFIG.Logger_Config.maxLogs,
  persistLogs: import.meta.env.VITE_LOGGER_PERSIST_LOGS || APP_CONFIG.Logger_Config.persistLogs,
  logLevel: (import.meta.env.VITE_LOGGER_LEVEL || APP_CONFIG.Logger_Config.logLevel) as LogLevel,
  enableStackTrace: import.meta.env.VITE_LOGGER_ENABLE_STACK_TRACE || APP_CONFIG.Logger_Config.enableStackTrace,
  enableTimestamps: import.meta.env.VITE_LOGGER_ENABLE_TIMESTAMPS || APP_CONFIG.Logger_Config.enableTimestamps,
  consoleLoggingEnabled: import.meta.env.VITE_LOGGER_CONSOLE_ENABLED || APP_CONFIG.Logger_Config.consoleLoggingEnabled,
  renderLoggingEnabled: import.meta.env.VITE_LOGGER_RENDER_ENABLED || APP_CONFIG.Logger_Config.renderLoggingEnabled,
  routeTrackingEnabled: import.meta.env.VITE_LOGGER_ROUTE_ENABLED || APP_CONFIG.Logger_Config.routeTrackingEnabled,
  reduxLoggingEnabled: import.meta.env.VITE_LOGGER_REDUX_ENABLED || APP_CONFIG.Logger_Config.reduxLoggingEnabled,
  apiLoggingEnabled: import.meta.env.VITE_LOGGER_API_ENABLED || APP_CONFIG.Logger_Config.apiLoggingEnabled,
};

// Log config can only be changed during development
if (IS_DEV) {
  const { Logger_Config, ...APP_CONFIG_FLAT } = APP_CONFIG;

  console.table({
    ...APP_CONFIG_FLAT,
    ...LOGGER_CONFIG
  });
}
