# Logger System Setup & Usage Guide

## Quick Setup (3 Steps)

### Step 1: Initialize LoggerProvider in main.tsx
The `LoggerProvider` wraps your app and provides the logger context globally.

```typescript
import { LoggerProvider } from '@/core/dev/logger';

// In your root render
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoggerProvider>
      <BrowserRouter>
        <Provider store={store}>
          <DevProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <App />
            </ThemeProvider>
          </DevProvider>
        </Provider>
      </BrowserRouter>
    </LoggerProvider>
  </React.StrictMode>,
);
```

### Step 2: Using Logger in Components
```typescript
import { useLogger } from '@/core/dev/logger';

function MyComponent() {
  const { info, error, warn, debug } = useLogger();

  useEffect(() => {
    info('COMPONENT', 'Component mounted', { props });
  }, []);

  return <div>...</div>;
}
```

### Step 3: Using Specialized Loggers
```typescript
import { logAPI, logRedux, logComponent, logAuth, logPerformance } from '@/core/dev/logger';

// API calls
logAPI.request('/api/users', 'GET');
logAPI.response('/api/users', 200, data);
logAPI.error('/api/users', error);

// Redux/State
logRedux.action('fetchUsers', payload);
logRedux.state('users', newState);

// Components
logComponent.mount('UserProfile');
logComponent.effect('UserProfile', 'fetchUserData');
logComponent.unmount('UserProfile');

// Auth
logAuth.login('user123', 'google');
logAuth.error('Authentication failed', error);

// Performance
logPerformance.navigation('/dashboard');
logPerformance.start('dataFetch');
// ... do work
logPerformance.end('dataFetch');
```

## Available Logging Methods

### Basic Methods (from `useLogger()` hook)
- `debug(category, message, data?, source?)` - Detailed debugging info
- `info(category, message, data?, source?)` - General information
- `warn(category, message, data?, source?)` - Warning conditions
- `error(category, message, data?, source?)` - Error conditions
- `critical(category, message, data?, source?)` - Critical failures

### Specialized Helpers
- `logAPI.request() | .response() | .error()`
- `logRedux.action() | .dispatch() | .state()`
- `logComponent.mount() | .unmount() | .render() | .effect() | .error()`
- `logAuth.login() | .logout() | .error() | .token()`
- `logPerformance.start() | .end() | .navigation()`
- `logError()` - Error tracking with context
- `logWithThreshold()` - Warning with threshold
- `exportDebugInfo()` - Get all logs for debugging

## DevContext Integration
Logger is automatically available in DevContext and all components. Use it anywhere without additional setup.

## Examples by Use Case

### API Service (services/api/*)
```typescript
import { logAPI } from '@/core/dev/logger';

export const apiClient = axios.create({...});

apiClient.interceptors.request.use((config) => {
  logAPI.request(config.url || '', config.method || 'GET', config.data);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    logAPI.response(response.config.url || '', response.status, response.data);
    return response;
  },
  (error) => {
    logAPI.error(error.config?.url || 'unknown', error);
    return Promise.reject(error);
  }
);
```

### Redux (app/store/*)
```typescript
import { logRedux } from '@/core/dev/logger';

// In middleware
const loggingMiddleware = (store) => (next) => (action) => {
  logRedux.action(action.type, action.payload);
  const result = next(action);
  logRedux.dispatch(action.type);
  return result;
};

// In slice extraReducers
extraReducers: (builder) => {
  builder
    .addCase(fetchUsers.pending, () => {
      logRedux.dispatch('fetchUsers/pending');
    })
    .addCase(fetchUsers.fulfilled, (state, action) => {
      logRedux.state('users', action.payload);
    });
}
```

### Routes & Navigation (app/routes/*)
```typescript
import { useLogger, logPerformance } from '@/core/dev/logger';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RouteTracker() {
  const { pathname } = useLocation();
  const { info } = useLogger();

  useEffect(() => {
    logPerformance.navigation(pathname);
    info('NAVIGATION', `Navigated to ${pathname}`);
  }, [pathname]);

  return null;
}
```

### Error Boundary
```typescript
import { logComponent, logError } from '@/core/dev/logger';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('ERROR_BOUNDARY', error, {
      componentStack: errorInfo.componentStack,
    }, 'ErrorBoundary');

    logComponent.error('ErrorBoundary', error);
  }

  render(): ReactNode {
    // ... render fallback UI
  }
}
```

## Configuration Options

```typescript
import { useLogger } from '@/core/dev/logger';

const { setConfig } = useLogger();

setConfig({
  maxLogs: 500,           // Maximum logs to keep in memory
  persistLogs: true,      // Save logs to localStorage
  logLevel: 'DEBUG',      // Minimum log level to capture
  enableStackTrace: true, // Include stack traces for errors
  enableTimestamps: true, // Include timestamps
  groupByCategory: true,  // Group logs by category
});
```

## Accessing Logs

### In Component
```typescript
import { useLogger, useFilteredLogs, useCategoryLogs } from '@/core/dev/logger';

function DebugPanel() {
  const { logs, clearLogs, exportLogs } = useLogger();
  const apiLogs = useCategoryLogs('API');
  const errors = useErrorLogs();
  const infoLogs = useLogsByLevel('INFO');

  return (
    <div>
      <p>Total logs: {logs.length}</p>
      <button onClick={() => clearLogs()}>Clear</button>
      <button onClick={() => console.log(exportLogs('json'))}>Export JSON</button>
    </div>
  );
}
```

### In DevContext or Custom Hook
```typescript
import { logger } from '@/core/dev/logger';

// Access logger instance directly (outside React)
const logs = logger.getLogs({ category: 'API' });
const stats = logger.getStats();
const exported = logger.exportLogs('json');
```

## Best Practices

1. **Use Categories**: Always use clear category names (API, COMPONENT, REDUX, AUTH, etc.)
2. **Include Source**: Add the component/function name as source for tracking
3. **Log Context**: Include relevant data in the data parameter for debugging
4. **Performance**: Use `logPerformance` and `PerformanceSpan` for timing
5. **Errors**: Use `logError()` for full error context or `logComponent.error()` in error boundaries
6. **API**: Use `logAPI` helpers in interceptors for automatic request/response logging

## DevContext Integration
DevContext now automatically logs version switches:
```typescript
const { setVersion } = useDevContext();
setVersion('HomePage', 'v2');  // Automatically logged
```

## Console Output
All logs appear in the browser console with color-coding:
- 🔵 DEBUG (Gray)
- 🔵 INFO (Blue)
- 🟠 WARN (Orange)
- 🔴 ERROR (Red)
- 🔴 CRITICAL (Dark Red)

## Troubleshooting

### "useLogger must be used within LoggerProvider"
Make sure `LoggerProvider` wraps your app in main.tsx

### Logs not persisting
Check that `persistLogs: true` is set in config and you have localStorage access

### Performance impact
Adjust `maxLogs` config to lower value if too many logs are stored

## Next Steps
1. ✅ Add LoggerProvider to main.tsx
2. ✅ Try useLogger in a component
3. ✅ Integrate logAPI in your API service
4. ✅ Add Redux logging in middleware
5. ✅ Create a debug panel using LogConsole component
