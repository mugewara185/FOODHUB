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
  maxLogs: 500,
  persistLogs: true,
  logLevel: 'DEBUG',
  enableStackTrace: true,
  enableTimestamps: true,
  groupByCategory: true,
};

class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLogs();
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown,
    source?: string
  ): LogEntry {
    // Check if log level is enabled
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.logLevel]) {
      return {} as LogEntry;
    }

    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      source,
      tags: this.extractTags(message),
    };

    // Add stack trace for errors
    if ((level === 'ERROR' || level === 'CRITICAL') && this.config.enableStackTrace) {
      entry.stackTrace = this.getStackTrace();
    }

    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    // Persist to localStorage
    if (this.config.persistLogs) {
      this.saveLogs();
    }

    // Notify listeners
    this.notifyListeners();

    // Also log to console in dev mode
    this.consoleLog(entry);

    return entry;
  }

  /**
   * Public logging methods
   */
  debug(category: string, message: string, data?: unknown, source?: string) {
    return this.log('DEBUG', category, message, data, source);
  }

  info(category: string, message: string, data?: unknown, source?: string) {
    return this.log('INFO', category, message, data, source);
  }

  warn(category: string, message: string, data?: unknown, source?: string) {
    return this.log('WARN', category, message, data, source);
  }

  error(category: string, message: string, data?: unknown, source?: string) {
    return this.log('ERROR', category, message, data, source);
  }

  critical(category: string, message: string, data?: unknown, source?: string) {
    return this.log('CRITICAL', category, message, data, source);
  }

  /**
   * Get all logs or filtered logs
   */
  getLogs(filters?: FilterOptions): LogEntry[] {
    let filtered = [...this.logs];

    if (!filters) return filtered;

    // Filter by level
    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      filtered = filtered.filter(log => levels.includes(log.level));
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(log => 
        log.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // Search in message
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(log =>
        filters.tags!.some(tag => log.tags?.includes(tag))
      );
    }

    // Filter by time range
    if (filters.timeRange) {
      filtered = filtered.filter(log =>
        log.timestamp >= filters.timeRange!.start && 
        log.timestamp <= filters.timeRange!.end
      );
    }

    return filtered;
  }

  /**
   * Get statistics
   */
  getStats(): LogStats {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        CRITICAL: 0,
      },
      byCategory: {},
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('appLogs');
    this.notifyListeners();
  }

  /**
   * Clear logs by level
   */
  clearByLevel(level: LogLevel): void {
    this.logs = this.logs.filter(log => log.level !== level);
    if (this.config.persistLogs) this.saveLogs();
    this.notifyListeners();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    return this.logsToCSV();
  }

  /**
   * Subscribe to log changes
   */
  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Private helper methods
   */
  private extractTags(message: string): string[] {
    // Extract tags in format [TAG] from message
    const matches = message.match(/\[([^\]]+)\]/g) || [];
    return matches.map(m => m.slice(1, -1));
  }

  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (e) {
      return (e as Error).stack?.split('\n').slice(3).join('\n') || '';
    }
  }

  private consoleLog(entry: LogEntry): void {
    const style = this.getConsoleStyle(entry.level);
    const message = `[${entry.level}] [${entry.category}] ${entry.message}`;
    
    if (typeof window !== 'undefined') {
      console.log(`%c${message}`, style, entry.data);
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

  private logsToCSV(): string {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Data', 'Source'];
    const rows = this.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.level,
      log.category,
      log.message,
      JSON.stringify(log.data),
      log.source || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback([...this.logs]));
  }

  private saveLogs(): void {
    try {
      const logsToSave = this.logs.slice(-100); // Keep last 100 logs
      localStorage.setItem('appLogs', JSON.stringify(logsToSave));
    } catch (e) {
      console.error('Failed to save logs:', e);
    }
  }

  private loadLogs(): void {
    try {
      const saved = localStorage.getItem('appLogs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for testing
export default Logger;
