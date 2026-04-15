# Logger System Documentation

## Overview

A comprehensive, production-ready logging system for tracking application behavior, debugging issues, and performance monitoring across your entire application.

## Quick Start

### 1. Setup (App.tsx)

```typescript
import { LoggerProvider } from '@/core/dev/logger';

function App() {
  return (
    <LoggerProvider>
      {/* Your app */}
    </LoggerProvider>
  );
}
```

### 2. Use in Components

```typescript
import { useLogger } from '@/core/dev/logger';

function MyComponent() {
  const { info, error, warn } = useLogger();

  useEffect(() => {
    info('COMPONENT', 'Component mounted', { props });
  }, []);

  return <div>...</div>;
}
```

### 3. Basic Logging Methods

```typescript
import { useLogger } from '@/core/dev/logger';

const { debug, info, warn, error, critical } = useLogger();

// All methods follow: method(category, message, data?, source?)
debug('API', 'Fetching user data', { userId: 123 }, 'UserProfile');
info('AUTH', 'User logged in', { userId: 'user123' });
warn('PERFORMANCE', 'API response time exceeded', { duration: 5000 });
error('API', 'Failed to fetch data', { error: err });
critical('AUTH', 'Security breach detected', { attempt: 'unauthorized_access' });
```

## Log Levels

| Level | Purpose | Color |
|-------|---------|-------|
| DEBUG | Detailed debugging info | Gray |
| INFO | General information | Blue |
| WARN | Warning conditions | Orange |
| ERROR | Error conditions | Red |
| CRITICAL | Critical failures | Dark Red |

## Logging Patterns

### API Logging

```typescript
import { logAPI } from '@/core/dev/logger';

// In your API service
logAPI.request('/api/users', 'GET', { params: { id: 123 } });
logAPI.response('/api/users', 200, responseData);
logAPI.error('/api/users', error);
```

### Redux Logging

```typescript
import { logRedux } from '@/core/dev/logger';

// In your slice
logRedux.action('fetchUsers', payload);
logRedux.dispatch('fetchUsers/fulfilled');
logRedux.state('users', newState);
```

### Component Logging

```typescript
import { logComponent } from '@/core/dev/logger';

function MyComponent() {
  useEffect(() => {
    logComponent.mount('MyComponent');
    
    return () => logComponent.unmount('MyComponent');
  }, []);

  useEffect(() => {
    logComponent.effect('MyComponent', 'onUserChange');
  }, [user]);
}
```

### Performance Logging

```typescript
import { logPerformance, PerformanceSpan } from '@/core/dev/logger';

// Method 1: Manual timing
logPerformance.start('dataFetch');
const data = await fetchData();
logPerformance.end('dataFetch');

// Method 2: PerformanceSpan class
const span = new PerformanceSpan('heavyComputation');
doHeavyWork();
const duration = span.end(); // Returns duration in ms
```

### Authentication Logging

```typescript
import { logAuth } from '@/core/dev/logger';

logAuth.login('user123', 'google');
logAuth.token('refresh');
logAuth.error('Invalid credentials');
logAuth.logout('user123');
```

### Error Tracking

```typescript
import { logError } from '@/core/dev/logger';

try {
  // some operation
} catch (error) {
  logError('OPERATION', error, { context: 'important_data' }, 'ComponentName');
}
```

## Advanced Usage

### Filtering Logs

```typescript
import { useLogger } from '@/core/dev/logger';

const { getLogs } = useLogger();

// Get all ERROR and CRITICAL logs
const criticalLogs = getLogs({ level: ['ERROR', 'CRITICAL'] });

// Get logs from API category
const apiLogs = getLogs({ category: 'API' });

// Search in logs
const relatedLogs = getLogs({ search: 'user authentication' });

// Time range
const logsToday = getLogs({
  timeRange: {
    start: new Date().setHours(0, 0, 0, 0),
    end: Date.now(),
  },
});

// Combined filters
const failedRequests = getLogs({
  category: 'API',
  level: ['ERROR', 'WARN'],
  search: 'timeout',
});
```

### Hooks for Specific Log Types

```typescript
import {
  useLogger,
  useFilteredLogs,
  useCategoryLogs,
  useErrorLogs,
  useLogsByLevel,
} from '@/core/dev/logger';

// Get all logs
const { logs } = useLogger();

// Get filtered logs
const debugLogs = useFilteredLogs({ level: 'DEBUG' });

// Get logs from specific category
const apiLogs = useCategoryLogs('API');

// Get all errors and critical logs
const errorLogs = useErrorLogs();

// Get logs by specific levels
const warnings = useLogsByLevel(['WARN', 'ERROR']);
```

### Statistics

```typescript
import { useLogger } from '@/core/dev/logger';

const { stats } = useLogger();

// stats structure:
// {
//   total: 150,
//   byLevel: { DEBUG: 50, INFO: 40, WARN: 30, ERROR: 20, CRITICAL: 10 },
//   byCategory: { API: 60, COMPONENT: 50, REDUX: 40, ... }
// }
```

### Export Logs

```typescript
import { useLogger } from '@/core/dev/logger';

const { exportLogs } = useLogger();

// Export as JSON
const jsonData = exportLogs('json');

// Export as CSV
const csvData = exportLogs('csv');

// Download logs
const json = exportLogs('json');
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `logs-${Date.now()}.json`;
a.click();
```

### Configuration

