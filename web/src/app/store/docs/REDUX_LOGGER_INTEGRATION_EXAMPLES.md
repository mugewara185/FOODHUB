# Redux Logger Integration Examples

## Overview

This guide shows how to use the Redux logger in your slices, thunks, and selectors.

## Basic Action Logging (Automatic)

All Redux actions are **automatically logged** by the middleware. You don't need to do anything special in your slices:

```typescript
// src/features/auth/authSlice.ts

import { createSlice } from '@reduxjs/toolkit';

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      // This action is automatically logged by middleware!
      // No need to manually log
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      // Automatically logged
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export default authSlice.reducer;
```

**Logged as:**
```
[REDUX] auth/login
Duration: 1.2ms
Payload: { user: { id, email, role } }
State Diff: { user, isAuthenticated }
```

## Custom Logging in Thunks

For **async operations**, add custom logging using the logger system:

```typescript
// src/features/cart/cartThunk.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger, logRedux } from '@core/dev/logger';

export const checkoutCart = createAsyncThunk(
  'cart/checkout',
  async (payload: CheckoutPayload, { rejectWithValue }) => {
    try {
      // Log the start of checkout
      logRedux.action('cart/checkout/start', payload);
      logger.info('CART', 'Checkout initiated', { 
        itemCount: payload.items.length,
        total: payload.total 
      });

      // API call
      const response = await api.post('/checkout', payload);

      // Log success
      logRedux.action('cart/checkout/success', response.data);
      logger.info('CART', 'Checkout completed', { orderId: response.data.id });

      return response.data;
    } catch (error) {
      // Log error
      logger.error('CART', 'Checkout failed', error);
      return rejectWithValue((error as Error).message);
    }
  }
);
```

**Output in Console:**
```
[INFO] CART: Checkout initiated
Timestamp: 2026-04-06T10:30:45.123Z

[INFO] CART: Checkout completed
OrderId: order_123

OR

[ERROR] CART: Checkout failed
Error details...
```

## Feature-Specific Logging

For **fine-grained logging** in specific reducers:

```typescript
// src/features/restaurants/restaurantSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import { logger } from '@core/dev/logger';

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setRestaurants: (state, action) => {
      const config = require('@app/store/V/reduxLogger.config').reduxLoggerControl.getConfig();
      
      // Only log if restaurants feature logging is enabled
      if (config.featureLogging.restaurants) {
        logger.debug('RESTAURANTS', 'Restaurants list updated', {
          count: action.payload.length,
          ids: action.payload.map((r: any) => r.id),
        });
      }

      state.data = action.payload;
      state.isLoading = false;
    },
  },
});

export default restaurantSlice.reducer;
```

## Performance Monitoring

Monitor specific operations:

```typescript
// src/features/food/foodSlice.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { logPerformance } from '@core/dev/logger';

export const searchFoodItems = createAsyncThunk(
  'food/search',
  async (searchTerm: string) => {
    // Mark start
    logPerformance.start('food-search');

    try {
      // Perform search (could be API or local)
      const results = await api.get(`/food/search?q=${searchTerm}`);

      // Mark end - logs duration
      logPerformance.end('food-search');

      return results.data;
    } catch (error) {
      logPerformance.end('food-search');
      throw error;
    }
  }
);
```

**Output:**
```
[INFO] PERFORMANCE: [MEASURE] food-search
Duration: 245.3ms
```

## Middleware-Level Custom Logging

To add **additional middleware** for application-level logging:

```typescript
// src/app/store/V/customLogger.middleware.ts

import type { Middleware } from '@reduxjs/toolkit';
import { logger } from '@core/dev/logger';
import type { RootState } from './index';

interface LogEntry {
  action: string;
  timestamp: number;
  severity: 'info' | 'warn' | 'error';
  message: string;
}

export const createCustomLoggerMiddleware = (): Middleware<{}, RootState> => {
  const logBuffer: LogEntry[] = [];

  return (store) => (next) => (action) => {
    const logEntry: LogEntry = {
      action: action.type,
      timestamp: Date.now(),
      severity: 'info',
      message: `Dispatched ${action.type}`,
    };

    // Add to buffer
    logBuffer.push(logEntry);

    // Keep buffer size reasonable
    if (logBuffer.length > 100) {
      logBuffer.shift();
    }

    // Execute action
    const result = next(action);

    // Export buffer if needed
    (window as any).getReduxLog = () => logBuffer;

    return result;
  };
};
```

## Selector Logging

Log when selectors are used:

