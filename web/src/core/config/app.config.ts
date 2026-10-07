import { z } from 'zod';
import type { LogLevel } from "../dev/logger";

// 1. Zod schema for environment validation
const envSchema = z.object({
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  VITE_API_URL: z.string().url().or(z.string().startsWith('/')).default('/api'),
  VITE_DATA_SOURCE: z.enum(['mock', 'api']).default('mock'),
  VITE_DEV_BYPASS_AUTH: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  VITE_SENTRY_DSN: z.string().optional().default(''),
  VITE_SOCKET_URL: z.string().url().or(z.string().length(0).transform(() => undefined)).optional(),

  VITE_LOGGER_MAX_LOGS: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_LOGGER_PERSIST_LOGS: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).optional(),
  VITE_LOGGER_ENABLE_STACK_TRACE: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_ENABLE_TIMESTAMPS: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_CONSOLE_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_RENDER_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_ROUTE_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_REDUX_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  VITE_LOGGER_API_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
});

const rawEnv = {
  MODE: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_DATA_SOURCE: import.meta.env.VITE_DATA_SOURCE,
  VITE_DEV_BYPASS_AUTH: import.meta.env.VITE_DEV_BYPASS_AUTH,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_LOGGER_MAX_LOGS: import.meta.env.VITE_LOGGER_MAX_LOGS,
  VITE_LOGGER_PERSIST_LOGS: import.meta.env.VITE_LOGGER_PERSIST_LOGS,
  VITE_LOGGER_LEVEL: import.meta.env.VITE_LOGGER_LEVEL,
  VITE_LOGGER_ENABLE_STACK_TRACE: import.meta.env.VITE_LOGGER_ENABLE_STACK_TRACE,
  VITE_LOGGER_ENABLE_TIMESTAMPS: import.meta.env.VITE_LOGGER_ENABLE_TIMESTAMPS,
  VITE_LOGGER_CONSOLE_ENABLED: import.meta.env.VITE_LOGGER_CONSOLE_ENABLED,
  VITE_LOGGER_RENDER_ENABLED: import.meta.env.VITE_LOGGER_RENDER_ENABLED,
  VITE_LOGGER_ROUTE_ENABLED: import.meta.env.VITE_LOGGER_ROUTE_ENABLED,
  VITE_LOGGER_REDUX_ENABLED: import.meta.env.VITE_LOGGER_REDUX_ENABLED,
  VITE_LOGGER_API_ENABLED: import.meta.env.VITE_LOGGER_API_ENABLED,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment configuration.");
}

const env = parsed.data;

export const IS_DEV = env.MODE === 'development';
export const IS_PROD = env.MODE === 'production';
export const IS_TEST = env.MODE === 'test';

const resolveDataSource = (): 'mock' | 'api' => {
  if (IS_DEV && typeof window !== 'undefined') {
    const local = localStorage.getItem('DEV_DATA_SOURCE');
    if (local === 'mock' || local === 'api') return local;
  }
  return env.VITE_DATA_SOURCE;
};

export const appConfig = {
  environment: env.MODE,
  isDev: IS_DEV,
  isProd: IS_PROD,
  isTest: IS_TEST,
  features: {
    analytics: IS_PROD,
  },
  api: {
    baseUrl: env.VITE_API_URL,
    socketUrl: env.VITE_SOCKET_URL,
    dataSource: resolveDataSource(),
  },
  security: {
    sentryDsn: env.VITE_SENTRY_DSN,
  },
  dev: {
    // SECURITY WARNING: MUST BE FALSE IN PRODUCTION
    bypassAuth: IS_DEV && env.VITE_DEV_BYPASS_AUTH,
    logger: {
      maxLogs: env.VITE_LOGGER_MAX_LOGS ?? 1000,
      persistLogs: env.VITE_LOGGER_PERSIST_LOGS ?? false,
      logLevel: (env.VITE_LOGGER_LEVEL ?? 'DEBUG') as LogLevel,
      enableStackTrace: env.VITE_LOGGER_ENABLE_STACK_TRACE ?? false,
      enableTimestamps: env.VITE_LOGGER_ENABLE_TIMESTAMPS ?? false,
      consoleLoggingEnabled: env.VITE_LOGGER_CONSOLE_ENABLED ?? false,
      renderLoggingEnabled: env.VITE_LOGGER_RENDER_ENABLED ?? false,
      routeTrackingEnabled: env.VITE_LOGGER_ROUTE_ENABLED ?? false,
      reduxLoggingEnabled: env.VITE_LOGGER_REDUX_ENABLED ?? false,
      apiLoggingEnabled: env.VITE_LOGGER_API_ENABLED ?? false,
    }
  }
} as const;

export type AppConfig = typeof appConfig;

if (IS_DEV) {
  console.table({
    "API URL": appConfig.api.baseUrl,
    "Data Source": appConfig.api.dataSource,
    "Bypass Auth": appConfig.dev.bypassAuth,
    "Log Level": appConfig.dev.logger.logLevel
  });
  console.dir({
    'logger-config': appConfig.dev.logger,
    'App Config': appConfig,
  }, { depth: 1 });
}
