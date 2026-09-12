import { APP_CONFIG } from '../../core/config/app.config';

import { getAuthToken } from './apiUtils';
import { logAPI } from '../../core/dev/logger';
import { v4 as uuidv4 } from 'uuid';

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const token = getAuthToken();
  const { headers: customHeaders, ...restInit } = init || {};
  const traceId = uuidv4().substring(0, 8);
  const method = init?.method || 'GET';
  const url = `${APP_CONFIG.API_URL}${endpoint}`;
  
  let parsedBody;
  try {
    parsedBody = restInit?.body ? JSON.parse(restInit.body as string) : undefined;
  } catch(e) {}

  logAPI.request(method, url, parsedBody, traceId);
  const startTime = performance.now();
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    headers,
    ...restInit,
  });

  const durationMs = performance.now() - startTime;
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = payload.message || `Request failed (${response.status})`;
    logAPI.error(method, url, new Error(msg), traceId);
    throw new Error(msg);
  }

  logAPI.response(method, url, response.status, durationMs, payload, traceId);

  if ('data' in payload) {
    return payload.data as T;
  }

  return payload as T;
};

export const usersApi = {
  getUsers: async (params: { page?: number; limit?: number; search?: string; role?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    
    return request<any>(`/users/admin?${query.toString()}`);
  },
  
  getUserById: async (id: string) => {
    const data = await request<any>(`/users/admin/${id}`);
    return data.user;
  },

  updateUser: async (id: string, updateData: any) => {
    const data = await request<any>(`/users/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return data.user;
  },

  deleteUser: async (id: string) => {
    await request<any>(`/users/admin/${id}`, {
      method: 'DELETE',
    });
  }
};
