import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { logger } from '../logger/Logger';
import type { LogEntry, LogLevel, FilterOptions, LogStats, LoggerConfig } from '../logger/types';

interface LoggerContextType {
  logs: LogEntry[];
  open: boolean;
  setOpen: (open: boolean) => void;
  stats: LogStats;
  debug: (category: string, message: string, data?: unknown, source?: string) => LogEntry;
  info: (category: string, message: string, data?: unknown, source?: string) => LogEntry;
  warn: (category: string, message: string, data?: unknown, source?: string) => LogEntry;
  error: (category: string, message: string, data?: unknown, source?: string) => LogEntry;
  critical: (category: string, message: string, data?: unknown, source?: string) => LogEntry;
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
  useEffect(() => {
    // Subscribe to logger updates
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs([...updatedLogs]);
    });

    return unsubscribe;
  }, []);

  const contextValue: LoggerContextType = {
    logs,
    open,
    setOpen,
    stats: logger.getStats(),
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger), //?
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    critical: logger.critical.bind(logger),
    getLogs: logger.getLogs.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
    clearByLevel: logger.clearByLevel.bind(logger),
    exportLogs: logger.exportLogs.bind(logger),
    setConfig: logger.setConfig.bind(logger),
  };

  return (
    <LoggerContext.Provider value={contextValue}>
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
  return useFilteredLogs({ category });
};

/**
 * Hook to get error logs
 */
export const useErrorLogs = () => {
  return useFilteredLogs({ level: ['ERROR', 'CRITICAL'] });
};

/**
 * Hook to get logs by level
 */
export const useLogsByLevel = (level: LogLevel | LogLevel[]) => {
  return useFilteredLogs({ level });
};
