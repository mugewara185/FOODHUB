// Log levels with priorities
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string; // e.g., 'API', 'Auth', 'Redux', 'Component'
  message: string;
  source?: string; // File/component that logged
  event?: string; // What kind of execution event this represents
  data?: unknown; // Optional structured debugging information
  traceId?: string; // Correlation / flow tracking
  parentId?: string;
  duration?: number; // Optional duration
  route?: string; // Environment/session information
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
}

export interface LoggerConfig {
  maxLogs: number;
  persistLogs: boolean;
  logLevel: LogLevel;
  enableStackTrace: boolean;
  enableTimestamps: boolean;
  consoleLoggingEnabled: boolean;
  renderLoggingEnabled: boolean;
  routeTrackingEnabled: boolean;
  reduxLoggingEnabled: boolean;
  apiLoggingEnabled: boolean;
}

export interface FilterOptions {
  level?: LogLevel | LogLevel[];
  category?: string;
  search?: string; // Search in message or data
  traceId?: string;
  route?: string;
  event?: string;
  timeRange?: {
    start: number;
    end: number;
  };
}

