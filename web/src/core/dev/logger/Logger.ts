import { v4 as uuidv4 } from 'uuid';
import type { LogEntry, LogLevel, LoggerConfig, FilterOptions, LogStats } from './types';

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

const DEFAULT_CONFIG: LoggerConfig = {
  maxLogs: 1000,
  persistLogs: true,
  logLevel: 'DEBUG',
  enableStackTrace: true,
  enableTimestamps: true,
  consoleLoggingEnabled: true,
  renderLoggingEnabled: false,
  routeTrackingEnabled: true,
  reduxLoggingEnabled: true,
  apiLoggingEnabled: true,
};

// Generate a session ID per browser tab session
const generateSessionId = () => {
  if (typeof sessionStorage !== 'undefined') {
    let sid = sessionStorage.getItem('zom2_dev_sessionId');
    if (!sid) {
      sid = uuidv4().substring(0, 8);
      sessionStorage.setItem('zom2_dev_sessionId', sid);
    }
    return sid;
  }
  return uuidv4().substring(0, 8);
};

const SESSION_ID = generateSessionId();
const APP_INSTANCE_ID = uuidv4().substring(0, 8);

export interface LogOptions {
  source?: string;
  event?: string;
  data?: unknown;
  traceId?: string;
  parentId?: string;
  duration?: number;
  route?: string;
  error?: unknown;
}

export class TraceLogger {
  constructor(
    private logger: Logger,
    private category: string,
    public readonly traceId: string
  ) {}

  debug = (message: string, options?: Omit<LogOptions, 'traceId'>) =>
    this.logger.debug(this.category, message, { ...options, traceId: this.traceId });

  info = (message: string, options?: Omit<LogOptions, 'traceId'>) =>
    this.logger.info(this.category, message, { ...options, traceId: this.traceId });

  warn = (message: string, options?: Omit<LogOptions, 'traceId'>) =>
    this.logger.warn(this.category, message, { ...options, traceId: this.traceId });

  error = (message: string, options?: Omit<LogOptions, 'traceId'>) =>
    this.logger.error(this.category, message, { ...options, traceId: this.traceId });

  end = (message: string = 'Trace ended', options?: Omit<LogOptions, 'traceId'>) => {
    this.info(message, { ...options, event: 'TRACE_END' });
  };
}

