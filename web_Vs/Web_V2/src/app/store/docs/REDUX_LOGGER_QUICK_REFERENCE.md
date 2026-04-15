# Redux Logger Quick Reference

## ⚡ 30-Second Setup

Open browser DevTools console and paste:

```javascript
// Check status
reduxLoggerControl.printStatus()

// Disable/Enable logging
reduxLoggerControl.setEnabled(false)
reduxLoggerControl.setEnabled(true)

// Control per feature
reduxLoggerControl.setFeatureLogging('cart', true)   // enable cart logs
reduxLoggerControl.setFeatureLogging('ui', false)    // disable UI logs
```

## 🎯 Common Commands

### Status & Diagnostics
```javascript
reduxLoggerControl.printStatus()           // Quick status table
reduxLoggerControl.getConfig()             // Full config object
reduxLoggerControl.exportConfig()          // JSON export
```

### Global Control
```javascript
reduxLoggerControl.setEnabled(true)        // Turn on all logging
reduxLoggerControl.setEnabled(false)       // Turn off all logging
reduxLoggerControl.reset()                 // Reset to defaults
```

### Feature Control
```javascript
// Enable/disable per feature
reduxLoggerControl.setFeatureLogging('auth', true)
reduxLoggerControl.setFeatureLogging('cart', true)
reduxLoggerControl.setFeatureLogging('restaurants', false)
reduxLoggerControl.setFeatureLogging('ui', false)
```

### Advanced Filtering
```javascript
// Only log cart actions
reduxLoggerControl.setConfig({
  actionFilter: {
    mode: 'whitelist',
    actions: ['cart/addItem', 'cart/removeItem', 'cart/checkout']
  }
})

// Log everything except noisy actions  
reduxLoggerControl.setConfig({
  actionFilter: {
    mode: 'blacklist',
    actions: ['ui/scroll', 'ui/hover']
  }
})
```

### Performance Monitoring
```javascript
// Monitor slow actions
reduxLoggerControl.setConfig({
  enablePerformanceMetrics: true,
  enableSlowActionWarning: true,
  slowActionThreshold: 100  // warn if > 100ms
})
```

### Data Privacy
```javascript
// Mask sensitive fields
reduxLoggerControl.setConfig({
  filterSensitiveData: true,
  sensitiveKeys: ['password', 'token', 'secret', 'apiKey']
})
```

## 📊 Log Output Format

```
[REDUX] action/type
Timestamp: 2026-04-06T10:30:45.123Z
Duration: 2.5ms
Payload: { ... }
Previous State: { ... }
Next State: { ... }
State Diff: { changed: { from: old, to: new } }
```

## 🔍 Finding Logs

### In Browser Console
```javascript
// All Redux logs
logger.getLogs({ category: 'REDUX' })

// Only warnings and errors
logger.getLogs({ 
  category: 'REDUX',
  level: ['WARN', 'ERROR']
})

// Search by action
logger.getLogs({ search: 'cart' })

// By time range
logger.getLogs({
  category: 'REDUX',
  timeRange: {
    start: Date.now() - 60000,  // last minute
    end: Date.now()
  }
})
```

## 🎛️ Configuration Templates

### Debug Everything
```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  logActions: true,
  logStateChanges: true,
  logPayloadData: true,
  logPreviousState: true,
  logNextState: true,
  logDiff: true,
  logDuration: true,
  prettyPrint: true,
  featureLogging: { auth: true, cart: true, restaurants: true, ui: true }
})
```

### Production-Safe (minimal)
```javascript
reduxLoggerControl.setConfig({
  enabled: false,  // Disabled in production by default
  filterSensitiveData: true,
  logDuration: true
})
```

### Focus on Cart
```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  featureLogging: {
    auth: false,
    cart: true,      // ← Only this
    restaurants: false,
    ui: false
  }
})
```

### Focus on Performance
```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  logActions: true,
  logDuration: true,
  enablePerformanceMetrics: true,
  enableSlowActionWarning: true,
  slowActionThreshold: 50,
  logStateChanges: false,  // Skip heavy logging
  logPreviousState: false
})
```

## 📋 Features by Configuration

