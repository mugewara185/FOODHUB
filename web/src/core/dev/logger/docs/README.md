# Developer Observability Foundation: Quick Start

The Developer Observability Foundation (`core/dev/logger`) is a highly structured, trace-aware execution timeline for debugging complex frontend flows.

## 1. Using the Logger in React Components

Import `useLogger` from the context to get stable logging functions.

```tsx
import { useLogger } from '@/core/dev/contexts/LoggerContext';

export const MyComponent = () => {
  const { info, error } = useLogger();

  useEffect(() => {
    info('MY_FEATURE', 'Component mounted', {
      event: 'MOUNT',
      source: 'MyComponent'
    });
  }, []);

  return <div />;
}
```

## 2. Using Traces for Flow Correlation

When debugging complex async flows (e.g. checkout, authentication), start a trace. All logs emitted from the trace will automatically share a `traceId`, grouping them in the UI.

```ts
import { logger } from '@/core/dev/logger/Logger';

const myThunk = async () => {
  const trace = logger.startTrace('FEATURE_NAME', 'Started complex process');

  try {
    trace.debug('Validating data...');
    // ...
    trace.info('API Call Success', { data: { status: 200 } });
    trace.end('Process complete');
  } catch (err) {
    trace.error('Process failed', { error: err });
    trace.end('Process aborted');
  }
}
```

## 3. Specialized Helper Utilities

Use `logUtils.ts` for standardized domain actions.

```ts
import { logAPI, logComponent, logRedux, logError } from '@/core/dev/logger/logUtils';

// 1. API Instrumentation
logAPI.request('GET', '/users');
logAPI.response('GET', '/users', 200, 150, responseData);

// 2. Component Lifecycle (Opt-in via config)
logComponent.render('UserProfile', props);

// 3. Performance Timing
import { PerformanceSpan } from '@/core/dev/logger/logUtils';
const span = new PerformanceSpan('HeavyCalculation');
// ... do work ...
span.end();

// 4. Error Tracking
logError('FEATURE_NAME', error, { contextData: 'foo' });
```

## 4. The Dev Logger UI (`LogPanel.tsx`)

The Logger UI provides a real-time, scannable timeline of execution.

**Features:**
- **Pause/Resume:** Freeze the UI while logs continue collecting in the background.
- **Browser Console Toggle:** Mute the browser console output without stopping internal timeline tracking.
- **Persistence Toggle:** Save logs to `localStorage` across page reloads.
- **Expandable Details:** Click any log row to see structured JSON, stack traces, and copy buttons.
- **Filters:** Search by `traceId`, `message`, `category`, or filter by severity `Level`.

## 5. Configuration Defaults

Configuration is managed in the singleton and respects updates from the UI.
- `consoleLoggingEnabled: true` - Outputs to browser console.
- `renderLoggingEnabled: false` - Component render logs are muted by default.
- `persistLogs: true` - Keeps the last 500 logs in `localStorage`.
- `enableStackTrace: true` - Automatically captures stack traces on `ERROR` and `CRITICAL`.
