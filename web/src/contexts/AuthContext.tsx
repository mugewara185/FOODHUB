import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import  type { AuthContextType, AuthUser, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData, UpdateProfileData } from '../types/auth';
import { STORAGE_KEYS } from '../constants/food';

// Mock user data
const MOCK_USER: AuthUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 9876543210',
  avatar: 'https://i.pravatar.cc/300',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  clearError: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear invalid storage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, accept any non-empty credentials
      if (!credentials.email || !credentials.password) {
        throw new Error('Please enter email and password');
      }

      // Create user data
      const userData: AuthUser = {
        ...MOCK_USER,
        email: credentials.email,
      };

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, userData.token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, userData.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Signup function
  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Create user data
      const userData: AuthUser = {
        ...MOCK_USER,
        name: data.name,
        email: data.email,
        phone: data.phone,
      };

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, userData.token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, userData.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Forgot password function
  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!data.email) {
        throw new Error('Please enter your email address');
      }

      console.log('Password reset email sent to:', data.email);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      console.log('Password reset successful');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!user) {
        throw new Error('No user found');
      }

      // Update user data
      const updatedUser: AuthUser = {
        ...user,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      // Update localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};