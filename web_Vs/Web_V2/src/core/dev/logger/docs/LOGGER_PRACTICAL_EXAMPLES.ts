/**
 * LOGGER SYSTEM - PRACTICAL USAGE EXAMPLES
 * 
 * Copy these patterns into your actual files to start logging everywhere.
 * The logger is now available globally via LoggerProvider in main.tsx
 */

// ============================================
// 1. COMPONENT EXAMPLE
// ============================================

/*
// In: src/pages/Home/HomePage.tsx
import { useLogger, logComponent } from '@/core/dev/logger';
import { useEffect } from 'react';

function HomePage() {
  const { info, debug, error } = useLogger();

  useEffect(() => {
    logComponent.mount('HomePage');
    info('PAGE', 'HomePage loaded', { timestamp: new Date() }, 'HomePage');

    return () => {
      logComponent.unmount('HomePage');
    };
  }, []);

  const handleSearch = (query: string) => {
    debug('COMPONENT', 'Search initiated', { query }, 'HomePage');
  };

  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={() => handleSearch('pizza')}>Search</button>
    </div>
  );
}

export default HomePage;
*/

// ============================================
// 2. API SERVICE EXAMPLE
// ============================================

/*
// In: src/services/api/client.ts
import axios from 'axios';
import { logAPI, logError, logPerformance } from '@/core/dev/logger';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const endpoint = config.url || '';
  const method = config.method?.toUpperCase() || 'GET';
  
  logAPI.request(endpoint, method, config.data);
  logPerformance.start(`api-${method}-${endpoint}`);
  
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const endpoint = response.config.url || '';
    const status = response.status;
    
    logAPI.response(endpoint, status, response.data);
    logPerformance.end(`api-${response.config.method}-${endpoint}`);
    
    return response;
  },
  (error) => {
    const endpoint = error.config?.url || 'unknown';
    logAPI.error(endpoint, error);
    logError('API', error, { endpoint }, 'APIClient');
    
    return Promise.reject(error);
  }
);

export default apiClient;
*/

// ============================================
// 3. REDUX MIDDLEWARE EXAMPLE
// ============================================

/*
// In: src/app/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { logRedux } from '@/core/dev/logger';

const loggingMiddleware = (store) => (next) => (action) => {
  // Log the action
  logRedux.action(action.type, action.payload);
  
  // Process the action
  const result = next(action);
  
  // Log the dispatch completion
  logRedux.dispatch(action.type);
  
  return result;
};

const store = configureStore({
  reducer: {
    // ... your reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loggingMiddleware),
});

export default store;
*/

// ============================================
// 4. REDUX SLICE EXAMPLE
// ============================================

/*
// In: src/app/store/slices/userSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logRedux } from '@/core/dev/logger';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    logRedux.action('fetchUsers', { status: 'starting' });
    // ... fetch logic
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: { users: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        logRedux.dispatch('fetchUsers/pending');
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        logRedux.dispatch('fetchUsers/fulfilled');
        logRedux.state('users', action.payload);
        state.users = action.payload;
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        logRedux.dispatch('fetchUsers/rejected');
        logRedux.error('REDUX', 'fetchUsers failed', action.error);
        state.loading = false;
      });
  },
});

export default userSlice.reducer;
*/

// ============================================
// 5. NAVIGATION/ROUTES EXAMPLE
// ============================================

/*
// In: src/app/routes/index.tsx
import { useLogger, logPerformance } from '@/core/dev/logger';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Create a route tracker component
function RouteTracker() {
  const { pathname } = useLocation();
  const { info } = useLogger();

  useEffect(() => {
    logPerformance.navigation(pathname);
    info('NAVIGATION', `Route changed to: ${pathname}`, { pathname }, 'Router');
  }, [pathname, info]);

  return null;
}

// Use it in your main routes component:
function AppRoutes() {
  return (
    <>
      <RouteTracker />
      {/* Your routes */}
    </>
  );
}
*/

// ============================================
// 6. CONTEXT PROVIDER EXAMPLE
// ============================================

/*
// In: src/contexts/AuthContext.tsx
import { useLogger, logAuth } from '@/core/dev/logger';
import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { error: logError, info } = useLogger();
  const [user, setUser] = useState(null);

  const login = async (email: string, password: string) => {
    try {
      info('AUTH', 'Login attempt', { email }, 'AuthContext');
      // ... login logic
      logAuth.login(user.id, 'email');
      setUser(user);
    } catch (err) {
      logAuth.error('Login failed', err);
      logError('AUTH', 'Login failed', { email });
      throw err;
    }
  };

  const logout = () => {
    logAuth.logout(user?.id);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
*/

// ============================================
// 7. ERROR BOUNDARY EXAMPLE
// ============================================