```typescript
// src/features/cart/selectors.ts

import { createSelector } from '@reduxjs/toolkit';
import { logger } from '@core/dev/logger';

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => state.cart.total;

export const selectCartSummary = createSelector(
  [selectCartItems, selectCartTotal],
  (items, total) => {
    // Optional: Log selector computation
    logger.debug('SELECTOR', 'CartSummary computed', {
      itemCount: items.length,
      total,
    });

    return {
      items,
      total,
      itemCount: items.length,
    };
  }
);
```

## Error Handling with Logging

```typescript
// src/features/orders/orderSlice.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger, logError } from '@core/dev/logger';

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      // Use logError helper
      logError('ORDERS', 'Failed to create order', error, 'createOrder');

      // Also detailed logging
      if (error instanceof Error) {
        logger.error('ORDERS', error.message, {
          stack: error.stack,
          orderData, // Include context
        });
      }

      return rejectWithValue('Order creation failed');
    }
  }
);
```

## Testing with Logger

Disable logging during tests:

```typescript
// src/features/cart/__tests__/cartSlice.test.ts

import { reduxLoggerControl } from '@app/store/V/reduxLogger.config';

describe('Cart Slice', () => {
  beforeAll(() => {
    // Disable logging for tests
    reduxLoggerControl.setEnabled(false);
  });

  afterAll(() => {
    // Re-enable logging after tests
    reduxLoggerControl.setEnabled(true);
  });

  it('should add item to cart', () => {
    // Test without logging noise
    const action = cartSlice.actions.addItem({ id: '1', quantity: 2 });
    const newState = cartSlice.reducer(initialState, action);
    expect(newState.items).toHaveLength(1);
  });
});
```

## Debugging Specific Actions

In browser console:

```javascript
// Watch a specific action type
logger.getLogs({
  category: 'REDUX',
  search: 'cart/addItem'
})

// Get last 10 actions
logger
  .getLogs({ category: 'REDUX' })
  .slice(-10)
  .forEach(log => console.log(log.message, log.data))

// Track state changes for cart
logger.getLogs({
  category: 'REDUX',
  search: 'cart'
}).filter(log => log.data?.diff)  // Only logs with state changes

// Find slow actions (> 100ms)
logger
  .getLogs({ category: 'REDUX' })
  .filter(log => (log.data?.duration || 0) > 100)
  .forEach(log => console.warn(`Slow action: ${log.message}`))
```

## Best Practices for Integration

### 1. Automatic Logging (Preferred)
```typescript
// ✅ Use middleware (automatic)
// No code changes needed - middleware logs everything
```

### 2. Thunks & Async
```typescript
// ✅ Log async operations
const thunk = createAsyncThunk('feature/action', async () => {
  logRedux.action('feature/action/started');
  // ... async work ...
  logger.info('FEATURE', 'Operation completed');
});
```

### 3. Complex Reducers
```typescript
// ✅ Log if needed for debugging
if (config.featureLogging.feature) {
  logger.debug('FEATURE', 'Complex state updated', data);
}
```

### 4. Errors
```typescript
// ✅ Always log errors
catch (error) {
  logger.error('FEATURE', 'Operation failed', error);
}
```

## Examples by Feature

### Authentication Flow
```javascript
// In browser console, watch login flow:
logger.getLogs({ 
  category: 'REDUX',
  search: 'auth'
}).map(log => ({
  action: log.message,
  user: log.data?.payload?.user,
  time: new Date(log.timestamp).toISOString()
}))
```

### Cart Checkout
```javascript
// Monitor entire checkout journey:
logger.getLogs({
  category: 'REDUX',
  search: 'checkout'
}).forEach(log => {
  console.group(log.message);
  console.log('Payload:', log.data?.payload);
  console.log('Duration:', log.data?.duration, 'ms');
  console.groupEnd();
})
```

### Restaurant Search
```javascript
// Track search performance:
const searches = logger.getLogs({
  search: 'restaurant'
});
const avgDuration = searches.reduce((sum, log) => 
  sum + (log.data?.duration || 0), 0) / searches.length;
console.log(`Average search duration: ${avgDuration}ms`);
```

## Summary

The Redux logger provides:

- **Automatic logging** of all actions via middleware ✅
- **Custom logging** in thunks and selectors via logger API ✅
- **Performance monitoring** via logPerformance helpers ✅
- **Error tracking** via logError helpers ✅
- **Runtime control** via reduxLoggerControl ✅
- **Feature-level filtering** to reduce noise ✅

Start simple with automatic middleware logging, add custom logging only where needed.
