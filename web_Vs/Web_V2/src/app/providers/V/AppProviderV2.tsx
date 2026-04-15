// import React from 'react';
// import { Provider as ReduxProvider } from 'react-redux';
// import { PersistGate } from 'redux-persist/integration/react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import { HelmetProvider } from 'react-helmet-async';
// import { ErrorBoundary } from '../../shared/components/ErrorBoundary/ErrorBoundary';
// import { store, persistor } from '../../store/store';
// import { theme } from '../../shared/styles/theme';
// import { ToastProvider } from '../../shared/components/Toast/ToastProvider';
// import { AuthProvider } from '../../features/auth/context/AuthContext';
// import { WebsocketProvider } from '../../core/services/websocket/WebsocketProvider';
// import { AnalyticsProvider } from '../../core/services/analytics/AnalyticsProvider';

// // Create Query Client with optimized settings
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       cacheTime: 10 * 60 * 1000, // 10 minutes
//       retry: 1,
//       refetchOnWindowFocus: false,
//       suspense: false,
//     },
//   },
// });

// interface AppProvidersProps {
//   children: React.ReactNode;
// }

// export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
//   return (
//     <ErrorBoundary>
//       <HelmetProvider>
//         <ReduxProvider store={store}>
//           <PersistGate loading={null} persistor={persistor}>
//             <QueryClientProvider client={queryClient}>
//               <ThemeProvider theme={theme}>
//                 <CssBaseline />
//                 <AuthProvider>
//                   <WebsocketProvider>
//                     <AnalyticsProvider>
//                       <ToastProvider>
//                         {children}
//                       </ToastProvider>
//                     </AnalyticsProvider>
//                   </WebsocketProvider>
//                 </AuthProvider>
//               </ThemeProvider>
//               {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
//             </QueryClientProvider>
//           </PersistGate>
//         </ReduxProvider>
//       </HelmetProvider>
//     </ErrorBoundary>
//   );
// };