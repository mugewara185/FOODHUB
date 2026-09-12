import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux';
import store from './app/store';
import { DevProvider } from './core/dev/contexts/DevContext';
import { LoggerProvider } from './core/dev/contexts/LoggerContext';
import { ErrorBoundary } from './shared/components/ErrorBoundary/ErrorBoundary';
import { logger } from './core/dev/logger';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './shared/styles/theme';
import foodtheme from './shared/styles/foodTheme';
import './index.css';

import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

logger.info('APP', 'Application Initialized', { event: 'APP.INIT' });

ReactDOM.createRoot(document.getElementById('root')!).render(
    <LoggerProvider>
      <ErrorBoundary>
        <BrowserRouter>
            <CssBaseline />
              <Provider store={store}>
                <DevProvider>
                  <App />
                </DevProvider>
              </Provider>
        </BrowserRouter>
      </ErrorBoundary>
    </LoggerProvider>
);

// V2 (commented code omitted to simplify)


// V2
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import { AppProviders } from './app/providers/AppProviders';
// import { RouteConfig } from './app/routes/RouteConfig';
// import { reportWebVitals } from './core/utils/webVitals';
// import * as Sentry from '@sentry/react';
// import { APP_CONFIG } from './core/config/app.config';

// // Initialize Sentry for error tracking
// if (APP_CONFIG.enableAnalytics) {
//   Sentry.init({
//     dsn: APP_CONFIG.sentryDsn,
//     environment: APP_CONFIG.environment,
//     tracesSampleRate: 1.0,
//   });
// }

// // Register service worker for PWA
// if ('serviceWorker' in navigator && APP_CONFIG.environment === 'production') {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js');
//   });
// }

// const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// root.render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <AppProviders>
//         <RouteConfig />
//       </AppProviders>
//     </BrowserRouter>
//   </React.StrictMode>
// );

// // Performance monitoring
// reportWebVitals(console.log);