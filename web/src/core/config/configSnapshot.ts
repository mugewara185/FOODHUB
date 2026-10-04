import { appConfig, IS_DEV } from './app.config';

/**
 * A strictly allowlisted subset of the application configuration 
 * deemed safe for developer inspection.
 * 
 * SECURITY WARNING: 
 * NEVER add JWT secrets, backend keys, database passwords, or 
 * raw environment variables to this interface.
 */
export interface DevConfigSnapshot {
  environment: {
    mode: string;
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
  };
  api: {
    baseUrl: string;
    socketUrl: string | undefined;
    dataSource: 'mock' | 'api';
    dataSourceOrigin: 'environment' | 'development override';
  };
  dev: {
    bypassAuth: boolean;
    logger: {
      logLevel: string;
      maxLogs: number;
      persistLogs: boolean;
      enableStackTrace: boolean;
      enableTimestamps: boolean;
      consoleLoggingEnabled: boolean;
      renderLoggingEnabled: boolean;
      routeTrackingEnabled: boolean;
      reduxLoggingEnabled: boolean;
      apiLoggingEnabled: boolean;
    };
  };
}

export const getSanitizedConfigSnapshot = (): DevConfigSnapshot => {
  // Determine if the data source was overridden by a developer via localStorage
  let dataSourceOrigin: 'environment' | 'development override' = 'environment';
  
  if (IS_DEV && typeof window !== 'undefined') {
    const local = localStorage.getItem('DEV_DATA_SOURCE');
    if (local === 'mock' || local === 'api') {
      dataSourceOrigin = 'development override';
    }
  }

  // Explicitly construct the snapshot to avoid accidental leak of future sensitive fields
  return {
    environment: {
      mode: appConfig.environment,
      isDev: appConfig.isDev,
      isProd: appConfig.isProd,
      isTest: appConfig.isTest,
    },
    api: {
      baseUrl: appConfig.api.baseUrl,
      socketUrl: appConfig.api.socketUrl,
      dataSource: appConfig.api.dataSource,
      dataSourceOrigin,
    },
    dev: {
      bypassAuth: appConfig.dev.bypassAuth,
      logger: {
        logLevel: appConfig.dev.logger.logLevel,
        maxLogs: appConfig.dev.logger.maxLogs,
        persistLogs: appConfig.dev.logger.persistLogs,
        enableStackTrace: appConfig.dev.logger.enableStackTrace,
        enableTimestamps: appConfig.dev.logger.enableTimestamps,
        consoleLoggingEnabled: appConfig.dev.logger.consoleLoggingEnabled,
        renderLoggingEnabled: appConfig.dev.logger.renderLoggingEnabled,
        routeTrackingEnabled: appConfig.dev.logger.routeTrackingEnabled,
        reduxLoggingEnabled: appConfig.dev.logger.reduxLoggingEnabled,
        apiLoggingEnabled: appConfig.dev.logger.apiLoggingEnabled,
      }
    }
  };
};
