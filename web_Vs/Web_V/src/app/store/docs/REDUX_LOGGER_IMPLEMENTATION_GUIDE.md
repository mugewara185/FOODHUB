# Redux Logger System Implementation Guide

## Overview

A comprehensive Redux logging system has been implemented to track all state changes, actions, and performance metrics. The system is **highly configurable** with runtime toggles for on/off functionality per feature or globally.

## Files Created/Modified

### New Files

1. **`src/app/store/V/reduxLogger.config.ts`**
   - Central configuration for Redux logging
   - Runtime control class for toggling logs on/off
   - Feature-level and action-level filtering

2. **`src/app/store/V/reduxLogger.middleware.ts`**
   - Redux middleware that intercepts all actions
   - Logs state changes, payloads, and performance metrics
   - Pretty-prints logs to console

### Modified Files

3. **`src/app/store/V/Store_V.ts`**
   - Integrated Redux logger middleware into store
   - Added initialization logging
   - Made logger control globally accessible

## Features

### ✅ What Gets Logged

- **Actions**: All dispatched Redux actions with payloads
- **State Changes**: Before/after state with shallow diffs
- **Performance**: Action execution time
- **Warnings**: Actions that exceed slowness threshold
- **Features**: Logs are organized by Redux feature (auth, cart, restaurants, ui)

### ✅ Configurable Aspects

```typescript
interface ReduxLoggerConfig {
  // Global on/off
  enabled: boolean;

  // What to log
  logActions: boolean;
  logStateChanges: boolean;
  logPayloadData: boolean;
  logPreviousState: boolean;
  logNextState: boolean;
  logDiff: boolean;
  logDuration: boolean;

  // Performance tracking
  enablePerformanceMetrics: boolean;
  enableSlowActionWarning: boolean;
  slowActionThreshold: number; // milliseconds

  // Feature-level toggles
  featureLogging: {
    auth: boolean;      // auth/* actions
    cart: boolean;      // cart/* actions
    restaurants: boolean; // restaurants/* actions
    ui: boolean;        // ui/* actions
  };

  // Action filtering
  actionFilter: {
    mode: 'all' | 'whitelist' | 'blacklist';
    actions?: string[];
  };

  // Data sanitization
  filterSensitiveData: boolean;
  sensitiveKeys?: string[]; // password, token, secret, etc.

  // Pretty output
  prettyPrint: boolean;
  maxPayloadSize: number;

  // Storage
  persistLogs: boolean;
  maxStoredLogs: number;
}
```

## Usage

### Browser Console API

Everything is accessible via `reduxLoggerControl` in the browser console:

#### Check Current Status
```javascript
reduxLoggerControl.printStatus()
// Output:
// enabled: true
// Actions: true
// State Changes: true
// Performance: true
// Auth Logs: true
// Cart Logs: true
// Restaurant Logs: true
// UI Logs: false
```

#### Toggle Global Logging
```javascript
// Disable all Redux logging
reduxLoggerControl.setEnabled(false)

// Enable all Redux logging
reduxLoggerControl.setEnabled(true)
```

#### Toggle Feature-Specific Logging
```javascript
// Disable cart logging completely
reduxLoggerControl.setFeatureLogging('cart', false)

// Enable auth logging
reduxLoggerControl.setFeatureLogging('auth', true)

// Disable UI logging (it generates lots of logs)
reduxLoggerControl.setFeatureLogging('ui', false)
```

#### Check Configuration
```javascript
reduxLoggerControl.getConfig()

// Export as JSON
console.log(reduxLoggerControl.exportConfig())
```

#### Advanced: Custom Action Filtering
```javascript
// Only log specific actions
reduxLoggerControl.setConfig({
  actionFilter: {
    mode: 'whitelist',
    actions: ['@@INIT', 'auth/login', 'cart/addItem', 'cart/removeItem']
  }
})

// Blacklist noisy actions
reduxLoggerControl.setConfig({
  actionFilter: {
    mode: 'blacklist',
    actions: ['ui/updateLoadingState', '@@redux-persist/PERSIST']
  }
})
```

#### Update Configuration
```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  logActions: true,
  logStateChanges: true,
  enablePerformanceMetrics: true,
  featureLogging: {
    auth: true,
    cart: true,
    restaurants: false,
    ui: false,
  }
})
```

