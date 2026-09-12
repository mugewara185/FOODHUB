// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

import type { AuthUser } from '@/core/types/auth';

// Re-export core user/permission types
export {
  type User,
  type AuthUser,
  type UserRole,
  type Permission,
} from '../../core/types';

// ─────────────────────────────────────────────────────────────────────────
// AUTH REQUEST/RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// AUTH STATE & CONTEXT TYPES
// ─────────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  addAddress: (data: any) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────
// ROLE & PERMISSION HELPERS
// ─────────────────────────────────────────────────────────────────────────

// Role configuration for permission mapping
export interface RoleConfig {
  id: string;
  name: 'admin' | 'restaurant_owner' | 'user' | 'delivery_partner';
  displayName: string;
  permissions: string[];
  description: string;
}