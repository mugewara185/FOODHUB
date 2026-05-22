# Framework Implementation Guide
**Step-by-Step extraction & evolution from Zom2**

---

## PHASE 1: EXTRACT LOGGER FROM ZOM2

### Step 1.1: Copy & Refactor Logger Core

Current Zom2: `web/src/core/dev/logger/Logger.ts`

```ts
// framework/logging/core/Logger.ts
import { v4 as uuidv4 } from 'uuid';
import type { LogEntry, LogLevel, LoggerConfig, FilterOptions, LogStats } from './types';

// Enhance color mapping with CSS and console styles
const LOG_COLORS = {
  DEBUG:    { css: 'color: #666; font-size: 12px;', emoji: '🐛' },
  INFO:     { css: 'color: #1976d2; font-weight: bold;', emoji: 'ℹ️' },
  WARN:     { css: 'color: #f57c00; font-weight: bold;', emoji: '⚠️' },
  ERROR:    { css: 'color: #d32f2f; font-weight: bold;', emoji: '❌' },
  CRITICAL: { css: 'color: #d32f2f; font-size: 14px; font-weight: bold; text-decoration: underline;', emoji: '🚨' },
};

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private paused = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    const defaults: LoggerConfig = {
      maxLogs: 500,
      persistLogs: true,
      minLevel: 'DEBUG',
      enableStackTrace: true,
      enableTimestamps: true,
      enableGrouping: true,
      colors: LOG_COLORS,
    };
    this.config = { ...defaults, ...config };
    this.loadLogs();
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    namespace: string,
    message: string,
    data?: unknown,
    tags?: string[]
  ): LogEntry {
    if (this.paused || LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return {} as LogEntry;
    }

    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      namespace,
      message,
      data: this.sanitizeData(data),
      tags: [...(tags || []), level.toLowerCase()],
      source: this.getSource(),
    };

    if ((level === 'ERROR' || level === 'CRITICAL') && this.config.enableStackTrace) {
      entry.stackTrace = this.getStackTrace();
    }

    this.logs.push(entry);

    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    if (this.config.persistLogs) {
      this.saveLogs();
    }

    this.notifyListeners();
    this.consoleLog(entry);

    return entry;
  }

  /**
   * Public API
   */
  debug(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('DEBUG', namespace, message, data, tags);
  }

  info(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('INFO', namespace, message, data, tags);
  }

  warn(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('WARN', namespace, message, data, tags);
  }

  error(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('ERROR', namespace, message, data, tags);
  }

  critical(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('CRITICAL', namespace, message, data, tags);
  }

  /**
   * Performance spans
   */
  startSpan(namespace: string) {
    const startTime = performance.now();
    return {
      end: (data?: any) => {
        const duration = performance.now() - startTime;
        return this.info(namespace, `Completed in ${duration.toFixed(2)}ms`, { ...data, duration });
      }
    };
  }

  /**
   * Query & Filter
   */
  getLogs(filters?: FilterOptions): LogEntry[] {
    let filtered = [...this.logs];

    if (!filters) return filtered;

    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      filtered = filtered.filter(log => levels.includes(log.level));
    }

    if (filters.namespace) {
      const regex = new RegExp(filters.namespace, 'i');
      filtered = filtered.filter(log => regex.test(log.namespace));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    if (filters.tags?.length) {
      filtered = filtered.filter(log =>
        filters.tags!.some(tag => log.tags?.includes(tag))
      );
    }

    if (filters.timeRange) {
      filtered = filtered.filter(log =>
        log.timestamp >= filters.timeRange!.start &&
        log.timestamp <= filters.timeRange!.end
      );
    }

    return filtered;
  }

  getByNamespace(pattern: string): LogEntry[] {
    const regex = new RegExp(pattern, 'i');
    return this.logs.filter(log => regex.test(log.namespace));
  }

  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getRecent(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Statistics
   */
  stats(): LogStats {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        CRITICAL: 0,
      },
      byNamespace: {},
    };

    const durations: number[] = [];

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byNamespace[log.namespace] = (stats.byNamespace[log.namespace] || 0) + 1;
      if (log.duration) durations.push(log.duration);
    });

    return {
      ...stats,
      avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    };
  }

  /**
   * Export
   */
  export(format: 'json' | 'csv' | 'html' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'level', 'namespace', 'message', 'data', 'tags'];
      const rows = this.logs.map(log =>
        headers.map(key => {
          const value = (log as any)[key];
          const str = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    // HTML format
    const html = `
      <html>
        <head>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .DEBUG { color: #666; }
            .INFO { color: #1976d2; }
            .WARN { color: #f57c00; }
            .ERROR { color: #d32f2f; }
            .CRITICAL { color: #d32f2f; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <tr><th>Time</th><th>Level</th><th>Namespace</th><th>Message</th><th>Data</th></tr>
            ${this.logs.map(log => `
              <tr>
                <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td class="${log.level}">${log.level}</td>
                <td>${log.namespace}</td>
                <td>${log.message}</td>
                <td><pre>${JSON.stringify(log.data, null, 2)}</pre></td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    return html;
  }

  /**
   * Control
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  clear(namespace?: string): void {
    if (namespace) {
      const regex = new RegExp(namespace, 'i');
      this.logs = this.logs.filter(log => !regex.test(log.namespace));
    } else {
      this.logs = [];
    }
    if (this.config.persistLogs) this.saveLogs();
    this.notifyListeners();
  }

  /**
   * Private helpers
   */
  private consoleLog(entry: LogEntry): void {
    if (typeof window === 'undefined') return;

    const color = this.config.colors[entry.level];
    const timestamp = this.config.enableTimestamps
      ? new Date(entry.timestamp).toLocaleTimeString()
      : '';

    console.log(
      `%c[${timestamp}] [${entry.level}] ${entry.namespace}`,
      color.css,
      entry.message,
      entry.data ? '→' : '',
      entry.data || ''
    );
  }

  private sanitizeData(data: unknown): unknown {
    if (data && typeof data === 'object') {
      // Avoid logging passwords, secrets
      const obj = JSON.parse(JSON.stringify(data));
      const sanitize = (o: any) => {
        Object.keys(o).forEach(key => {
          if (/password|secret|token|key|credential/i.test(key)) {
            o[key] = '***REDACTED***';
          } else if (typeof o[key] === 'object') {
            sanitize(o[key]);
          }
        });
      };
      sanitize(obj);
      return obj;
    }
    return data;
  }

  private getStackTrace(): string {
    if (!(new Error()).stack) return '';
    return new Error().stack.split('\n').slice(3).join('\n');
  }

  private getSource(): string {
    try {
      const stack = new Error().stack || '';
      const line = stack.split('\n')[4]; // Adjust based on call depth
      const match = line?.match(/at (\S+)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private saveLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('__rdf_logs', JSON.stringify(this.logs.slice(-100)));
      }
    } catch (e) {
      console.warn('Failed to persist logs', e);
    }
  }

  private loadLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('__rdf_logs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted logs', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Export singleton instance
export const logger = new Logger();
export { Logger };
```

### Step 1.2: Add Domain Loggers

```ts
// framework/logging/domains/api.ts
import { logger } from '../core/Logger';

export const apiLogger = {
  request: (method: string, endpoint: string, data?: any) => {
    logger.debug(`api:${method.toLowerCase()}:request`, `${method} ${endpoint}`, data, ['api', 'request']);
  },

  response: (method: string, endpoint: string, status: number, data?: any) => {
    const level = status >= 400 ? 'WARN' : 'INFO';
    logger[level](`api:${method.toLowerCase()}:response`, `${status} ${endpoint}`, data, ['api', 'response']);
  },

  error: (endpoint: string, error: unknown) => {
    logger.error('api:error', `Failed: ${endpoint}`, error, ['api', 'error']);
  },

  cached: (endpoint: string, ttl: number) => {
    logger.info('api:cached', `Using cached response for ${endpoint}`, { ttl }, ['api', 'cache']);
  },
};

// framework/logging/domains/redux.ts
export const reduxLogger = {
  action: (type: string, payload?: any) => {
    logger.debug('redux:action', `Dispatched ${type}`, payload, ['redux', 'action']);
  },

  state: (slice: string, newState: any) => {
    logger.debug(`redux:state:${slice}`, `State updated`, newState, ['redux', 'state']);
  },

  error: (action: string, error: unknown) => {
    logger.error('redux:error', `Error in ${action}`, error, ['redux', 'error']);
  },
};

// framework/logging/domains/component.ts
export const componentLogger = {
  mount: (name: string) => {
    logger.debug(`component:lifecycle:mount`, `${name} mounted`, undefined, ['component', 'lifecycle']);
  },

  unmount: (name: string) => {
    logger.debug(`component:lifecycle:unmount`, `${name} unmounted`, undefined, ['component', 'lifecycle']);
  },

  render: (name: string, props?: any) => {
    logger.debug(`component:lifecycle:render`, `${name} rendered`, props, ['component', 'render']);
  },

  effect: (name: string, effectName: string) => {
    logger.debug(`component:effect:${effectName}`, `${name}-${effectName}`, undefined, ['component', 'effect']);
  },

  error: (name: string, error: unknown) => {
    logger.error(`component:error`, `${name} error`, error, ['component', 'error']);
  },
};

// framework/logging/index.ts
export { logger, Logger } from './core/Logger';
export type { LogEntry, LogLevel, LoggerConfig, LogStats, FilterOptions } from './core/types';
export { apiLogger, reduxLogger, componentLogger };
```

## PHASE 2: EXTRACT & BUILD DATA FACTORY

### Step 2.1: Build Factory Core

Study Zom2's current factories and build abstraction:

```ts
// framework/data-factory/core/FactoryBuilder.ts
import { faker } from '@faker-js/faker';
import type { SchemaDef, FieldDef } from './types';

export class FactoryBuilder<T = any> {
  private schema: SchemaDef;
  private seed: number | null = null;
  private registry: Map<string, any> = new Map();

  constructor(
    private name: string,
    schema: SchemaDef
  ) {
    this.schema = this.normalizeSchema(schema);
  }

  /**
   * Normalize shorthand schema to full FieldDef
   * Examples:
   *  'email' → { type: 'string', generator: 'email' }
   *  { type: 'number', min: 1, max: 100 } → as is
   */
  private normalizeSchema(schema: SchemaDef): SchemaDef {
    const normalized: SchemaDef = {};

    Object.entries(schema).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Shorthand: map string to generator
        normalized[key] = this.resolveGenerator(value);
      } else {
        normalized[key] = value as FieldDef;
      }
    });

    return normalized;
  }

  /**
   * Resolve string generators like 'email', 'firstName', etc.
   */
  private resolveGenerator(gen: string): FieldDef {
    const generators: Record<string, () => any> = {
      // Basic types
      'uuid': () => faker.string.uuid(),
      'string': () => faker.string.alpha(10),
      'boolean': () => faker.datatype.boolean(),
      'number': () => faker.number.int(),
      'date': () => faker.date.recent(),
      'pastDate': () => faker.date.past(),
      'futureDate': () => faker.date.future(),

      // Person data
      'firstName': () => faker.person.firstName(),
      'lastName': () => faker.person.lastName(),
      'fullName': () => faker.person.fullName(),
      'email': () => faker.internet.email(),
      'phone': () => faker.phone.number(),
      'avatar': () => faker.image.avatar(),

      // Business data
      'company': () => faker.company.name(),
      'slug': () => faker.helpers.slugify('{{word}}'),
      'url': () => faker.internet.url(),

      // Location
      'address': () => faker.location.streetAddress(),
      'city': () => faker.location.city(),
      'country': () => faker.location.country(),
      'latitude': () => parseFloat(faker.location.latitude()),
      'longitude': () => parseFloat(faker.location.longitude()),

      // Text
      'sentence': () => faker.lorem.sentence(),
      'paragraph': () => faker.lorem.paragraph(),
      'word': () => faker.lorem.word(),

      // Commerce
      'productName': () => faker.commerce.productName(),
      'productDesc': () => faker.commerce.productDescription(),
      'price': () => parseFloat(faker.commerce.price()),
      'currency': () => faker.finance.currency().code,
    };

    const fn = generators[gen.toLowerCase()];
    if (!fn) {
      console.warn(`Unknown generator: ${gen}`);
      return { type: 'string', generator: () => gen };
    }

    return { type: 'string', generator: fn };
  }

  /**
   * Create instance(s) of this schema
   */
  create(options?: { count?: number; overrides?: Record<any, any>; seed?: number }): T | T[] {
    const count = options?.count ?? 1;
    const overrides = options?.overrides ?? {};
    if (options?.seed !== undefined) this.seed = options.seed;

    if (count === 1) {
      return this.generateOne(0, overrides[0]);
    }

    return Array.from({ length: count }).map((_, index) =>
      this.generateOne(index, overrides[index])
    );
  }

  /**
   * Generate single instance
   */
  private generateOne(index: number, override?: Partial<T>): T {
    if (this.seed !== null) {
      faker.seed(this.seed + index);
    }

    const instance: any = {};
    const context = { index, seed: this.seed ?? 0, faker };

    Object.entries(this.schema).forEach(([key, fieldDef]) => {
      const def = fieldDef as FieldDef;

      // Check for overrides first
      if (override && key in override) {
        instance[key] = (override as any)[key];
        return;
      }

      // Generate value
      let value: any;

      if (typeof def.generator === 'function') {
        value = def.generator(context);
      } else if (typeof def.generator === 'string') {
        const genFn = this.resolveGenerator(def.generator);
        value = (genFn.generator as any)(context);
      } else if (def.options?.enum) {
        value = def.options.enum[index % def.options.enum.length];
      } else {
        value = null;
      }

      // Apply transform if provided
      if (def.transform) {
        value = def.transform(value);
      }

      // Apply default if null
      if (value === null && def.options?.default !== undefined) {
        value = def.options.default;
      }

      instance[key] = value;
    });

    return instance as T;
  }

  /**
   * Export generated data
   */
  export(data: any[], format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const val = (row as any)[h];
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
```

###Step 2.2: Factory Registry

```ts
// framework/data-factory/core/FactoryRegistry.ts
import { FactoryBuilder } from './FactoryBuilder';
import type { SchemaDef } from './types';

export class FactoryRegistry {
  private schemas: Map<string, any> = new Map();
  private builders: Map<string, FactoryBuilder> = new Map();
  private data: Map<string, any[]> = new Map();

  /**
   * Register a schema
   */
  schema<T = any>(name: string, def: SchemaDef): FactoryBuilder<T> {
    const builder = new FactoryBuilder<T>(name, def);
    this.schemas.set(name, def);
    this.builders.set(name, builder);
    return builder;
  }

  /**
   * Generate data using registered schema
   */
  create<T = any>(name: string, options?: any): T | T[] {
    const builder = this.builders.get(name);
    if (!builder) {
      throw new Error(`Schema not found: ${name}`);
    }

    const data = builder.create(options);
    
    // Store for later reference
    const arr = Array.isArray(data) ? data : [data];
    this.data.set(name, [...(this.data.get(name) || []), ...arr]);

    return data;
  }

  /**
   * Get statistics
   */
  stats() {
    const stats: Record<string, any> = {
      schemas: this.schemas.size,
      totalRecords: 0,
      bySchema: {},
    };

    this.data.forEach((records, schema) => {
      stats.bySchema[schema] = records.length;
      stats.totalRecords += records.length;
    });

    return stats;
  }

  /**
   * Clear data
   */
  clear(name?: string) {
    if (name) {
      this.data.delete(name);
    } else {
      this.data.clear();
    }
  }
}
```

### Step 2.3: React Hooks for Factory

```ts
// framework/data-factory/hooks/useFactory.ts
import { useState, useCallback } from 'react';
import type { FactoryInput } from '../core/types';

export const useFactory = <T = any>(
  registry: FactoryRegistry,
  schemaName?: string
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback((input: FactoryInput = {}) => {
    if (!schemaName) return;
    setIsLoading(true);
    try {
      const result = registry.create<T>(schemaName, input);
      const arr = Array.isArray(result) ? result : [result];
      setData(arr);
      return arr;
    } finally {
      setIsLoading(false);
    }
  }, [registry, schemaName]);

  const regenerate = () => {
    create({ count: data.length });
  };

  return {
    data,
    isLoading,
    create,
    regenerate,
    stats: () => registry.stats(),
  };
};
```

---

## PHASE 3: SHARED LAYER EXTRACTION

### Step 3.1: Core Hooks

Take from Zom2's `shared/hooks/` and refine:

```ts
// framework/shared/hooks/useApi.ts
import { useState, useCallback, useEffect } from 'react';
import { apiLogger } from '@/logging/domains/api';

interface UseApiOptions<T> {
  autoFetch?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: number;
  timeout?: number;
}

export const useApi = <T, P = void>(
  apiFunction: (params?: P) => Promise<T>,
  options?: UseApiOptions<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (params?: P) => {
      setLoading(true);
      setError(null);

      let retries = options?.retry ?? 0;
      while (retries >= 0) {
        try {
          const result = await apiFunction(params);
          setData(result);
          apiLogger.response('GET', 'api', 200, result);
          options?.onSuccess?.(result);
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          
          if (retries > 0) {
            retries--;
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }

          setError(error);
          apiLogger.error('api', error);
          options?.onError?.(error);
          throw error;
        } finally {
          setLoading(false);
        }
      }
    },
    [apiFunction, options]
  );

  useEffect(() => {
    if (options?.autoFetch) {
      execute();
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    isError: error !== null,
    isDone: !loading && data !== null,
  };
};
```

```ts
// framework/shared/hooks/useLocalStorage.ts
import { useState, useCallback, useEffect } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      console.error(`Failed to read localStorage key: ${key}`);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Failed to set localStorage key: ${key}`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          console.error('Failed to parse storage event');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};
```

### Step 3.2: Utilities

```ts
// framework/shared/utils/response.ts
export interface ResponseShape<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    version: string;
  };
}

export const createResponse = <T = any>(
  data: T,
  options?: { error?: string; code?: string }
): ResponseShape<T> => {
  return {
    success: !options?.error,
    data: options?.error ? undefined : data,
    error: options?.error ? {
      message: options.error,
      code: options.code,
    } : undefined,
    meta: {
      timestamp: Date.now(),
      version: '1.0',
    },
  };
};

export const isSuccessResponse = (response: any): boolean => {
  return response?.success === true;
};

export const getResponseData = <T = any>(response: ResponseShape<T>): T | null => {
  return response.data ?? null;
};

export const getResponseError = (response: ResponseShape): string => {
  return response.error?.message ?? 'Unknown error';
};
```

---

## PHASE 4: DEV TOOLKIT

### Step 4.1: API Simulator

```ts
// framework/dev-toolkit/simulators/ApiSimulator.ts
import { logger } from '@/logging';

export class ApiSimulator {
  private delays: Map<string, [number, number]> = new Map(); // [min, max]
  private errors: Map<string, { status: number; message: string }> = new Map();
  private enabled = true;

  /**
   * Simulate network delay
   */
  setDelay(endpoint: string, delayMs: number): void {
    this.delays.set(endpoint, [delayMs, delayMs]);
    logger.info('dev:api:delay', `Set ${delayMs}ms delay for ${endpoint}`);
  }

  setRandomDelay(endpoint: string, minMs: number, maxMs: number): void {
    this.delays.set(endpoint, [minMs, maxMs]);
    logger.info('dev:api:randomDelay', `Set ${minMs}-${maxMs}ms random delay for ${endpoint}`);
  }

  /**
   * Simulate errors
   */
  setError(endpoint: string, status: number, message: string): void {
    this.errors.set(endpoint, { status, message });
    logger.warn('dev:api:error', `Set ${status} error for ${endpoint}`);
  }

  setRandomError(endpoint: string, probability: number): void {
    // Store probability and check during request
    (this as any).errorProbabilities ??= new Map();
    (this as any).errorProbabilities.set(endpoint, probability);
    logger.warn('dev:api:randomError', `Set ${(probability * 100).toFixed(0)}% error chance for ${endpoint}`);
  }

  clearError(endpoint: string): void {
    this.errors.delete(endpoint);
    logger.info('dev:api:clearError', `Cleared error for ${endpoint}`);
  }

  /**
   * Apply simulation to fetch
   */
  async simulateFetch<T>(
    endpoint: string,
    realFetch: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) return realFetch();

    // Check for simulated error
    const error = this.errors.get(endpoint);
    if (error) {
      logger.error('dev:api:simulatedError', `Simulating ${error.status} for ${endpoint}`);
      throw new Error(error.message);
    }

    // Apply delay
    const [minDelay, maxDelay] = this.delays.get(endpoint) ?? [0, 0];
    const delay = minDelay + Math.random() * (maxDelay - minDelay);

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return realFetch();
  }

  enable(): void {
    this.enabled = true;
    logger.info('dev:api:enabled', 'API simulator enabled');
  }

  disable(): void {
    this.enabled = false;
    logger.info('dev:api:disabled', 'API simulator disabled');
  }

  reset(): void {
    this.delays.clear();
    this.errors.clear();
    this.enabled = true;
    logger.info('dev:api:reset', 'API simulator reset');
  }
}
```

---

## INTEGRATION CHECKLIST

```
□ LOGGER EXTRACTION
  □ Copy Logger.ts from Zom2
  □ Add domain loggers (API, Redux, Component, Auth)
  □ Add color formatting
  □ Create React hooks (useLogger, useFilteredLogs)
  □ Test persistence and filtering

□ DATA FACTORY EXTRACTION
  □ Build FactoryBuilder with field generators
  □ Create FactoryRegistry
  □ Add relationship support
  □ Create React hooks
  □ Test with Zom2 schemas (restaurant, user, order)

□ SHARED LAYER EXTRACTION
  □ Polish shared/hooks (useApi, useLocalStorage, etc.)
  □ Create shared/utils with response handlers
  □ Define shared/constants (HTTP codes, errors)
  □ Remove feature-specific code
  □ Add proper TypeScript types

□ DEV TOOLKIT
  □ Build API simulator
  □ Build feature toggle
  □ Build error simulator
  □ Create window.__DEV__ hook
  □ Add dev panel UI

□ DOCUMENTATION
  □ Write API docs for each module
  □ Create quick-start guide
  □ Add code examples
  □ Record video tutorials

□ PUBLISHING
  □ Setup npm package structure
  □ Write README
  □ Create example projects
  □ Setup CI/CD
  □ Publish to npm registry
```

---

**Next**: Create the framework repository structure and publish as standalone npm package
