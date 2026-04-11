# Logger System - Quick Reference

## ✅ Setup Complete!
Logger is now available **everywhere** in your app via `LoggerProvider` in main.tsx

## Usage in 10 Seconds

```typescript
import { useLogger } from '@/core/dev/logger';

function MyComponent() {
  const { info, warn, error, debug } = useLogger();
  
  info('COMPONENT', 'Component loaded');
  error('COMPONENT', 'Something failed', { reason: 'network' });
}
```

## Basic Methods

| Method | Use When | Example |
|--------|----------|---------|
| `debug()` | Detailed tracing | `debug('API', 'Fetching user', { id: 123 })` |
| `info()` | General info | `info('PAGE', 'User logged in', { userId })` |
| `warn()` | Warnings | `warn('PERFORMANCE', 'Slow query', { ms: 5000 })` |
| `error()` | Errors | `error('API', 'Network failed', err)` |
| `critical()` | System failures | `critical('AUTH', 'Security breach detected')` |

## Specialized Helpers

```typescript
import { logAPI, logRedux, logComponent, logAuth, logPerformance } from '@/core/dev/logger';

// API
logAPI.request('/api/users', 'GET');
logAPI.response('/api/users', 200, data);
logAPI.error('/api/users', error);

// Redux/State
logRedux.action('fetchUsers', payload);
logRedux.state('users', newState);
logRedux.dispatch('fetchUsers/fulfilled');

// Components
logComponent.mount('HomePage');
logComponent.effect('HomePage', 'fetchData');
logComponent.unmount('HomePage');
logComponent.error('HomePage', error);

// Auth
logAuth.login('user123', 'google');
logAuth.logout('user123');
logAuth.error('Login failed', err);

// Performance
logPerformance.start('dataFetch');
// ... do work
logPerformance.end('dataFetch');
logPerformance.navigation('/dashboard');
```

## Accessing Logs

```typescript
const { logs, clearLogs, exportLogs } = useLogger();

// Get specific logs
const apiLogs = useCategoryLogs('API');
const errors = useErrorLogs();
const infoOnly = useLogsByLevel('INFO');

// Export/Debug
const jsonData = exportLogs('json');
const csvData = exportLogs('csv');
```

## DevContext Integration

DevContext now logs automatically:
```typescript
import { useDevContext } from '@/core/dev/contexts/DevContext';

const { setVersion } = useDevContext();
setVersion('HomePage', 'v2');  // ✨ Automatically logged!
```

## Console Output

All logs appear in browser console with colors:
- 🔵 DEBUG (Gray)
- 🔵 INFO (Blue)  
- 🟠 WARN (Orange)
- 🔴 ERROR (Red)
- 🔴 CRITICAL (Dark Red)

## Common Patterns

### API Interceptors
```typescript
apiClient.interceptors.request.use((config) => {
  logAPI.request(config.url, config.method, config.data);
  return config;
});
```

### Redux Middleware
```typescript
const middleware = (store) => (next) => (action) => {
  logRedux.action(action.type, action.payload);
  return next(action);
};
```

### Component Mount/Unmount
```typescript
useEffect(() => {
  logComponent.mount('MyComponent');
  return () => logComponent.unmount('MyComponent');
}, []);
```

### Error Boundaries
```typescript
componentDidCatch(error, errorInfo) {
  logComponent.error('ErrorBoundary', error);
}
```

### Performance Tracking
```typescript
const span = new PerformanceSpan('dataFetch');
// .. do work
span.end();  // Logs duration automatically
```

## Error Handling

```typescript
import { logError } from '@/core/dev/logger';

try {
  // ... code
} catch (err) {
  logError('FEATURE_NAME', err, { context: 'additional info' }, 'ComponentName');
}
```

## Configuration (if needed)

```typescript
const { setConfig } = useLogger();

setConfig({
  maxLogs: 500,           // Max logs to keep
  persistLogs: true,      // Save to localStorage
  logLevel: 'DEBUG',      // MIN: DEBUG|INFO|WARN|ERROR|CRITICAL
  enableStackTrace: true, // Stack traces for errors
  enableTimestamps: true, // Include timestamps
});
```

## Debugging Tips

1. **Check console** - All logs appear there with colors
2. **Search logs** - useFilteredLogs() to find specific logs
3. **Export logs** - exportLogs('json') for debugging issues
4. **Category filter** - useCategoryLogs('API') for specific category
5. **Error logs** - useErrorLogs() to see all errors
6. **DevTools** - localStorage key: `zom2_logs` contains logged data

## Files to Reference

- 📖 [LOGGER_SETUP_GUIDE.md](./LOGGER_SETUP_GUIDE.md) - Detailed setup
- 📋 [LOGGER_PRACTICAL_EXAMPLES.ts](./LOGGER_PRACTICAL_EXAMPLES.ts) - Copy-paste examples
- 📚 [src/core/dev/logger/LOGGER_GUIDE.md](./src/core/dev/logger/LOGGER_GUIDE.md) - Full documentation

## Common Questions

**Q: Can I use logger outside components?**
A: For components, use `useLogger()` hook. For non-React code, import `logger` directly:
```typescript
import { logger } from '@/core/dev/logger';
logger.info('CATEGORY', 'Message', data);
```

**Q: Where are logs stored?**
A: In memory + localStorage (configurable). Check localStorage under `zom2_logs`.

**Q: How much overhead?**
A: Minimal. In production, set `logLevel: 'WARN'` to reduce volume.

**Q: Can I disable logging?**
A: Yes, set `logLevel: 'CRITICAL'` to only show critical errors.

**Q: What about sensitive data?**
A: Never log passwords, tokens, or PII. Use context to mask sensitive info.

---

**You're all set! Start using the logger everywhere! 🚀**