class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private currentRoute?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLogs();
  }

  setCurrentRoute = (route: string) => {
    this.currentRoute = route;
  };

  startTrace = (category: string, startMessage?: string, options?: Omit<LogOptions, 'traceId'>): TraceLogger => {
    const traceId = uuidv4().substring(0, 8);
    const trace = new TraceLogger(this, category, traceId);
    if (startMessage) {
      trace.info(startMessage, { ...options, event: 'TRACE_START' });
    }
    return trace;
  };

  private processError = (err: unknown): LogEntry['error'] => {
    if (!err) return undefined;
    if (err instanceof Error) {
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }
    return {
      message: String(err),
    };
  };

  private logEntry = (
    level: LogLevel,
    category: string,
    message: string,
    options?: LogOptions
  ): LogEntry | undefined => {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.logLevel]) {
      return undefined;
    }

    // Special case for rendering, check config
    if (options?.event === 'RENDER' && !this.config.renderLoggingEnabled) {
      return undefined;
    }

    let errorObj = this.processError(options?.error);
    if ((level === 'ERROR' || level === 'CRITICAL') && this.config.enableStackTrace && !errorObj?.stack) {
      errorObj = errorObj || { message: message };
      errorObj.stack = this.getStackTrace();
    }

    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      category,
      message,
      source: options?.source,
      event: options?.event,
      data: options?.data,
      traceId: options?.traceId,
      parentId: options?.parentId,
      duration: options?.duration,
      route: options?.route || (this.config.routeTrackingEnabled ? this.currentRoute : undefined),
      error: errorObj,
    };

    this.logs.push(entry);

    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    if (this.config.persistLogs) {
      this.debouncedSaveLogs();
    }

    this.notifyListeners();
    this.consoleLog(entry);

    return entry;
  };

  // Arrow functions for stable references in React Context
  debug = (category: string, message: string, options?: LogOptions) =>
    this.logEntry('DEBUG', category, message, options);

  info = (category: string, message: string, options?: LogOptions) =>
    this.logEntry('INFO', category, message, options);

  warn = (category: string, message: string, options?: LogOptions) =>
    this.logEntry('WARN', category, message, options);

  error = (category: string, message: string, options?: LogOptions) =>
    this.logEntry('ERROR', category, message, options);

  critical = (category: string, message: string, options?: LogOptions) =>
    this.logEntry('CRITICAL', category, message, options);

  getLogs = (filters?: FilterOptions): LogEntry[] => {
    let filtered = [...this.logs];
    if (!filters) return filtered;

    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      filtered = filtered.filter((log) => levels.includes(log.level));
    }
    if (filters.category) {
      filtered = filtered.filter((log) => log.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(s) ||
          JSON.stringify(log.data || {}).toLowerCase().includes(s)
      );
    }
    if (filters.traceId) {
      filtered = filtered.filter((log) => log.traceId === filters.traceId);
    }
    if (filters.route) {
      filtered = filtered.filter((log) => log.route === filters.route);
    }
    if (filters.event) {
      filtered = filtered.filter((log) => log.event === filters.event);
    }
    if (filters.timeRange) {
      filtered = filtered.filter(
        (log) => log.timestamp >= filters.timeRange!.start && log.timestamp <= filters.timeRange!.end
      );
    }
    return filtered;
  };

  getStats = (): LogStats => {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 },
      byCategory: {},
    };
    this.logs.forEach((log) => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });
    return stats;
  };

  clearLogs = (): void => {
    this.logs = [];
    localStorage.removeItem('zom2_logs');
    this.notifyListeners();
  };

  clearByLevel = (level: LogLevel): void => {
    this.logs = this.logs.filter((log) => log.level !== level);
    if (this.config.persistLogs) this.saveLogs();
    this.notifyListeners();
  };

  exportLogs = (format: 'json' | 'csv' = 'json'): string => {
    if (format === 'json') {
      return JSON.stringify(
        {
          metadata: {
            sessionId: SESSION_ID,
            appInstanceId: APP_INSTANCE_ID,
            exportedAt: new Date().toISOString(),
          },
          logs: this.logs,
        },
        null,
        2
      );
    }
    // Only keeping JSON for simplicity unless CSV is requested specifically
    return JSON.stringify(this.logs);
  };

  subscribe = (callback: (logs: LogEntry[]) => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getConfig = (): LoggerConfig => {
    return { ...this.config };
  };

  setConfig = (newConfig: Partial<LoggerConfig>): void => {
    this.config = { ...this.config, ...newConfig };
    // Trigger re-render to reflect new config in UI
    this.notifyListeners();
  };

  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (e) {
      return (e as Error).stack?.split('\n').slice(3).join('\n') || '';
    }
  }

  private consoleLog(entry: LogEntry): void {
    if (!this.config.consoleLoggingEnabled || typeof window === 'undefined') {
      return;
    }
    const style = this.getConsoleStyle(entry.level);
    const traceStr = entry.traceId ? ` [trace:${entry.traceId}]` : '';
    const eventStr = entry.event ? ` [${entry.event}]` : '';
    const message = `[${entry.level}] [${entry.category}]${eventStr}${traceStr} ${entry.message}`;

    const printArgs = [];
    if (entry.data !== undefined) printArgs.push(entry.data);
    if (entry.error) printArgs.push(entry.error);

    if (entry.level === 'ERROR' || entry.level === 'CRITICAL') {
      console.error(`%c${message}`, style, ...printArgs);
    } else if (entry.level === 'WARN') {
      console.warn(`%c${message}`, style, ...printArgs);
    } else {
      console.log(`%c${message}`, style, ...printArgs);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      DEBUG: 'color: #888; font-weight: normal;',
      INFO: 'color: #0066cc; font-weight: bold;',
      WARN: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #cc0000; font-weight: bold;',
      CRITICAL: 'color: #990000; font-weight: bold; background: #ffcccc;',
    };
    return styles[level];
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback([...this.logs]));
  }

  private saveTimer: NodeJS.Timeout | null = null;
  private debouncedSaveLogs(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveLogs(), 500);
  }

  private saveLogs(): void {
    try {
      const logsToSave = this.logs.slice(-500); // Bounded rolling buffer
      localStorage.setItem('zom2_logs', JSON.stringify(logsToSave));
    } catch (e) {
      // Graceful failure for quota/serialization
      console.warn('Logger failed to save to localStorage:', e);
    }
  }

  private loadLogs(): void {
    try {
      const saved = localStorage.getItem('zom2_logs') || localStorage.getItem('appLogs'); // fallback to old key
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.logs = parsed;
        }
      }
    } catch (e) {
      console.warn('Logger failed to load from localStorage:', e);
      localStorage.removeItem('zom2_logs'); // clear corrupted data
    }
  }
}

export const logger = new Logger();
export default Logger;

