# Logger System - Quick Reference

## 📁 File Structure

```
core/dev/logger/
├── types.ts                  # TypeScript types and interfaces
├── Logger.ts                 # Core logger class (singleton)
├── LoggerContext.tsx         # React context and hooks
├── LogConsole.tsx            # Debug UI component
├── logUtils.ts               # Helper functions for common patterns
├── index.ts                  # Main export file
├── LOGGER_GUIDE.md           # Complete documentation
└── SETUP_EXAMPLES.ts         # Integration examples
```

## 🚀 Quick Start (30 seconds)

### 1. Wrap App with Provider
```typescript
import { LoggerProvider } from '@/core/dev/logger';

<LoggerProvider>
  <YourApp />
</LoggerProvider>
```

### 2. Use in Components
```typescript
import { useLogger } from '@/core/dev/logger';

const { info, error, warn } = useLogger();

info('COMPONENT', 'Something happened', { data });
```

### 3. View Logs
Open the green **Log Console** UI or programmatically:
```typescript
const { getLogs, stats } = useLogger();
```

---

## 📊 Log Levels

```
DEBUG    → Detailed debugging info
INFO     → Important events
WARN     → Warning conditions  
ERROR    → Error conditions
CRITICAL → Critical failures
```

---

## 🎯 Common Tasks

### Log API Request
```typescript
import { logAPI } from '@/core/dev/logger';

logAPI.request('/api/users', 'GET', { id: 123 });
logAPI.response('/api/users', 200, data);
logAPI.error('/api/users', error);
```

### Log Redux State
```typescript
import { logRedux } from '@/core/dev/logger';

logRedux.action('fetchUsers', payload);
logRedux.state('users', newState);
```

### Log Component Lifecycle
```typescript
import { logComponent } from '@/core/dev/logger';

useEffect(() => {
  logComponent.mount('MyComponent');
  return () => logComponent.unmount('MyComponent');
}, []);
```

### Measure Performance
```typescript
import { PerformanceSpan } from '@/core/dev/logger';

const span = new PerformanceSpan('operation-name');
doWork();
const duration = span.end(); // in ms
```

### Log Authentication
```typescript
import { logAuth } from '@/core/dev/logger';

logAuth.login('user123', 'google');
logAuth.error('Login failed', error);
logAuth.logout('user123');
```

---

## 🔍 Finding Issues

### Get All Errors
```typescript
const { getLogs } = useLogger();
const errors = getLogs({ level: ['ERROR', 'CRITICAL'] });
```

### Find API Issues
```typescript
const apiErrors = getLogs({ category: 'API', level: 'ERROR' });
```

### Search in Logs
```typescript
const results = getLogs({ search: 'authentication' });
```

### Get Logs by Category
```typescript
const componentLogs = useCategoryLogs('COMPONENT');
```

### Get Statistics
```typescript
const { stats } = useLogger();
// stats.total, stats.byLevel, stats.byCategory
```

---

## 💾 Storage & Export

### Clear Logs
```typescript
const { clearLogs } = useLogger();
clearLogs();
```

### Export as JSON
```typescript
const { exportLogs } = useLogger();
const json = exportLogs('json');
// Download via UI or saveFile()
```

### Direct Access (No React)
```typescript
import { logger } from '@/core/dev/logger';

logger.info('INIT', 'App starting');
logger.getLogs({ category: 'API' });
```

---

## ⚙️ Configuration

```typescript
const { setConfig } = useLogger();

setConfig({
  maxLogs: 500,              // Keep max 500 logs
  persistLogs: true,         // Save to localStorage
  logLevel: 'DEBUG',         // Minimum level to log
  enableStackTrace: true,    // Capture stack traces
  enableTimestamps: true,    // Include timestamps
});
```

---

## 🪝 React Hooks

```typescript
// Get all logs
const { logs } = useLogger();

// Get filtered logs
const debugLogs = useFilteredLogs({ level: 'DEBUG' });

// Get by category
const apiLogs = useCategoryLogs('API');

// Get errors only
const errors = useErrorLogs();

// Get by level
const warnings = useLogsByLevel(['WARN', 'ERROR']);
```

---

## 🎓 Best Practices

✅ **DO:**
- Use consistent category names (API, COMPONENT, REDUX, etc.)
- Include relevant context data as 3rd parameter
- Use helper functions (logAPI, logComponent, etc.)
- Add source parameter to identify origin

❌ **DON'T:**
- Spam with DEBUG logs in production
- Log sensitive information (passwords, tokens)
- Use vague categories like "stuff"
- Forget to log errors with context

---

## 🔗 Integration Points

### API Services
```typescript
// Intercept API calls
apiClient.interceptors.request.use(config => {
  logAPI.request(config.url, config.method, config.data);
  return config;
});
```

### Redux Middleware
```typescript
const middleware = store => next => action => {
  logRedux.action(action.type);
  return next(action);
};
```

### Error Boundaries
```typescript
componentDidCatch(error, info) {
  logError('COMPONENT', error, info);
}
```

### Route Changes
```typescript
useEffect(() => {
  logPerformance.navigation(location.pathname);
}, [location]);
```

---

## 📈 Real-World Examples

### Example 1: Track User Flow
```typescript
const { info } = useLogger();

const handleCheckout = async () => {
  info('CHECKOUT', 'Started', {}, 'CheckoutFlow');
  const cart = await getCart();
  info('CHECKOUT', 'Cart loaded', { items: cart.length });
  const order = await createOrder(cart);
  info('CHECKOUT', 'Completed', { orderId: order.id });
};
```

### Example 2: Debug API Performance
```typescript
import { PerformanceSpan } from '@/core/dev/logger';

async function fetchData(url) {
  const span = new PerformanceSpan(`fetch-${url}`);
  try {
    const data = await fetch(url);
    const duration = span.end();
    if (duration > 3000) warn('PERFORMANCE', 'Slow fetch', { url, duration });
    return data;
  } catch (error) {
    span.end();
    error('API', 'Fetch failed', { url, error });
  }
}
```

### Example 3: Error Tracking
```typescript
try {
  // risky operation
} catch (error) {
  logError('OPERATION', error, {
    operation: 'saveData',
    userId: currentUser.id,
    recoverable: true,
  }, 'DataService');
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Logs not showing | Check LoggerProvider wraps app, check log level |
| Performance slow | Reduce maxLogs, disable persistence in dev |
| localStorage full | Export logs and clear them |
| Can't find issue | Use filters/search in Log Console |
| Stack trace empty | Set enableStackTrace: true in config |

---

## 📚 Documentation Files

- **LOGGER_GUIDE.md** - Complete comprehensive guide
- **SETUP_EXAMPLES.ts** - Real integration examples
- **types.ts** - All TypeScript types
- **logUtils.ts** - Helper function reference

---

## 💡 Pro Tips

1. **Use categories consistently** across your app for easier filtering
2. **Add context data** to all logs (user ID, component name, etc.)
3. **Monitor performance** with PerformanceSpan for critical operations
4. **Export logs** periodically for analysis and debugging
5. **Use Log Console UI** to visualize patterns and find root causes
6. **Set up alerts** for CRITICAL logs in production
7. **Integrate with error tracking** service like Sentry

---

## 📞 Support

For detailed usage examples, see **SETUP_EXAMPLES.ts**
For complete API reference, see **LOGGER_GUIDE.md**

Happy debugging! 🚀