/*
// In: src/shared/components/ErrorBoundary.tsx
import { logComponent, logError } from '@/core/dev/logger';
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('ERROR_BOUNDARY', error, {
      componentStack: errorInfo.componentStack,
    }, 'ErrorBoundary');

    logComponent.error('ErrorBoundary', error);

    // Also log to external service if needed
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
*/

// ============================================
// 8. CUSTOM HOOK EXAMPLE
// ============================================

/*
// In: src/shared/hooks/useAsync.ts
import { useLogger, logPerformance } from '@/core/dev/logger';
import { useCallback, useEffect, useState } from 'react';

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  name: string = 'unknownAsync'
) {
  const { error: logErrorFn, info } = useLogger();
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    logPerformance.start(`async-${name}`);
    info('ASYNC', `Starting: ${name}`, { name }, name);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      info('ASYNC', `Completed: ${name}`, { name, dataSize: JSON.stringify(response).length }, name);
      logPerformance.end(`async-${name}`);
      return response;
    } catch (err) {
      setError(err as Error);
      setStatus('error');
      logErrorFn('ASYNC', `Error: ${name}`, err);
      logPerformance.end(`async-${name}`);
      return null;
    }
  }, [asyncFunction, name, logErrorFn, info]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}
*/

// ============================================
// 9. FEATURE COMPONENT EXAMPLE (auth/Login)
// ============================================

/*
// In: src/features/auth/Login.tsx
import { useLogger, logComponent, logAuth } from '@/core/dev/logger';
import { useState, useEffect } from 'react';

function LoginComponent() {
  const { info, warn, error: logError } = useLogger();
  const [email, setEmail] = useState('');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    logComponent.mount('LoginComponent');
    return () => logComponent.unmount('LoginComponent');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logComponent.effect('LoginComponent', 'handleLogin');
    info('AUTH', 'Login form submitted', { email }, 'LoginComponent');

    if (attempts >= MAX_ATTEMPTS) {
      warn('AUTH', 'Max login attempts exceeded', { email, attempts }, 'LoginComponent');
      logAuth.error('Too many login attempts');
      return;
    }

    try {
      logAuth.login(email, 'form');
      // ... login logic
    } catch (err) {
      setAttempts(prev => prev + 1);
      logAuth.error('Login failed', err);
      logError('AUTH', 'Login failed', { email, attempt: attempts + 1 }, 'LoginComponent');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginComponent;
*/

// ============================================
// 10. DEBUG PANEL COMPONENT (OPTIONAL)
// ============================================

/*
// In: src/core/dev/DebugPanel.tsx
import { useLogger, useCategoryLogs, useErrorLogs } from '@/core/dev/logger';
import React from 'react';

export const DebugPanel: React.FC = () => {
  const { logs, clearLogs, exportLogs } = useLogger();
  const apiLogs = useCategoryLogs('API');
  const errors = useErrorLogs();

  const handleExport = () => {
    const debugInfo = exportLogs('json');
    console.log('Debug Info:', debugInfo);
    
    // Copy to clipboard
    navigator.clipboard.writeText(debugInfo);
    alert('Debug info copied to clipboard!');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      width: '400px',
      maxHeight: '300px',
      background: '#111',
      color: '#0f0',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      overflowY: 'auto',
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Debug Panel</h4>
      
      <div>
        <strong>Total Logs:</strong> {logs.length}
      </div>
      <div>
        <strong>API Calls:</strong> {apiLogs.length}
      </div>
      <div>
        <strong>Errors:</strong> {errors.length}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
        <button onClick={handleExport} style={{ flex: 1, padding: '5px' }}>
          Export
        </button>
        <button onClick={() => clearLogs()} style={{ flex: 1, padding: '5px' }}>
          Clear
        </button>
      </div>

      <details style={{ marginTop: '10px' }}>
        <summary>Recent Logs</summary>
        <pre style={{ maxHeight: '150px', overflow: 'auto', margin: '5px 0 0 0' }}>
          {logs.slice(-5).map((log) => (
            <div key={log.id}>
              [{log.level}] {log.category}: {log.message}
            </div>
          ))}
        </pre>
      </details>
    </div>
  );
};

// Add to your App.tsx or DevProvider:
// <DebugPanel />
*/

// ============================================
// NEXT STEPS
// ============================================

/*
1. ✅ LoggerProvider is set up in main.tsx - works everywhere!
2. ✅ DevContext has logger integrated
3. 📋 Copy the examples above into your actual files
4. 🧪 Test with: const { info } = useLogger(); info('TEST', 'It works!');
5. 🔍 Open browser console to see colorized logs
6. 📊 Optional: Add DebugPanel component to visualize logs in UI
7. 🚀 Use specialized helpers (logAPI, logRedux, logComponent, etc.)

*/
