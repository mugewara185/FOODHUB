import { logger } from './Logger';

/**
 * API request/response logging helper
 */
export const logAPI = {
  request: (endpoint: string, method: string, data?: unknown) => {
    logger.debug('API', `[REQUEST] ${method} ${endpoint}`, data, 'API');
  },

  response: (endpoint: string, status: number, data?: unknown) => {
    const level = status >= 400 ? 'warn' : 'info';
    logger[level]('API', `[RESPONSE] ${status} ${endpoint}`, data, 'API');
  },

  error: (endpoint: string, error: unknown) => {
    logger.error('API', `[ERROR] ${endpoint}`, error, 'API');
  },
};

/**
 * Redux action logging helper
 */
export const logRedux = {
  action: (actionType: string, payload?: unknown) => {
    logger.debug('REDUX', `[ACTION] ${actionType}`, payload, 'Redux');
  },

  state: (sliceName: string, newState: unknown) => {
    logger.debug('REDUX', `[STATE] ${sliceName}`, newState, 'Redux');
  },

  dispatch: (actionType: string) => {
    logger.info('REDUX', `[DISPATCH] ${actionType}`, undefined, 'Redux');
  },
};

/**
 * Component lifecycle logging
 */
export const logComponent = {
  mount: (componentName: string) => {
    logger.debug('COMPONENT', `[MOUNT] ${componentName}`, undefined, componentName);
  },

  unmount: (componentName: string) => {
    logger.debug('COMPONENT', `[UNMOUNT] ${componentName}`, undefined, componentName);
  },

  render: (componentName: string, props?: unknown) => {
    logger.debug('COMPONENT', `[RENDER] ${componentName}`, props, componentName);
  },

  effect: (componentName: string, effectName: string) => {
    logger.debug('COMPONENT', `[EFFECT] ${componentName} - ${effectName}`, undefined, componentName);
  },

  error: (componentName: string, error: unknown) => {
    logger.error('COMPONENT', `[ERROR] ${componentName}`, error, componentName);
  },
};

/**
 * Performance logging
 */
export const logPerformance = {
  start: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-start`);
    }
  },

  end: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-end`);
      try {
        window.performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = window.performance.getEntriesByName(label)[0];
        logger.info('PERFORMANCE', `[MEASURE] ${label}`, { duration: measure.duration }, 'Performance');
      } catch (e) {
        logger.warn('PERFORMANCE', `[ERROR] Failed to measure ${label}`, e, 'Performance');
      }
    }
  },

  navigation: (route: string) => {
    logger.info('PERFORMANCE', `[NAVIGATION] ${route}`, undefined, 'Navigation');
  },
};

/**
 * Authentication logging
 */
export const logAuth = {
  login: (userId: string, method: string) => {
    logger.info('AUTH', `[LOGIN] User: ${userId}, Method: ${method}`, undefined, 'Auth');
  },

  logout: (userId: string) => {
    logger.info('AUTH', `[LOGOUT] User: ${userId}`, undefined, 'Auth');
  },

  error: (message: string, error?: unknown) => {
    logger.error('AUTH', `[ERROR] ${message}`, error, 'Auth');
  },

  token: (action: string, token?: string) => {
    logger.debug('AUTH', `[TOKEN] ${action}`, { tokenExists: !!token }, 'Auth');
  },
};

/**
 * Error tracking with context
 */
export const logError = (
  category: string,
  error: unknown,
  context?: Record<string, unknown>,
  source?: string
) => {
  const errorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof Error ? error.constructor.name : typeof error,
    context,
  };

  logger.error(category, `[ERROR] ${errorData.message}`, errorData, source);
};

/**
 * Warning with threshold
 */
export const logWithThreshold = (
  category: string,
  message: string,
  data: unknown,
  threshold: number = 1000,
  useWarning: boolean = false
) => {
  const value = typeof data === 'number' ? data : undefined;
  
  if (value !== undefined && value > threshold) {
    if (useWarning) {
      logger.warn(category, `[THRESHOLD] ${message} (${value} > ${threshold})`, { value, threshold });
    } else {
      logger.info(category, `[THRESHOLD] ${message}`, { value, threshold });
    }
  }
};

/**
 * Get logs for export/debugging
 */
export const exportDebugInfo = () => {
  return {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    logs: logger.exportLogs('json'),
    stats: logger.getStats(),
  };
};

/**
 * Create a performance span
 */
export class PerformanceSpan {
  private label: string;
  private startTime: number;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    logPerformance.start(label);
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    logPerformance.end(this.label);
    return duration;
  }
}