#### Reset to Defaults
```javascript
reduxLoggerControl.reset()
```

## Log Output Format

### Console Output Example

```
[REDUX] auth/login
┌─────────────────────────────────
│ Timestamp: 2026-04-06T10:30:45.123Z
│ Duration: 2.5ms
│ Payload: { email: "user@example.com", password: "***MASKED***" }
│ Previous State: { auth: { user: null, isLoggedIn: false, ... } }
│ Next State: { auth: { user: { id, email, role, ... }, isLoggedIn: true, ... } }
│ State Diff: { 
│     user: { from: null, to: { id, email, role } },
│     isLoggedIn: { from: false, to: true }
│   }
└─────────────────────────────────

[REDUX] cart/addItem
┌─────────────────────────────────
│ Timestamp: 2026-04-06T10:30:45.456Z
│ Duration: 1.2ms
│ Payload: { 
│     foodItemId: "123",
│     quantity: 2,
│     restaurantId: "456"
│   }
│ State Diff: {
│     items: { from: [], to: [...items] },
│     total: { from: 0, to: 500 }
│   }
└─────────────────────────────────
```

### Logger System Integration

Logs are also stored in the global logger system:

```javascript
// Access all Redux logs
logger.getLogs({ category: 'REDUX' })

// Filter only warnings and errors
logger.getLogs({ 
  category: 'REDUX',
  level: ['WARN', 'ERROR']
})

// Filter by action type
logger.getLogs({
  search: 'auth/login'
})
```

## Common Use Cases

### 1. Debug a Specific Action

```javascript
// Focus on cart actions only
reduxLoggerControl.setConfig({
  actionFilter: {
    mode: 'whitelist',
    actions: ['cart/addItem', 'cart/removeItem', 'cart/updateQuantity', 'cart/clear']
  }
})

// Manually trigger action in your app...
// Watch logs appear for only cart actions
```

### 2. Monitor Performance

```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  logDuration: true,
  enableSlowActionWarning: true,
  slowActionThreshold: 50, // warn if > 50ms
  featureLogging: {
    auth: true,
    cart: true,
    restaurants: true,
    ui: false // UI actions are frequent
  }
})

// Watch for slow actions in console
// Will warn if any action takes > 50ms
```

### 3. Disable Verbose Logging During Testing

```javascript
// Disable all logging for cleaner test output
reduxLoggerControl.setEnabled(false)

// Run tests...

// Re-enable when done
reduxLoggerControl.setEnabled(true)
```

### 4. Focus on Auth Flow

```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  featureLogging: {
    auth: true,
    cart: false,
    restaurants: false,
    ui: false
  }
})

// Only logs auth/* actions
```

### 5. Monitor State Mutations

```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  logStateChanges: true,
  logDiff: true,
  logPreviousState: true,
  logNextState: true
})

// See complete before/after state with diffs
```

## Development Workflow

### Setup for Development Session

```javascript
// On app startup in browser console:

// 1. Check status
reduxLoggerControl.printStatus()

// 2. Enable feature you're debugging
reduxLoggerControl.setFeatureLogging('cart', true)

// 3. Disable noisy features
reduxLoggerControl.setFeatureLogging('ui', false)

// 4. Trigger your feature
// (e.g., add item to cart, login, etc.)

// 5. Review logs in console
logger.getLogs({ category: 'REDUX' })
```

### Persist Custom Config

Custom configurations are **automatically saved to localStorage** and restored on page refresh:

```javascript
// Set custom config
reduxLoggerControl.setConfig({ /* your config */ })

// Refresh page (F5)

// Config is restored from localStorage!
```

### Export Logs for Analysis

```javascript
// Get all Redux logs
const reduxLogs = logger.getLogs({ category: 'REDUX' })

// Copy to clipboard
copy(JSON.stringify(reduxLogs, null, 2))

// Email to team, upload to issue tracker, etc.
```

## Best Practices

### 1. Start with Enabling What You Need

```javascript
// ❌ Don't enable everything
reduxLoggerControl.setEnabled(true)

// ✅ Do enable specific features
reduxLoggerControl.setConfig({
  enabled: true,
  featureLogging: {
    auth: true,    // feature you're debugging
    cart: false,   // disable others
    restaurants: false,
    ui: false,
  }
})
```