| Setting | What It Does | Impact |
|---------|-------------|--------|
| `enabled` | Global on/off switch | Disables all logging |
| `logActions` | Log when actions dispatch | Shows what's happening |
| `logStateChanges` | Log when state updates | Shows side effects |
| `logDiff` | Show what changed in state | Useful for debugging |
| `logDuration` | Show action execution time | Performance insights |
| `featureLogging.auth` | Toggle auth/* actions | Control auth logs |
| `featureLogging.cart` | Toggle cart/* actions | Control cart logs |
| `featureLogging.restaurants` | Toggle restaurants/* actions | Control restaurant logs |
| `featureLogging.ui` | Toggle ui/* actions | Control UI logs (verbose) |
| `filterSensitiveData` | Mask passwords/tokens | Security |
| `enableSlowActionWarning` | Warn about slow actions | Performance issues |
| `slowActionThreshold` | Threshold for warnings (ms) | When to warn |
| `prettyPrint` | Nice console formatting | Readability |

## 💡 Pro Tips

1. **Disable UI logging** - It's very frequent and creates noise
   ```javascript
   reduxLoggerControl.setFeatureLogging('ui', false)
   ```

2. **Use whitelist mode** - Only log what you care about
   ```javascript
   reduxLoggerControl.setConfig({
     actionFilter: { mode: 'whitelist', actions: ['cart/checkout'] }
   })
   ```

3. **Monitor performance** - Find slow operations
   ```javascript
   reduxLoggerControl.setConfig({
     enableSlowActionWarning: true,
     slowActionThreshold: 50
   })
   ```

4. **Save your config** - It persists to localStorage automatically
   ```javascript
   // Set once, it's saved for next session
   reduxLoggerControl.setConfig({ /* ... */ })
   ```

5. **Export debug info** - Share with team
   ```javascript
   copy(reduxLoggerControl.exportConfig())
   copy(JSON.stringify(logger.getLogs({ category: 'REDUX' }), null, 2))
   ```

## 🚀 Workflow Examples

### Debug Cart Feature
```javascript
// Step 1: Focus on cart
reduxLoggerControl.setFeatureLogging('cart', true)
reduxLoggerControl.setFeatureLogging('auth', false)
reduxLoggerControl.setFeatureLogging('ui', false)
reduxLoggerControl.setFeatureLogging('restaurants', false)

// Step 2: Add item to cart in app
// (Watch logs in console)

// Step 3: Check logs
const cartLogs = logger.getLogs({ category: 'REDUX', search: 'cart' })
console.table(cartLogs)
```

### Find Slow Actions
```javascript
// Step 1: Enable performance monitoring
reduxLoggerControl.setConfig({
  enableSlowActionWarning: true,
  slowActionThreshold: 50
})

// Step 2: Use app normally
// (Warnings appear for actions > 50ms)

// Step 3: View all warnings
const warnings = logger.getLogs({
  category: 'REDUX',
  level: 'WARN'
})
console.table(warnings)
```

### State Mutation Analysis
```javascript
// Step 1: Enable detailed logging
reduxLoggerControl.setConfig({
  logStateChanges: true,
  logDiff: true,
  logPreviousState: true,
  logNextState: true
})

// Step 2: Trigger specific action
// (Watch console for before/after state)

// Step 3: Find breaking changes
const logs = logger.getLogs({ search: 'that broken feature' })
```

## 🎓 Understanding the Output

```javascript
// When you see:
// [REDUX] cart/addItem
// Duration: 2.5ms
// Payload: { foodItemId: '123', quantity: 2 }

// It means:
// - User dispatched cart/addItem action
// - It took 2.5ms to process
// - It passed a food item ID and quantity

// State Diff: { 
//   items: { from: [], to: [item] },
//   total: { from: 0, to: 500 }
// }
// This means: items array changed (empty → [item]), total changed (0 → 500)
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| No logs appearing | `reduxLoggerControl.setEnabled(true)` |
| Too many logs | `reduxLoggerControl.setFeatureLogging('ui', false)` |
| Logs not persisting | Check localStorage: `localStorage.getItem('zom2_redux_logger_config')` |
| Can't find reduxLoggerControl | Open DevTools on app page with Redux store |
| Sensitive data visible | `reduxLoggerControl.setConfig({ filterSensitiveData: true })` |

## 📚 See Also

- Full guide: `REDUX_LOGGER_IMPLEMENTATION_GUIDE.md`
- Logger system: `src/core/dev/logger/`
- Store config: `src/app/store/V/Store_V.ts`
- Middleware: `src/app/store/V/reduxLogger.middleware.ts`
- Config file: `src/app/store/V/reduxLogger.config.ts`

---

**Happy debugging!** 🎉  
Type `reduxLoggerControl.printStatus()` in console to get started.
