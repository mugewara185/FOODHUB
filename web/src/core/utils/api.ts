import { appConfig } from '../config/app.config';
import { getAuthToken } from '../../services/api/apiUtils';
import { logAPI } from '../dev/logger';
import { v4 as uuidv4 } from 'uuid';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any,
    public traceId?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiRequestConfig extends RequestInit {
  url: string;
  traceId: string;
  queryParams?: Record<string, string | number | boolean>;
  mockAdapter?: () => Promise<Response>;
}

export interface ApiResponseContext {
  response: Response;
  config: ApiRequestConfig;
  data: any;
  durationMs: number;
}

type RequestInterceptor = (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;
type ResponseInterceptor = (context: ApiResponseContext) => ApiResponseContext | Promise<ApiResponseContext>;
type ErrorInterceptor = (error: ApiClientError, config: ApiRequestConfig) => ApiClientError | Promise<ApiClientError>;

export class ApiClient {
  private baseUrl: string;

  public interceptors = {
    request: [] as RequestInterceptor[],
    response: [] as ResponseInterceptor[],
    error: [] as ErrorInterceptor[],
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, queryParams?: Record<string, string | number | boolean>): string {
    let url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return url;
  }

  async request<T = any>(endpoint: string, options: Omit<ApiRequestConfig, 'url' | 'traceId'> = {}): Promise<T> {
    let config: ApiRequestConfig = {
      ...options,
      url: this.buildUrl(endpoint, options.queryParams),
      traceId: uuidv4().substring(0, 8),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    // Auto-serialize JSON bodies if it's an object and not FormData
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    // 1. Request Interceptors
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    const { url, traceId, queryParams, mockAdapter, ...fetchOptions } = config;
    const startTime = performance.now();
    let data: any;

    try {
      const response = mockAdapter ? await mockAdapter() : await fetch(url, fetchOptions);
      const durationMs = performance.now() - startTime;

      data = await response.json().catch(() => ({}));

      let context: ApiResponseContext = { response, config, data, durationMs };

      // 2. Response Interceptors
      for (const interceptor of this.interceptors.response) {
        context = await interceptor(context);
      }

      data = context.data;

      if (!response.ok) {
        const message = data?.message || `Request failed with status ${response.status}`;
        throw new ApiClientError(message, response.status, data, traceId);
      }

    } catch (error: any) {
      let clientError = error instanceof ApiClientError
        ? error
        : new ApiClientError(error.message || 'Network error', undefined, undefined, traceId);

      // 3. Error Interceptors
      for (const interceptor of this.interceptors.error) {
        clientError = await interceptor(clientError, config);
      }
      throw clientError;
    }

    // Default Payload Normalization
    if (typeof data === 'object' && data !== null && 'data' in data) {
      return data.data as T;
    }
    return data as T;
  }

  get<T = any>(endpoint: string, options?: Omit<ApiRequestConfig, 'url' | 'traceId'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestConfig, 'url' | 'traceId'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestConfig, 'url' | 'traceId'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestConfig, 'url' | 'traceId'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string, options?: Omit<ApiRequestConfig, 'url' | 'traceId'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(appConfig.api.baseUrl || '/api');

// --- Standard Interceptors ---

// 1. Mock Data Source Extension Point
import { ApiSimulator } from '../dev/simulator/ApiSimulator';

api.interceptors.request.push((config) => {
  if (appConfig.api.dataSource === 'mock') {
    config.mockAdapter = () => ApiSimulator.resolve(config);
  }
  return config;
});

// 2. Auth Header Injection
api.interceptors.request.push((config) => {
  const token = getAuthToken();
  if (token && !((config.headers as Record<string, string>)?.Authorization)) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

// 3. DevConsole Request Logging
api.interceptors.request.push((config) => {
  let parsedBody;
  try { parsedBody = typeof config.body === 'string' ? JSON.parse(config.body) : config.body; } catch(e) {}
  logAPI.request(config.method || 'GET', config.url, parsedBody, config.traceId);
  return config;
});

// 4. DevConsole Response Logging & 401 Handling
api.interceptors.response.push((context) => {
  const { response, config, data, durationMs } = context;
  logAPI.response(config.method || 'GET', config.url, response.status, durationMs, data, config.traceId);

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return context;
});

// 5. DevConsole Error Logging
api.interceptors.error.push((error, config) => {
  logAPI.error(config.method || 'GET', config.url, error, config.traceId);

  if (error.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return error;
});

export default api;