### 2. Use Action Filtering for Noisy Actions

```javascript
// ❌ Don't log every UI action (too verbose)
reduxLoggerControl.setFeatureLogging('ui', true)

// ✅ Do whitelist specific UI actions
reduxLoggerControl.setConfig({
  actionFilter: {
    mode: 'whitelist',
    actions: ['ui/openModal', 'ui/closeModal', 'ui/toggleSidebar']
  }
})
```

### 3. Disable Sensitive Data Logging When Sharing

```javascript
// ❌ Don't share logs with passwords visible
reduxLoggerControl.setConfig({
  filterSensitiveData: false
})

// ✅ Do mask sensitive data before sharing
reduxLoggerControl.setConfig({
  filterSensitiveData: true,
  sensitiveKeys: ['password', 'token', 'secret', 'apiKey', 'email']
})
```

### 4. Clean Up When Done Debugging

```javascript
// Reset to defaults
reduxLoggerControl.reset()

// Or disable logging
reduxLoggerControl.setEnabled(false)
```

## Integration with Application Code

### Programmatic Control in Components

If you need to control logging from your React components:

```typescript
import { reduxLoggerControl } from '@app/store/V/reduxLogger.config';

const DebugPanel: React.FC = () => {
  const toggleLogging = () => {
    const config = reduxLoggerControl.getConfig();
    reduxLoggerControl.setEnabled(!config.enabled);
  };

  return (
    <button onClick={toggleLogging}>
      Toggle Redux Logging
    </button>
  );
};
```

### Dispatch Custom Logs

To log custom Redux events alongside actions:

```typescript
import { logger, logRedux } from '@core/dev/logger';

// In a thunk or event handler
logRedux.action('customEvent/myAction', { data: 'value' });
logger.info('REDUX', 'Custom event logged', { reason: 'debugging' });
```

## Troubleshooting

### Issue: Logs Not Appearing

```javascript
// Check if logging is enabled
reduxLoggerControl.getConfig().enabled  // should be true

// Check if feature is enabled
reduxLoggerControl.getConfig().featureLogging.cart  // should be true

// Check if action is filtered out
reduxLoggerControl.shouldLogAction('cart/addItem')  // should be true

// Solution: Enable explicitly
reduxLoggerControl.setEnabled(true)
reduxLoggerControl.setFeatureLogging('cart', true)
```

### Issue: Too Many Logs

```javascript
// Solution: Disable verbose logging
reduxLoggerControl.setConfig({
  logStateChanges: false,
  logDiff: false,
  logPreviousState: false,
  logNextState: false,
  featureLogging: {
    ui: false  // UI logs are frequent
  }
})
```

### Issue: Need to See Everything

```javascript
// Enable maximum logging
reduxLoggerControl.setConfig({
  enabled: true,
  logActions: true,
  logStateChanges: true,
  logPayloadData: true,
  logPreviousState: true,
  logNextState: true,
  logDiff: true,
  logDuration: true,
  enablePerformanceMetrics: true,
  prettyPrint: true,
  featureLogging: {
    auth: true,
    cart: true,
    restaurants: true,
    ui: true  // Warning: will be very verbose
  }
})
```

## Performance Considerations

### Development

- Use selective logging (enable only the features you're debugging)
- Disable UI logging as it's very frequent
- Disable state snapshot logging if you're working with large state objects

### Production (NOT RECOMMENDED)

Redux logger is disabled in production (`IS_DEV` check). If you need logging in production:
1. Migrate logs to a proper analytics service
2. Never enable full state logging (security/performance issue)
3. Consider using Redux DevTools browser extension instead

## Summary

The Redux logger system provides:

✅ **Comprehensive Tracking** - All actions, state changes, and performance metrics  
✅ **Fine-Grained Control** - Enable/disable per feature or globally  
✅ **Runtime Toggle** - No need to reload app to change logging  
✅ **Integration** - Works with existing logger system  
✅ **Security** - Masks sensitive data by default  
✅ **Performance** - Configurable thresholds for slow actions  
✅ **Debugging** - Pretty console output for easy reading  
✅ **Persistence** - Configs saved to localStorage  

Open browser DevTools and type `reduxLoggerControl.printStatus()` to get started! 🚀
