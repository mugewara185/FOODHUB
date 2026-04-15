// import { axiosInstance } from './axios.instance';
// import { API_ENDPOINTS } from '../constants/api.endpoints';

// // Generic API service with TypeScript support
// export class ApiService {
//   // GET request with caching support
//   static async get<T>(url: string, params?: Record<string, unknown>, config = {}): Promise<T> {
//     return axiosInstance.get(url, { params, ...config });
//   }

//   // POST request
//   static async post<T>(url: string, data?: unknown, config = {}): Promise<T> {
//     return axiosInstance.post(url, data, config);
//   }

//   // PUT request
//   static async put<T>(url: string, data?: unknown, config = {}): Promise<T> {
//     return axiosInstance.put(url, data, config);
//   }

//   // PATCH request
//   static async patch<T>(url: string, data?: unknown, config = {}): Promise<T> {
//     return axiosInstance.patch(url, data, config);
//   }

//   // DELETE request
//   static async delete<T>(url: string, config = {}): Promise<T> {
//     return axiosInstance.delete(url, config);
//   }

//   // Upload file with progress
//   static async upload<T>(
//     url: string,
//     file: File,
//     onProgress?: (percentage: number) => void,
//     additionalData?: Record<string, unknown>
//   ): Promise<T> {
//     const formData = new FormData();
//     formData.append('file', file);
    
//     if (additionalData) {
//       Object.entries(additionalData).forEach(([key, value]) => {
//         formData.append(key, String(value));
//       });
//     }

//     return axiosInstance.post(url, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       onUploadProgress: (progressEvent) => {
//         if (onProgress && progressEvent.total) {
//           const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           onProgress(percentage);
//         }
//       },
//     });
//   }
// }

// // Feature-specific API services
// export const AuthAPI = {
//   login: (data: LoginCredentials) => ApiService.post(API_ENDPOINTS.AUTH.LOGIN, data),
//   register: (data: SignupData) => ApiService.post(API_ENDPOINTS.AUTH.REGISTER, data),
//   logout: () => ApiService.post(API_ENDPOINTS.AUTH.LOGOUT),
//   refreshToken: (refreshToken: string) => ApiService.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }),
//   forgotPassword: (email: string) => ApiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
//   resetPassword: (data: ResetPasswordData) => ApiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),
// };

// export const RestaurantAPI = {
//   getAll: (params?: PaginationParams) => ApiService.get(API_ENDPOINTS.RESTAURANTS.LIST, params),
//   getById: (id: string) => ApiService.get(API_ENDPOINTS.RESTAURANTS.DETAIL(id)),
//   create: (data: CreateRestaurantDTO) => ApiService.post(API_ENDPOINTS.RESTAURANTS.CREATE, data),
//   update: (id: string, data: UpdateRestaurantDTO) => ApiService.put(API_ENDPOINTS.RESTAURANTS.UPDATE(id), data),
//   delete: (id: string) => ApiService.delete(API_ENDPOINTS.RESTAURANTS.DELETE(id)),
//   uploadLogo: (id: string, file: File, onProgress?: (p: number) => void) =>
//     ApiService.upload(API_ENDPOINTS.RESTAURANTS.UPLOAD_LOGO(id), file, onProgress),
// };

// // Continue for all features...