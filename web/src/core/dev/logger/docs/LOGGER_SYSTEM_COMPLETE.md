# Logger System - Complete Setup Summary

## ✅ What's Already Done

Your logger system is **fully integrated** and ready to use everywhere!

### 1. ✅ LoggerProvider Installed (main.tsx)
- Wraps your entire app
- Available in **all React components** globally
- No additional setup needed per component

### 2. ✅ DevContext Enhanced with Logger
- Automatically logs version switches
- Logs when versions are registered/unregistered
- Tracks dev environment changes

### 3. ✅ Documentation Created
- **LOGGER_QUICK_REFERENCE.md** - For quick lookup (1-2 minutes)
- **LOGGER_SETUP_GUIDE.md** - Complete setup documentation (5-10 minutes)
- **LOGGER_PRACTICAL_EXAMPLES.ts** - Copy-paste code for all scenarios (10-30 minutes)
- **LoggerTest.tsx** - Test component to verify it works

---

## 🚀 Get Started in 3 Steps

### Step 1: Test It Works (2 minutes)
```typescript
// Add this to any component temporarily:
import { useLogger } from '@/core/dev/logger';

function MyComponent() {
  const { info } = useLogger();
  
  useEffect(() => {
    info('TEST', 'Logger is working!', { timestamp: new Date() });
  }, []);
  
  return <div>Check console for logs</div>;
}
```

Open browser DevTools (F12) → Console tab → You should see blue/green colored logs!

### Step 2: Use in Your API Service (5 minutes)
Copy this pattern from `LOGGER_PRACTICAL_EXAMPLES.ts` into `src/services/api/client.ts`:
```typescript
import { logAPI } from '@/core/dev/logger';

apiClient.interceptors.request.use((config) => {
  logAPI.request(config.url, config.method, config.data);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    logAPI.response(response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    logAPI.error(error.config?.url, error);
    return Promise.reject(error);
  }
);
```

### Step 3: Use in Redux (5 minutes)
Copy middleware from `LOGGER_PRACTICAL_EXAMPLES.ts` into `src/app/store/`:
```typescript
import { logRedux } from '@/core/dev/logger';

const loggingMiddleware = (store) => (next) => (action) => {
  logRedux.action(action.type, action.payload);
  const result = next(action);
  logRedux.dispatch(action.type);
  return result;
};
```

---

## 📚 What You Can Use Now

### In Components
```typescript
import { useLogger } from '@/core/dev/logger';

const { info, warn, error, debug, critical } = useLogger();

// All of these work:
info('CATEGORY', 'message', optionalData, 'ComponentName');
error('API', 'Failed request', { error }, 'UserProfile');
debug('COMPONENT', 'State changed', { newState }, 'HomePage');
```

### Specialized Loggers
```typescript
import { logAPI, logRedux, logComponent, logAuth, logPerformance } from '@/core/dev/logger';

logAPI.request(url, method, data);        // Log API calls
logRedux.action(type, payload);           // Log Redux actions
logComponent.mount('ComponentName');      // Log lifecycle
logAuth.login(userId, method);            // Log auth events
logPerformance.start('label');            // Track performance
```

### Getting Logs
```typescript
import { useLogger, useCategoryLogs, useErrorLogs, useLogsByLevel } from '@/core/dev/logger';

const { logs, exportLogs, clearLogs } = useLogger();
const apiLogs = useCategoryLogs('API');
const errors = useErrorLogs();
const infoOnly = useLogsByLevel('INFO');

console.log(exportLogs('json'));  // Export as JSON
console.log(exportLogs('csv'));   // Export as CSV
```

---

## 📋 Copy-Paste Templates

All templates are in `LOGGER_PRACTICAL_EXAMPLES.ts`. Here are the main ones:

### API Service
```typescript
// src/services/api/client.ts
import { logAPI } from '@/core/dev/logger';

// See LOGGER_PRACTICAL_EXAMPLES.ts for full implementation
```

### Redux Middleware
```typescript
// src/app/store/index.ts
import { logRedux } from '@/core/dev/logger';

// See LOGGER_PRACTICAL_EXAMPLES.ts for full implementation
```

### Component
```typescript
// src/pages/Home/HomePage.tsx
import { useLogger, logComponent } from '@/core/dev/logger';

// See LOGGER_PRACTICAL_EXAMPLES.ts for full implementation
```

### Error Boundary
```typescript
// src/shared/components/ErrorBoundary.tsx
import { logComponent, logError } from '@/core/dev/logger';

// See LOGGER_PRACTICAL_EXAMPLES.ts for full implementation
```

### Custom Hook
```typescript
// src/shared/hooks/useAsync.ts
import { useLogger, logPerformance } from '@/core/dev/logger';

// See LOGGER_PRACTICAL_EXAMPLES.ts for full implementation
```

---

## 🧪 Test It Works

