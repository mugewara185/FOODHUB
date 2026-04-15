# Redux Logger System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────┐
│          Redux Logger System                    │
│         (Complete Flow)                         │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION (in React Component)                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  const dispatch = useDispatch();                                │
│  dispatch(cartSlice.actions.addItem({                           │
│    id: '123',                                                   │
│    quantity: 2,                                                 │
│    price: 500                                                   │
│  }));                                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. REDUX MIDDLEWARE PIPELINE                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Redux Logger Middleware intercepts action:                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Check if logging enabled                             │   │
│  │    → reduxLoggerControl.getConfig().enabled             │   │
│  │                                                          │   │
│  │ 2. Check if action should be logged                     │   │
│  │    → reduxLoggerControl.shouldLogAction(actionType)     │   │
│  │                                                          │   │
│  │ 3. Check if feature is enabled                          │   │
│  │    → reduxLoggerControl.isFeatureEnabled('cart')        │   │
│  │                                                          │   │
│  │ 4. Get previous state (before reducer)                  │   │
│  │    → const prev = store.getState()                      │   │
│  │                                                          │   │
│  │ 5. START TIMER: performance.now()                       │   │
│  │                                                          │   │
│  │ 6. Execute action (call next(action))                   │   │
│  │    → Reducer runs, returns new state                    │   │
│  │                                                          │   │
│  │ 7. GET NEXT STATE (after reducer)                       │   │
│  │    → const next = store.getState()                      │   │
│  │                                                          │   │
│  │ 8. END TIMER: duration = now - start                    │   │
│  │                                                          │   │
│  │ 9. CALCULATE DIFF                                       │   │
│  │    → reduxLoggerUtils.calculateDiff(prev, next)         │   │
│  │    → { items: { from: [], to: [...] }, ... }           │   │
│  │                                                          │   │
│  │ 10. MASK SENSITIVE DATA                                 │   │
│  │     → filterSensitiveData(['password', 'token'])        │   │
│  │                                                          │   │
│  │ 11. TRUNCATE LARGE PAYLOADS                             │   │
│  │     → if (payload.length > maxSize) truncate            │   │
│  │                                                          │   │
│  │ 12. CHECK SLOW ACTION WARNING                           │   │
│  │     → if (duration > slowActionThreshold)               │   │
│  │        logger.warn('Slow action: ' + duration + 'ms')   │   │
│  │                                                          │   │
│  │ 13. LOG TO CONSOLE (pretty format)                      │   │
│  │     [REDUX] cart/addItem                                │   │
│  │     Timestamp: ...                                      │   │
│  │     Duration: 2.5ms                                     │   │
│  │     Payload: { ... }                                    │   │
│  │     State Diff: { items, total }                        │   │
│  │                                                          │   │
│  │ 14. LOG TO LOGGER SYSTEM                                │   │
│  │     → logger.debug('REDUX', 'Action: cart/addItem', ...) │  │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. LOGGER SYSTEM (src/core/dev/logger/)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Logger singleton instance receives log:                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Create LogEntry with metadata                        │   │
│  │    { id, timestamp, level, category, message, ... }     │   │
│  │                                                          │   │
│  │ 2. Check log level (DEBUG < INFO < WARN < ERROR)        │   │
│  │    → Should this level be logged?                       │   │
│  │                                                          │   │
│  │ 3. Store in memory (max 500 entries by default)         │   │
│  │    → this.logs.push(entry)                              │   │
│  │    → Keep tail if exceeds maxLogs                       │   │
│  │                                                          │   │
│  │ 4. PERSIST TO localStorage                              │   │
│  │    → localStorage.setItem('zom2_logs', JSON.stringify)   │   │
│  │    → survives page refresh                              │   │
│  │                                                          │   │
│  │ 5. NOTIFY LISTENERS                                     │   │
│  │    → logger.notifyListeners()                           │   │
│  │    → All subscribed React components update             │   │
│  │       (LoggerContext, Debug Console, etc.)              │   │
│  │                                                          │   │
│  │ 6. CONSOLE LOG                                          │   │
│  │    → console.log/warn/error based on level              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. DATA DESTINATIONS                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │ Browser Console  │   │  localStorage    │                   │
│  ├──────────────────┤   ├──────────────────┤                   │
│  │ [REDUX] action   │   │ zom2_logs        │                   │
│  │ Duration: 2.5ms  │   │ [LogEntry[], ...] │                   │
│  │ Payload: {...}   │   │                  │                   │
│  │ State Diff: {...} │   │ zom2_redux_      │                   │
│  │                  │   │ logger_config    │                   │
│  │ (Pretty format)  │   │ {...Config}      │                   │
│  └──────────────────┘   └──────────────────┘                   │
│              │                      │                           │
│              │                      │                           │
│              └──────────────── React Components                │
│                      (LogConsole, DevTools)                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Configuration Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ RUNTIME CONTROL (Browser Console)                              │
└─────────────────────────────────────────────────────────────────┘
              ↓
      reduxLoggerControl
        (Singleton Instance)
              ↓
    ┌─────────────────────┐
    │   In-Memory Config  │  ← Current configuration
    │  (this.config)      │
    └─────────────────────┘
              ↓                     ↑ (saves)
              │                     │
    (saveConfigToStorage)  (loadConfigFromStorage)
              │                     │
              ↓                     ↓
    ┌─────────────────────────────────────────┐
    │ localStorage['zom2_redux_logger_config']│
    │ (Persisted between page reloads)        │
    └─────────────────────────────────────────┘


