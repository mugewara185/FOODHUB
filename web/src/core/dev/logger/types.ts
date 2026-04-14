// Log levels with priorities
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string; // e.g., 'API', 'Auth', 'Redux', 'Component'
  message: string;
  data?: unknown; // Additional context data
  stackTrace?: string; // For errors
  tags?: string[]; // For filtering
  source?: string; // File/component that logged
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
}

export interface LoggerConfig {
  maxLogs: number; // Max logs to keep in memory (default: 500)
  persistLogs: boolean; // Save to localStorage (default: true)
  logLevel: LogLevel; // Minimum level to log (default: 'DEBUG')
  enableStackTrace: boolean; // Capture stack traces (default: true)
  enableTimestamps: boolean; // Include timestamps (default: true)
  groupByCategory: boolean; // Auto-group logs (default: true)
}

export interface FilterOptions {
  level?: LogLevel | LogLevel[];
  category?: string;
  search?: string; // Search in message
  tags?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
}