```typescript
import { useLogger } from '@/core/dev/logger';

const { setConfig } = useLogger();

setConfig({
  maxLogs: 1000, // Keep max 1000 logs
  persistLogs: true, // Save to localStorage
  logLevel: 'INFO', // Only log INFO and above
  enableStackTrace: true, // Capture stack traces
});
```

## Log Console UI

### Opening the Console

Use the green floating console icon in the UI or add a button:

```typescript
import { useState } from 'react';
import { LogConsole } from '@/core/dev/logger';

function DebugPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Logs</button>
      <LogConsole open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

### Console Features

- **All Logs Tab**: View all logs with filtering and search
- **Statistics Tab**: View log counts by level and category
- **Categories Tab**: Browse logs organized by category
- **Export**: Download logs as JSON
- **Clear**: Clear all logs
- **Live Updates**: Updates in real-time as logs are created

## Best Practices

### 1. Use Consistent Categories

```typescript
// Good
logger.info('API', 'message');
logger.info('COMPONENT', 'message');
logger.info('REDUX', 'message');

// Avoid vague categories
logger.info('stuff', 'message');
```

### 2. Include Contextual Data

```typescript
// Good
logger.error('API', 'Request failed', { status: 404, endpoint: '/api/users' });

// Avoid
logger.error('API', 'Request failed');
```

### 3. Use Appropriate Log Levels

```typescript
// ✅ Correct usage
logger.debug('API', 'Request details', { params }); // Debug info
logger.info('AUTH', 'User logged in', { userId }); // Important events
logger.warn('API', 'Slow response', { duration }); // Warning conditions
logger.error('API', 'Request failed', { error }); // Errors
logger.critical('AUTH', 'Breach detected', { ... }); // Critical issues
```

### 4. Use Helper Functions

```typescript
// Good: Use logAPI, logComponent, etc.
import { logAPI, logComponent } from '@/core/dev/logger';

logAPI.request(endpoint, method, data);
logComponent.mount('MyComponent');

// Instead of
logger.debug('API', 'Request', data);
```

### 5. Add Source Information

```typescript
// Help identify where logs come from
logger.error('API', 'Failed to fetch', error, 'UserProfilePage');
logger.warn('PERFORMANCE', 'Slow query', data, 'AdminDashboard');
```

## Troubleshooting Guide

### Finding Issues

**1. Find all errors for a date:**
```typescript
const { getLogs } = useLogger();
const today = new Date().setHours(0, 0, 0, 0);
const errors = getLogs({
  level: ['ERROR', 'CRITICAL'],
  timeRange: { start: today, end: Date.now() }
});
```

**2. Track API issues:**
```typescript
const apiErrors = getLogs({ category: 'API', level: ['ERROR', 'WARN'] });
apiErrors.forEach(log => console.log(log.message, log.data));
```

**3. Monitor performance:**
```typescript
const perfLogs = useCategoryLogs('PERFORMANCE');
perfLogs.forEach(log => {
  if (log.data?.duration > 3000) {
    console.warn('Slow operation:', log.message);
  }
});
```

**4. Debug Redux issues:**
```typescript
const reduxLogs = useCategoryLogs('REDUX');
console.table(reduxLogs.map(log => ({
  type: log.message,
  timestamp: new Date(log.timestamp),
  data: log.data
})));
```

### Common Issues

**Issue: Logs not appearing**
- Check if LoggerProvider wraps your app
- Verify log level is not filtering them out
- Check browser console for errors

**Issue: Performance degradation**
- Reduce maxLogs: `setConfig({ maxLogs: 200 })`
- Disable persistence: `setConfig({ persistLogs: false })`
- Increase minimum log level: `setConfig({ logLevel: 'WARN' })`

**Issue: localStorage full**
- Clear old logs: `clearLogs()`
- Reduce maxLogs: `setConfig({ maxLogs: 100 })`
- Export and clear periodically

## Examples

### Example: Track a User Flow

```typescript
import { useLogger } from '@/core/dev/logger';

function CheckoutFlow() {
  const { info } = useLogger();

  const handleCheckout = async () => {
    info('CHECKOUT', 'Flow started', { storeId: 123 }, 'Checkout');
    
    const items = await fetchCart();
    info('CHECKOUT', 'Cart loaded', { itemCount: items.length }, 'Checkout');
    
    const payment = await processPayment(items);
    info('CHECKOUT', 'Payment processed', { orderId: payment.id }, 'Checkout');
  };
}
```

### Example: Debug API Performance

```typescript
import { logPerformance } from '@/core/dev/logger';

async function fetchWithLogging(url) {
  const span = new PerformanceSpan(`fetch-${url}`);
  try {
    const response = await fetch(url);
    span.end();
    return response;
  } catch (error) {
    span.end();
    throw error;
  }
}
```

## Direct Logger Access

For usage outside React components:

```typescript
import { logger } from '@/core/dev/logger';

// No React hooks needed
logger.info('INIT', 'Application starting');
logger.debug('CONFIG', 'User preferences', { theme: 'dark' });
logger.error('STARTUP', 'Failed to load config', error);
```

## Summary

| Feature | Method |
|---------|--------|
| Log message | `logger.info('CAT', 'message')` |
| Filter logs | `getLogs({ category: 'API' })` |
| View logs | Open LogConsole UI |
| Export | `exportLogs('json')` |
| Clear logs | `clearLogs()` |
| Get stats | `stats` from useLogger |
| Configure | `setConfig(...)` |

Happy debugging! 🚀
