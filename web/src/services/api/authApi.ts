import { appConfig } from '../../core/config/app.config';
import type { AuthUser, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData, UserRole, Permission } from '../../data/types/auth';

const API_BASE_URL = appConfig.api.baseUrl;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AuthApiUserPayload {
  id: string;
  name: string;
  email: string;
  role?: UserRole[];
  roles?: UserRole[];
  phone?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  addresses?: any[];
  favoriteRestaurants?: string[];
}

interface AuthApiPayload {
  token: string;
  user: AuthApiUserPayload;
  refreshToken?: string;
  roles?: UserRole[];
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

import { logger } from '../../core/dev/logger';
import api from '../../core/utils/api';

const buildAuthUser = (payload: AuthApiPayload): AuthUser => {
  // console.log('buildAuthUser -> ', payload)
  logger.info('AUTH-API', 'Building authenticated user', { event: 'AUTH.USER.BUILD', data: payload });
  const roles: UserRole[] = payload.user.roles ?? (payload.user.role ?? ['user']);
  const isAdmin = roles.includes('admin');
  const permissions: Permission[] = isAdmin
    ? ['view_dashboard', 'manage_users', 'manage_restaurants', 'manage_menu', 'manage_orders', 'view_reports', 'place_order', 'view_profile']
    : ['place_order', 'view_profile', 'track_orders', 'cancel_orders'];

  return {
    id: payload.user.id || (payload.user as any)._id,
    name: payload.user.name,
    email: payload.user.email,
    phone: payload.user.phone,
    avatar: payload.user.avatar,
    role: roles,
    token: payload.token,
    refreshToken: payload.refreshToken || `refresh-${payload.token}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    permissions,
    createdAt: payload.user.createdAt || new Date().toISOString(),
    updatedAt: payload.user.updatedAt || new Date().toISOString(),
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    addresses: (payload.user.addresses || []).map((addr: any) => ({
      ...addr,
      id: addr.id || addr._id
    })),
    favoriteRestaurants: payload.user.favoriteRestaurants || [],
  };
};

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const payload = await api.request<AuthApiPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      console.log('%cme:', "color: #ff0000", payload.user.email)
      logger.info('AUTH', 'Login successful', { event: 'AUTH.LOGIN.SUCCESS', data: payload });
      return buildAuthUser(payload);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async signup(data: SignupData): Promise<AuthUser> {
    try {
      const payload = await api.request<AuthApiPayload>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
      });

      return buildAuthUser(payload);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email }),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      await api.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          password: data.password,
          confirmPassword: data.confirmPassword,
          token: data.token,
        }),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getMe(token: string): Promise<AuthUser> {
    try {
      const userPayload = await api.request<AuthApiUserPayload>('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('%cme:', `${!userPayload.email ? "color: #ff0000" : "color: green"}`, userPayload.email)
      return buildAuthUser({
        token,
        user: userPayload,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async toggleFavorite(restaurantId: string, token: string): Promise<string[]> {
    try {
      const payload = await api.request<{ favoriteRestaurants: string[] }>(`/users/favorites/${restaurantId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      return payload.favoriteRestaurants;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async toggleFoodFavorite(foodItemId: string, token: string): Promise<string[]> {
    try {
      const payload = await api.request<{ favoriteFoodItems: string[] }>(`/users/favorites/food/${foodItemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      return payload.favoriteFoodItems;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async addAddress(addressData: any, token: string): Promise<any[]> {
    try {
      const payload = await api.request<{ addresses: any[] }>('/users/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(addressData)
      });
      return payload.addresses.map((addr: any) => ({ ...addr, id: addr.id || addr._id }));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async removeAddress(addressId: string, token: string): Promise<any[]> {
    try {
      const payload = await api.request<{ addresses: any[] }>(`/users/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return payload.addresses.map((addr: any) => ({ ...addr, id: addr.id || addr._id }));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateProfile(data: any, token: string): Promise<AuthUser> {
    try {
      const payload = await api.request<{ user: AuthApiUserPayload }>('/users/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return buildAuthUser({ token, user: payload.user });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};

