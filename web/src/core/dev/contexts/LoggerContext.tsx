import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger, type TraceLogger, type LogOptions } from '../logger/Logger';
import type { LogEntry, LogLevel, FilterOptions, LogStats, LoggerConfig } from '../logger/types';

interface LoggerContextType {
  logs: LogEntry[];
  open: boolean;
  setOpen: (open: boolean) => void;
  stats: LogStats;
  config: LoggerConfig;

  // Stable logger methods
  debug: (category: string, message: string, options?: LogOptions) => LogEntry | undefined;
  info: (category: string, message: string, options?: LogOptions) => LogEntry | undefined;
  warn: (category: string, message: string, options?: LogOptions) => LogEntry | undefined;
  error: (category: string, message: string, options?: LogOptions) => LogEntry | undefined;
  critical: (category: string, message: string, options?: LogOptions) => LogEntry | undefined;

  startTrace: (category: string, startMessage?: string, options?: Omit<LogOptions, 'traceId'>) => TraceLogger;

  getLogs: (filters?: FilterOptions) => LogEntry[];
  clearLogs: () => void;
  clearByLevel: (level: LogLevel) => void;
  exportLogs: (format?: 'json' | 'csv') => string;
  setConfig: (config: Partial<LoggerConfig>) => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

export const LoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [config, setConfigState] = useState<LoggerConfig>(logger.getConfig());

  useEffect(() => {
    // Subscribe to logger updates
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs([...updatedLogs]);
      setConfigState(logger.getConfig());
    });

    // Initial load
    setLogs(logger.getLogs());

    return unsubscribe;
  }, []);

  // Using a stable reference for contextValue to prevent unnecessary re-renders in consumers
  const [contextValue] = useState<Omit<LoggerContextType, 'logs' | 'open' | 'setOpen' | 'stats' | 'config'>>({
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    critical: logger.critical,
    startTrace: logger.startTrace,
    getLogs: logger.getLogs,
    clearLogs: logger.clearLogs,
    clearByLevel: logger.clearByLevel,
    exportLogs: logger.exportLogs,
    setConfig: logger.setConfig,
  });

  return (
    <LoggerContext.Provider value={{
      ...contextValue,
      logs,
      open,
      setOpen,
      stats: logger.getStats(),
      config,
    }}>
      {children}
    </LoggerContext.Provider>
  );
};

/**
 * Hook to use logger in any component
 */
export const useLogger = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within LoggerProvider');
  }
  return context;
};

/**
 * Hook to get filtered logs
 */
export const useFilteredLogs = (filters?: FilterOptions) => {
  const { logs, getLogs } = useLogger();
  const [filtered, setFiltered] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    setFiltered(getLogs(filters));
  }, [logs, filters, getLogs]);

  return filtered;
};

/**
 * Hook to track a specific category
 */
export const useCategoryLogs = (category: string) => {
  const filters = React.useMemo(() => ({ category }), [category]);
  return useFilteredLogs(filters);
};

/**
 * Hook to get error logs
 */
export const useErrorLogs = () => {
  const filters = React.useMemo(() => ({ level: ['ERROR', 'CRITICAL'] as LogLevel[] }), []);
  return useFilteredLogs(filters);
};

/**
 * Hook to get logs by level
 */
export const useLogsByLevel = (level: LogLevel | LogLevel[]) => {
  const filters = React.useMemo(() => ({ level }), [level]);
  return useFilteredLogs(filters);
};

