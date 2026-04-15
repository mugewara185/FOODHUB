/**
 * Logger System Setup Examples
 * 
 * This file demonstrates how to integrate the logger system into your application.
 * Copy these patterns to your codebase as needed.
 */

// ============================================
// 1. APP SETUP
// ============================================

// In your main App.tsx or AppProvider.tsx:
/*
import { LoggerProvider } from '@/core/dev/logger';

function App() {
  return (
    <LoggerProvider>
      <ThemeProvider>
        <Routes>
          {/* Your routes */}
//         </Routes>
//       </ThemeProvider>
//     </LoggerProvider>
//   );
// }

// export default App;
// */

// ============================================
// 2. API SERVICE INTEGRATION
// ============================================

/*
// In your api/http/client.ts or similar:

import { logAPI } from '@/core/dev/logger';

export const apiClient = axios.create({...});

apiClient.interceptors.request.use((config) => {
  logAPI.request(config.url || '', config.method?.toUpperCase() || 'GET', config.data);
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
*/

// ============================================
// 3. REDUX INTEGRATION
// ============================================

/*
// In your redux middleware or in slices:

import { logRedux } from '@/core/dev/logger';

// In middleware:
const loggingMiddleware = (storeAPI) => (next) => (action) => {
  logRedux.action(action.type, action.payload);
  const result = next(action);
  logRedux.state(action.type.split('/')[0], storeAPI.getState());
  return result;
};

// Or in slice extraReducers:
extraReducers: (builder) => {
  builder
    .addCase(fetchUsers.pending, (state) => {
      logRedux.dispatch('fetchUsers/pending');
    })
    .addCase(fetchUsers.fulfilled, (state, action) => {
      logRedux.dispatch('fetchUsers/fulfilled');
      logRedux.state('users', action.payload);
    });
}
*/

// ============================================
// 4. COMPONENT LOGGING
// ============================================

/*
import { useLogger, logComponent } from '@/core/dev/logger';

function MyComponent({ userId }) {
  const { debug } = useLogger();

  useEffect(() => {
    logComponent.mount('MyComponent');
    debug('COMPONENT', 'User ID changed', { userId }, 'MyComponent');

    return () => logComponent.unmount('MyComponent');
  }, []);

  useEffect(() => {
    logComponent.effect('MyComponent', 'fetchUserData');
    fetchUserData();
  }, [userId]);

  return <div>...</div>;
}
*/

// ============================================
// 5. ERROR BOUNDARY INTEGRATION
// ============================================

/*
import { logError } from '@/core/dev/logger';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

class MyErrorBoundary extends ErrorBoundary {
  componentDidCatch(error, errorInfo) {
    logError('COMPONENT', error, {
      componentStack: errorInfo.componentStack,
      recoverable: true,
    }, 'ErrorBoundary');
    super.componentDidCatch(error, errorInfo);
  }
}
*/

// ============================================
// 6. PERFORMANCE MONITORING
// ============================================

/*
import { PerformanceSpan, logWithThreshold } from '@/core/dev/logger';

// Monitor async operations
async function fetchUserProfile(userId: string) {
  const span = new PerformanceSpan(`fetchUserProfile-${userId}`);
  
  try {
    const data = await apiClient.get(`/users/${userId}`);
    const duration = span.end();
    
    logWithThreshold('PERFORMANCE', 'User profile fetch', duration, 2000, true);
    return data;
  } catch (error) {
    span.end();
    throw error;
  }
}

// Monitor component renders
function HeavyComponent() {
  useEffect(() => {
    const span = new PerformanceSpan('HeavyComponent-render');
    doHeavyComputation();
    const duration = span.end();
  }, []);
}
*/

// ============================================
// 7. AUTH LOGGING
// ============================================

/*
import { logAuth } from '@/core/dev/logger';

// In your auth service/slice:

export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    logAuth.login(response.data.userId, 'email');
    logAuth.token('set', response.data.token);
    return response.data;
  } catch (error) {
    logAuth.error('Login failed', error);
    throw error;
  }
};

export const logout = (userId: string) => {
  logAuth.logout(userId);
  logAuth.token('clear');
};
*/

// ============================================
// 8. DEBUG PANEL / LOG CONSOLE
// ============================================

/*
import { useState } from 'react';
import { LogConsole } from '@/core/dev/logger';
import { IconButton } from '@mui/material';
import { BugReport } from '@mui/icons-material';

function DebugPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000 }}
      >
        <BugReport />
      </IconButton>
      <LogConsole open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// Add to your main layout
export default DebugPanel;
*/

// ============================================
// 9. DIRECT USAGE (NON-REACT)
// ============================================

/*
import { logger, logAPI } from '@/core/dev/logger';

// Can be used anywhere without React hooks
logger.info('INIT', 'Starting application');

// In utility functions
export function initializeApp() {
  logger.debug('INIT', 'Initializing app configuration');
  loadConfig();
}

// In service classes
class UserService {
  async getUser(id: string) {
    logAPI.request(`/users/${id}`, 'GET');
    const response = await fetch(`/api/users/${id}`);
    logAPI.response(`/users/${id}`, response.status, response.data);
    return response.data;
  }
}
*/

// ============================================
// 10. ERROR HANDLING WRAPPER
// ============================================

/*
import { logError } from '@/core/dev/logger';

export function withErrorLogging(fn: Function, category: string) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(category, error, { args }, fn.name);
      throw error;
    }
  };
}

// Usage:
const safeFetch = withErrorLogging(
  async (url) => fetch(url),
  'API'
);
*/

// ============================================
// 11. ROUTE CHANGE LOGGING
// ============================================

/*
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPerformance } from '@/core/dev/logger';

export function UseRouteLogger() {
  const location = useLocation();

  useEffect(() => {
    logPerformance.navigation(location.pathname);
  }, [location]);

  return null;
}

// Add to your main layout:
// <UseRouteLogger />
*/

// ============================================
// 12. EXAMPLE: COMPLETE COMPONENT
// ============================================

/*
import { useLogger, logComponent, logError } from '@/core/dev/logger';
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const { info, warn, error } = useLogger();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logComponent.mount('UserProfile');

    return () => logComponent.unmount('UserProfile');
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        logComponent.effect('UserProfile', 'fetchUser');
        info('API', `Fetching user ${userId}`, undefined, 'UserProfile');

        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          warn('API', `User fetch returned ${response.status}`, undefined, 'UserProfile');
        }

        const data = await response.json();
        setUser(data);
        info('API', 'User loaded successfully', { userId }, 'UserProfile');
      } catch (err) {
        logError('API', err, { userId }, 'UserProfile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, info]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.name}</div>;
}

export default UserProfile;
*/

export default {};