Created `src/core/dev/components/LoggerTest.tsx` - a test component with buttons to verify all logging types work.

To use it temporarily:
```typescript
// In your App.tsx or a test page:
import { LoggerTest } from '@/core/dev/components/LoggerTest';

export default function App() {
  return (
    <div>
      <LoggerTest />
      {/* rest of app */}
    </div>
  );
}
```

Then click buttons and check browser console for colored logs!

---

## 🎯 Implementation Checklist

Order of implementation (easiest to hardest):

- [ ] **Test basic logging** - Add `useLogger()` to one component, verify console shows logs
- [ ] **API logging** - Copy interceptor pattern from examples, test with API calls
- [ ] **Component logging** - Add mount/unmount/effect logging to 2-3 key components
- [ ] **Redux logging** - Add middleware to store, test with actions
- [ ] **Auth logging** - Add to login/logout flows
- [ ] **Performance logging** - Track slow operations
- [ ] **Error handling** - Use `logError()` in try-catch blocks
- [ ] **Debug panel** - Optional: Create UI to view logs (see examples)

---

## 🔍 Where to Find Things

| What | Where |
|------|-------|
| Quick lookup | **LOGGER_QUICK_REFERENCE.md** (this directory) |
| Setup details | **LOGGER_SETUP_GUIDE.md** (this directory) |
| Code examples | **LOGGER_PRACTICAL_EXAMPLES.ts** (this directory) |
| Logger core | **src/core/dev/logger/** |
| Logger context | **src/core/dev/logger.tsx** |
| Test component | **src/core/dev/components/LoggerTest.tsx** |
| Updated config | **src/core/dev/contexts/DevContext.tsx** |

---

## 💡 Common Use Cases

### "I want to log all API calls"
→ Use `logAPI` in axios/fetch interceptors (see examples)

### "I want to track component lifecycle"
→ Use `logComponent.mount()` / `.unmount()` in useEffect (see examples)

### "I want to log Redux actions"
→ Add middleware or use `logRedux` in extraReducers (see examples)

### "I want to track performance"
→ Use `logPerformance.start()` / `.end()` around slow code

### "I want to see all logs in the UI"
→ Create debug panel using `useLogger()` hook (see examples)

### "I want to export logs for debugging"
→ Call `exportLogs('json')` or `exportLogs('csv')`

---

## ⚙️ Configuration (if needed)

Most defaults are good, but you can customize:

```typescript
const { setConfig } = useLogger();

setConfig({
  maxLogs: 500,           // Keep last 500 logs
  persistLogs: true,      // Save to localStorage
  logLevel: 'DEBUG',      // Show all levels (use 'WARN' in production)
  enableStackTrace: true, // Include stack traces
  enableTimestamps: true, // Include timestamps
  groupByCategory: true,  // Group by category
});
```

---

## 🎓 Best Practices

1. **Use clear categories** - 'API', 'COMPONENT', 'REDUX', 'AUTH', 'PERFORMANCE'
2. **Include source** - Always add component/function name as 4th parameter
3. **Don't log sensitive data** - Never log passwords, tokens, PII
4. **Use appropriate levels**:
   - `debug()` - Detailed tracing
   - `info()` - General info
   - `warn()` - Warning conditions
   - `error()` - Error conditions
   - `critical()` - System failures
5. **In production** - Set `logLevel: 'WARN'` to reduce volume
6. **For performance** - Use `logPerformance` and `PerformanceSpan`

---

## ❓ Troubleshooting

### "useLogger is not defined"
→ Make sure you're inside a component (not at module level)
→ Check LoggerProvider is wrapping your app (it is, in main.tsx)

### "Logs not appearing in console"
→ Open DevTools (F12) → Console tab
→ Check logLevel isn't higher than your log level
→ Refresh page (F5)

### "Logs not persisting"
→ Check localStorage has space
→ Verify `persistLogs: true` in config
→ Check browser privacy settings allow localStorage

### "Too many logs"
→ Reduce `maxLogs` in config
→ Set `logLevel: 'WARN'` or higher
→ Clear logs with `clearLogs()`

---

## 📞 Need Help?

1. **For quick reference** → Read LOGGER_QUICK_REFERENCE.md (this directory)
2. **For detailed setup** → Read LOGGER_SETUP_GUIDE.md (this directory)  
3. **For code examples** → Open LOGGER_PRACTICAL_EXAMPLES.ts (this directory)
4. **For full docs** → See src/core/dev/logger/LOGGER_GUIDE.md
5. **To test** → Run LoggerTest component

---

## 🎉 You're Ready!

The logger system is fully integrated into your app. Start using it in any component:

```typescript
import { useLogger } from '@/core/dev/logger';

function MyComponent() {
  const { info } = useLogger();
  
  useEffect(() => {
    info('COMPONENT', 'Component loaded');
  }, []);
  
  return <div>Your component here</div>;
}
```

**Happy logging! 🚀**
