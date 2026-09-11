import type { AuthUser, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData } from '../../data/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AuthApiUserPayload {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'owner' | 'partner';
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
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> | T;

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload && payload.message
      ? String(payload.message)
      : 'Request failed';
    throw new Error(message);
  }

  if (typeof payload === 'object' && payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T;
  }

  return payload as T;
};

const buildAuthUser = (payload: AuthApiPayload): AuthUser => {
  const role = payload.user.role === 'admin' ? 'admin' : 'user';
  const permissions = role === 'admin'
    ? ['view_dashboard', 'manage_users', 'manage_restaurants', 'manage_menu', 'manage_orders', 'view_reports', 'place_order', 'view_profile']
    : ['place_order', 'view_profile', 'track_orders', 'cancel_orders'];

  return {
    id: payload.user.id,
    name: payload.user.name,
    email: payload.user.email,
    phone: payload.user.phone,
    avatar: payload.user.avatar,
    role,
    token: payload.token,
    refreshToken: payload.refreshToken || `refresh-${payload.token}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    permissions,
    createdAt: payload.user.createdAt || new Date().toISOString(),
    updatedAt: payload.user.updatedAt || new Date().toISOString(),
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
  };
};

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const payload = await request<AuthApiPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      return buildAuthUser(payload);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async signup(data: SignupData): Promise<AuthUser> {
    try {
      const payload = await request<AuthApiPayload>('/auth/register', {
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
      await request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email }),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      await request('/auth/reset-password', {
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
        const userPayload = await request<AuthApiUserPayload>('/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
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
        const payload = await request<{ favoriteRestaurants: string[] }>(`/users/favorites/${restaurantId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        return payload.favoriteRestaurants;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    async addAddress(addressData: any, token: string): Promise<any[]> {
      try {
        const payload = await request<{ addresses: any[] }>('/users/addresses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(addressData)
        });
        return payload.addresses;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    async removeAddress(addressId: string, token: string): Promise<any[]> {
      try {
        const payload = await request<{ addresses: any[] }>(`/users/addresses/${addressId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        return payload.addresses;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    }
};