MIDDLEWARE ACCESS PATTERN:

reduxLoggerMiddleware (on every action)
              ↓
reduxLoggerControl.getConfig()  ← Read current config
              ↓
Check:
  • enabled?
  • shouldLogAction(actionType)?
  • isFeatureEnabled(feature)?
              ↓
If all pass → Log the action
```

## 🎯 Data Flow for Single Action

```
                         User Clicks "Add to Cart"
                                  │
                                  ↓
                    dispatch(cart/addItem({...}))
                                  │
                                  ↓
                    Redux Middleware Chain
                          (our middleware)
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        Check Config        Get State      Start Timer
        ↓                    Before         ↓
    enabled?           store.getState()   performance.now()
    shouldLog?          ↓
    featureOn?         { cart, auth, ... }
                │                │
                └────────┬───────┘
                         │
                         ↓
              ┌─ Next Action ─┐
              │  (run reducer) │
              └─ Execute      ─┘
                         │
                         ↓
              Get State After
              store.getState()
                         │
                         ↓
                    Stop Timer
                  duration = now() - startTime
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                 ↓
    Calculate Diff   Mask Sensitive   Truncate
    previous vs        Data         Large Data
    next state


              Prepare Log Object
              ┌──────────────────────────────┐
              │ action: 'cart/addItem'       │
              │ timestamp: 1234567890        │
              │ duration: 2.5                │
              │ payload: {...}               │
              │ previousState: {...}         │
              │ nextState: {...}             │
              │ diff: {items, total}         │
              └──────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                 ↓
    Pretty Print    Store in Logger   Return to Redux
    to Console      System             (continue dispatch)
    
    └─── Back to app
```

## 📊 Configuration Decision Tree

```
Action Dispatched
      │
      ↓
