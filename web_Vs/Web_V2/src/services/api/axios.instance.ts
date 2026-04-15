// import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
// import { APP_CONFIG } from '../config/app.config';
// import { store } from '../../store';
// import { logout, refreshToken } from '../../features/auth/store/auth.slice';

// // Types
// interface QueueItem {
//   resolve: (value: unknown) => void;
//   reject: (reason?: unknown) => void;
//   config: AxiosRequestConfig;
// }

// // Create axios instance
// const axiosInstance = axios.create({
//   baseURL: APP_CONFIG.apiUrl,
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request queue for token refresh
// let isRefreshing = false;
// let failedQueue: QueueItem[] = [];

// const processQueue = (error: Error | null, token: string | null = null) => {
//   failedQueue.forEach(({ resolve, reject, config }) => {
//     if (error) {
//       reject(error);
//     } else if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//       resolve(axiosInstance(config));
//     }
//   });
//   failedQueue = [];
// };

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     // Add auth token
//     const token = localStorage.getItem('access_token');
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // Add request timestamp for debugging
//     config.metadata = { startTime: Date.now() };

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse) => {
//     // Log performance for slow requests
//     const duration = Date.now() - (response.config.metadata?.startTime || 0);
//     if (duration > 1000) {
//       console.warn(`Slow API call: ${response.config.url} took ${duration}ms`);
//     }
//     return response.data;
//   },
//   async (error: AxiosError) => {
//     const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

//     // Handle 401 Unauthorized
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         // Queue this request
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject, config: originalRequest });
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const refreshToken = localStorage.getItem('refresh_token');
//         if (!refreshToken) throw new Error('No refresh token');

//         const response = await axios.post(`${APP_CONFIG.apiUrl}/auth/refresh`, {
//           refreshToken,
//         });

//         const { accessToken, refreshToken: newRefreshToken } = response.data;
        
//         localStorage.setItem('access_token', accessToken);
//         localStorage.setItem('refresh_token', newRefreshToken);

//         processQueue(null, accessToken);
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         processQueue(refreshError as Error, null);
//         store.dispatch(logout());
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     // Handle other errors
//     const errorMessage = error.response?.data || error.message;
    
//     // Log to analytics in production
//     if (APP_CONFIG.enableAnalytics) {
//       // Send to Sentry or similar
//     }

//     return Promise.reject({
//       status: error.response?.status || 500,
//       message: errorMessage,
//       originalError: error,
//     });
//   }
// );

// export { axiosInstance };