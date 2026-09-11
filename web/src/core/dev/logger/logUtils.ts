import { logger, type TraceLogger } from './Logger';

/**
 * API request/response logging helper
 */
export const logAPI = {
  request: (method: string, url: string, data?: unknown, traceId?: string) => {
    logger.debug('API', `${method} ${url}`, {
      event: 'REQUEST',
      data: { method, url, ...((typeof data === 'object' && data !== null) ? data : { data }) },
      traceId,
      source: 'logAPI',
    });
  },

  response: (method: string, url: string, status: number, durationMs?: number, data?: unknown, traceId?: string) => {
    const level = status >= 400 ? 'warn' : 'info';
    logger[level]('API', `${status} ${method} ${url}`, {
      event: 'RESPONSE',
      data: { status, durationMs, ...((typeof data === 'object' && data !== null) ? data : { data }) },
      duration: durationMs,
      traceId,
      source: 'logAPI',
    });
  },

  error: (method: string, url: string, error: unknown, traceId?: string) => {
    logger.error('API', `Failed ${method} ${url}`, {
      event: 'ERROR',
      error,
      traceId,
      source: 'logAPI',
    });
  },
};

/**
 * Redux action logging helper
 */
export const logRedux = {
  action: (actionType: string, payload?: unknown) => {
    // We default to debug level so it's muted in UI unless selected
    logger.debug('REDUX', actionType, {
      event: 'ACTION',
      data: payload,
      source: 'logRedux',
    });
  },

  state: (sliceName: string, newState: unknown) => {
    logger.debug('REDUX', `State Updated: ${sliceName}`, {
      event: 'STATE_UPDATE',
      data: newState,
      source: 'logRedux',
    });
  },

  dispatch: (actionType: string) => {
    logger.debug('REDUX', `Dispatch: ${actionType}`, {
      event: 'DISPATCH',
      source: 'logRedux',
    });
  },
};

/**
 * Component lifecycle logging
 */
export const logComponent = {
  mount: (componentName: string) => {
    logger.debug('COMPONENT', `${componentName} mounted`, { event: 'MOUNT', source: componentName });
  },

  unmount: (componentName: string) => {
    logger.debug('COMPONENT', `${componentName} unmounted`, { event: 'UNMOUNT', source: componentName });
  },

  render: (componentName: string, props?: unknown) => {
    // This goes as debug and is additionally gated by renderLoggingEnabled in Logger config
    logger.debug('COMPONENT', `${componentName} render`, { event: 'RENDER', data: props, source: componentName });
  },

  effect: (componentName: string, effectName: string) => {
    logger.debug('COMPONENT', `${componentName} effect: ${effectName}`, { event: 'EFFECT', source: componentName });
  },

  error: (componentName: string, error: unknown) => {
    logger.error('COMPONENT', `${componentName} error`, { event: 'ERROR', error, source: componentName });
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
        logger.info('PERFORMANCE', `Measured ${label}`, {
          event: 'MEASURE',
          duration: measure.duration,
          source: 'Performance',
        });
      } catch (e) {
        logger.warn('PERFORMANCE', `Failed to measure ${label}`, { error: e, source: 'Performance' });
      }
    }
  },

  navigation: (route: string) => {
    logger.info('NAVIGATION', `Navigated to ${route}`, { event: 'ROUTE_CHANGE', route, source: 'Router' });
    logger.setCurrentRoute(route);
  },
};

/**
 * Authentication logging
 */
export const logAuth = {
  login: (userId: string, method: string) => {
    logger.info('AUTH', `User login: ${method}`, { event: 'LOGIN', data: { userId }, source: 'logAuth' });
  },

  logout: (userId: string) => {
    logger.info('AUTH', 'User logout', { event: 'LOGOUT', data: { userId }, source: 'logAuth' });
  },

  error: (message: string, error?: unknown) => {
    logger.error('AUTH', message, { event: 'ERROR', error, source: 'logAuth' });
  },

  token: (action: string, token?: string) => {
    // Token itself is never logged
    logger.debug('AUTH', `Token ${action}`, { event: 'TOKEN_EVENT', data: { tokenExists: !!token }, source: 'logAuth' });
  },
};

/**
 * Error tracking with context
 */
export const logError = (
  category: string,
  error: unknown,
  context?: Record<string, unknown>,
  source?: string,
  traceId?: string
) => {
  logger.error(category, error instanceof Error ? error.message : String(error), {
    event: 'ERROR',
    error,
    data: context,
    source,
    traceId,
  });
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
      logger.warn(category, `${message} (${value} > ${threshold})`, { event: 'THRESHOLD', data: { value, threshold } });
    } else {
      logger.info(category, message, { event: 'THRESHOLD', data: { value, threshold } });
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
    logs: JSON.parse(logger.exportLogs('json')),
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