Is Redux Logging Enabled?
    ├─ NO → Skip logging, return action
    └─ YES
         │
         ↓
  Should This Action Be Logged?
    ├─ Whitelist mode?
    │  └─ Is action in whitelist? 
    │     ├─ NO → Skip
    │     └─ YES
    ├─ Blacklist mode?
    │  └─ Is action in blacklist?
    │     ├─ YES → Skip
    │     └─ NO
    └─ All mode?
       └─ YES (always log)
         │
         ↓
  Is Feature Logging Enabled?
    ├─ Feature: 'auth' → auth/* actions
    ├─ Feature: 'cart' → cart/* actions
    ├─ Feature: 'restaurants' → restaurants/* actions
    └─ Feature: 'ui' → ui/* actions - if not, skip
         │
         ↓
  ✅ LOG THE ACTION
    • Payload (if enabled)
    • State before/after (if enabled)
    • Duration (if enabled)
    • Diff (if enabled)
    • Console output (if prettyPrint enabled)
    • Logger system storage (if persistLogs enabled)
```

## 🔌 Integration Points

```
┌───────────────────────────────────────────────────────────────┐
│ Redux Store (Store_V.ts)                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  configureStore({                                            │
│    reducer: persistedReducer,                                │
│    middleware: (getDefaultMiddleware) =>                     │
│      getDefaultMiddleware({...})                             │
│        .concat(                                              │
│          createReduxLoggerMiddleware() ← HERE                │
│        )                                                      │
│  })                                                          │
│                                                               │
│  (window as any).reduxLoggerControl = ... ← GLOBAL ACCESS    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                         ↓
              ┌─────────────────┐
              │ Logger System    │
              │ (src/core/dev/)  │
              │                 │
              │ logger instance │
              │ LoggerContext   │
              │ LogConsole      │
              └─────────────────┘
```

## 💾 Persistence Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Application State                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ reduxLoggerControl.config (in memory)                      │
│         │                                                   │
│         ├─ setConfig() ──→ saveConfigToStorage()           │
│         │                                                   │
│         └─ On load ──→ loadConfigFromStorage()             │
│                                                             │
│ localStorage                                               │
│         │                                                   │
│         ├─ 'zom2_redux_logger_config' (ReduxLoggerConfig)  │
│         │                                                   │
│         └─ 'zom2_logs' (LogEntry[])                        │
│                                                             │
│ Across tab/window:                                          │
│         └─ Both stored in localStorage → visible to all    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Console Output Structure

```
┌─────────────────────────────────────────────────────────┐
│ Browser DevTools Console                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  %c[REDUX] cart/addItem                                │
│  color: #1976d2; font-weight: bold;                   │
│  ┌────────────────────────────────────────────────────┐│
│  │ Timestamp: 2026-04-06T10:30:45.123Z              ││
│  │ Duration: 2.5ms                                   ││
│  │ Payload: { ... }                                  ││
│  │ ► Previous State                                  ││
│  │   cart: { items: [], total: 0 }                  ││
│  │ ► Next State                                      ││
│  │   cart: { items: [{...}], total: 500 }           ││
│  │ ► State Diff                                      ││
│  │   items: { from: [], to: [{...}] }               ││
│  │   total: { from: 0, to: 500 }                    ││
│  └────────────────────────────────────────────────────┘│
│                                                         │
│  (repeats for every action)                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Browser Console API Surface

```
reduxLoggerControl (global object)
│
├─ getConfig() → ReduxLoggerConfig
├─ setConfig(partial) → void
├─ setEnabled(boolean) → void
├─ setFeatureLogging(feature, boolean) → void
├─ shouldLogAction(actionType) → boolean
├─ isFeatureEnabled(feature) → boolean
├─ printStatus() → void (console.table)
├─ exportConfig() → string (JSON)
└─ reset() → void


logger (global object from logger system)
│
├─ getLogs(filters?) → LogEntry[]
├─ getStats() → LogStats
├─ debug(...) → LogEntry
├─ info(...) → LogEntry
├─ warn(...) → LogEntry
├─ error(...) → LogEntry
├─ critical(...) → LogEntry
└─ clearLogs() → void
```

## 🚀 Sequence Diagram

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Component  │    │  Middleware  │    │  Logger      │
│             │    │              │    │  System      │
└─────────────┘    └──────────────┘    └──────────────┘
      │                   │                   │
      │ dispatch(action)  │                   │
      ├──────────────────→│                   │
      │                   │ check config      │
      │                   ├─→ (localStorage)  │
      │                   │ (memory)          │
      │                   │ ✓ enabled         │
      │                   │ ✓ action ok       │
      │                   │ ✓ feature on      │
      │                   │                   │
      │                   │ get state (prev)  │
      │                   │ call next(action) │
      │                   │ get state (next)  │
      │                   │ calculate diff    │
      │                   │ ✓ duration        │
      │                   │                   │
      │                   │ console.log()     │
      │                   │ logger.debug()───→│
      │                   │                   │ store entry
      │                   │                   │ localStorage
      │                   │                   │ notifyListeners
      │                   │                   │
      │← result ─────────│                   │
      │                   │                   │
```

---

This architecture ensures:
- ✅ Efficient middleware pipeline
- ✅ Configurable logging at runtime
- ✅ Persistent configuration
- ✅ Integration with global logger
- ✅ Performance monitoring
- ✅ Data privacy (masking)
- ✅ Clear separation of concerns
