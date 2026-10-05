import { appConfig } from '../../core/config/app.config';

import api from '../../core/utils/api';

export const usersApi = {
  getUsers: async (params: { page?: number; limit?: number; search?: string; role?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    
    return api.request<any>(`/users/admin?${query.toString()}`);
  },
  
  getUserById: async (id: string) => {
    const data = await api.request<any>(`/users/admin/${id}`);
    return data.user;
  },

  updateUser: async (id: string, updateData: any) => {
    const data = await api.request<any>(`/users/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return data.user;
  },

  deleteUser: async (id: string) => {
    await api.request<any>(`/users/admin/${id}`, {
      method: 'DELETE',
    });
  }
};
