// Role types
export type UserRole = 'admin' | 'restaurant_owner' | 'user' | 'delivery_partner';

// Permissions
export type Permission = 
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_restaurants'
  | 'manage_menu'
  | 'manage_orders'
  | 'manage_payments'
  | 'view_reports'
  | 'manage_delivery'
  | 'place_order'
  | 'view_profile'
  | 'manage_own_restaurant'
  | 'manage_own_orders'
  | 'track_orders'
  | 'cancel_orders';

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  permissions: Permission[];
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  restaurantId?: string; // For restaurant owners
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
  refreshToken: string;
  expiresAt: number;
  permissions: Permission[];
}



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

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}