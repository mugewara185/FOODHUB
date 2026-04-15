# Redux Logger - Visual Quick Start

## 🔴 ONE MINUTE START

Open DevTools (F12) and paste:
```javascript
reduxLoggerControl.printStatus()
```

## 🟡 FIVE MINUTE SETUP

### Step 1: See What's Happening
```javascript
reduxLoggerControl.setEnabled(true)
```

### Step 2: Focus on One Feature
```javascript
// Only log cart actions
reduxLoggerControl.setFeatureLogging('cart', true)
reduxLoggerControl.setFeatureLogging('auth', false)
reduxLoggerControl.setFeatureLogging('ui', false)
reduxLoggerControl.setFeatureLogging('restaurants', false)
```

### Step 3: Trigger Action in App
Click "Add to Cart" button or perform action

### Step 4: Check Console
Look for:
```
[REDUX] cart/addItem
Duration: 2.5ms
Payload: {...}
State Diff: {items, total}
```

## 🟢 DEVELOPER WORKFLOW

```
What you want to do          Command
━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Check status                 reduxLoggerControl.printStatus()
Turn off all logging         reduxLoggerControl.setEnabled(false)
Turn on all logging          reduxLoggerControl.setEnabled(true)
Log only cart feature        reduxLoggerControl.setFeatureLogging('cart', true)
Skip UI logs (too noisy)     reduxLoggerControl.setFeatureLogging('ui', false)
View all Redux logs          logger.getLogs({category:'REDUX'})
Search for action            logger.getLogs({search:'cart/addItem'})
Reset to defaults            reduxLoggerControl.reset()
```

## 📊 CONSOLE OUTPUT

When you trigger an action, you see:

```
┌─────────────────────────────────┐
│ [REDUX] cart/addItem           │ ← Action name
├─────────────────────────────────┤
│ Timestamp: 2026-04-06T10:30... │ ← When it happened
│ Duration: 2.5ms                │ ← How long it took
│ Payload: {                      │ ← What was passed
│   foodItemId: '123',           │
│   quantity: 2,                 │
│   price: 500                   │
│ }                              │
│ State Diff: {                   │ ← What changed
│   items: {                      │
│     from: [],                  │
│     to: [{...}]                │
│   },                            │
│   total: {                      │
│     from: 0,                   │
│     to: 500                    │
│   }                             │
│ }                              │
└─────────────────────────────────┘
```

## 🎯 COMMON SCENARIOS

### Scenario 1: Debug Cart Feature
```javascript
reduxLoggerControl.setFeatureLogging('cart', true)
// Add item to cart
// Check console for full flow
```

### Scenario 2: Find Slow Actions
```javascript
reduxLoggerControl.setConfig({
  enableSlowActionWarning: true,
  slowActionThreshold: 50  // warn if > 50ms
})
// Use app normally
// Check console for warnings
```

### Scenario 3: See State Changes Only
```javascript
reduxLoggerControl.setConfig({
  logStateChanges: true,
  logDiff: true,
  logPayloadData: false  // hide payload
})
```

### Scenario 4: Reduce Noise
```javascript
reduxLoggerControl.setConfig({
  featureLogging: {
    auth: true,
    cart: true,
    restaurants: false,  // off
    ui: false           // off
  }
})
```

### Scenario 5: Debug Auth Flow
```javascript
reduxLoggerControl.setFeatureLogging('auth', true)
// Click login button
// Watch auth actions in console
```

## 🎛️ CONFIGURATION TEMPLATES

### Template 1: Debug Everything
```javascript
reduxLoggerControl.setConfig({
  enabled: true,
  logActions: true,
  logStateChanges: true,
  logPayloadData: true,
  logDiff: true,
  logDuration: true,
  prettyPrint: true
})
```

### Template 2: Monitor Performance
```javascript
reduxLoggerControl.setConfig({
  logDuration: true,
  enablePerformanceMetrics: true,
  enableSlowActionWarning: true,
  slowActionThreshold: 100
})
```

### Template 3: Minimal (Fast Mode)
```javascript
reduxLoggerControl.setConfig({
  logActions: true,
  logStateChanges: false,
  logPayloadData: false,
  logDiff: false
})
```

### Template 4: Production-Safe
```javascript
reduxLoggerControl.setConfig({
  enabled: false,
  filterSensitiveData: true
})
```

## 📈 WHAT GETS LOGGED

By default, the logger tracks:

✅ **Every Redux action**
- Action name (e.g., `cart/addItem`)
- Payload (arguments)
- Execution time

✅ **Every state change**
- Previous state
- New state
- Exact diff (what changed)

✅ **Performance**
- Action duration (milliseconds)
- Slow action warnings

✅ **Data Safety**
- Automatic masking of passwords/tokens
- Configurable sensitive keys

## 🔍 FINDING LOGS

### View Last 10 Actions
```javascript
logger.getLogs({category:'REDUX'}).slice(-10)
```

### View Slow Actions
```javascript
logger.getLogs({category:'REDUX'})
  .filter(log => (log.data?.duration || 0) > 100)
```

### View Auth Actions Only
```javascript
logger.getLogs({search:'auth'})
```

### View Errors/Warnings
```javascript
logger.getLogs({
  category:'REDUX',
  level:['WARN','ERROR']
})
```

## 💾 PERSISTENCE

Configuration is **automatically saved** to:
```javascript
localStorage['zom2_redux_logger_config']
```

This means:
✅ Settings survive page refresh (F5)
✅ Settings survive app restart
✅ Settings apply to all tabs of app
✅ Settings clear on localStorage clear

## 🚨 QUICK TROUBLESHOOTING

### Issue: "reduxLoggerControl not found"
```
Make sure:
✅ App is loaded (not just code)
✅ DevTools console is open (F12)
✅ You're at root level (type directly in console)
```

### Issue: "No logs appearing"
```javascript
reduxLoggerControl.setEnabled(true)
// Trigger action again
```

### Issue: "Too many logs"
```javascript
reduxLoggerControl.setFeatureLogging('ui', false)
// UI logs are very frequent
```

## 📚 DOCUMENTATION HIERARCHY

```
START HERE (everyone)
↓
REDUX_LOGGER_SETUP_SUMMARY.md  (5 min overview)
↓
REDUX_LOGGER_QUICK_REFERENCE.md  (syntax cheat sheet)
↓
Need more info?
↓
Choose ONE:
├─ Code examples → REDUX_LOGGER_INTEGRATION_EXAMPLES.md
├─ Full guide → REDUX_LOGGER_IMPLEMENTATION_GUIDE.md
├─ How it works → REDUX_LOGGER_ARCHITECTURE.md
└─ All docs → REDUX_LOGGER_DOCUMENTATION_INDEX.md
```

## 🎓 NEXT STEPS

1. Open DevTools: **F12**
2. Paste: `reduxLoggerControl.printStatus()`
3. Read: **REDUX_LOGGER_SETUP_SUMMARY.md**
4. Pick a use case above
5. Start debugging! 🎉

## 🆘 HELP

- "How do I...?" → REDUX_LOGGER_QUICK_REFERENCE.md
- "Show me code" → REDUX_LOGGER_INTEGRATION_EXAMPLES.md
- "Tell me everything" → REDUX_LOGGER_IMPLEMENTATION_GUIDE.md

---

**15 seconds to start**, **5 minutes to master**, **unlimited debugging power!** 🚀
