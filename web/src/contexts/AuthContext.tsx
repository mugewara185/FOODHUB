import React, { type ReactNode, useCallback } from 'react';
import type { AuthContextType, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData, UpdateProfileData } from '../data/types/auth';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { 
  loginThunk, 
  signupThunk, 
  forgotPasswordThunk, 
  resetPasswordThunk, 
  logout as logoutAction,
  clearError as clearErrorAction
} from '../features/auth/authSlice';

interface AuthProviderProps {
  children: ReactNode;
}

// Keep the provider as a pass-through so App.tsx does not break
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <>{children}</>;
};

// Facade hook that translates the old context signature into Redux actions
export const useAuth = (): AuthContextType => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading: isLoading, error } = useAppSelector((state) => state.auth);

  const login = useCallback(async (credentials: LoginCredentials) => {
    await dispatch(loginThunk(credentials)).unwrap();
  }, [dispatch]);

  const signup = useCallback(async (data: SignupData) => {
    await dispatch(signupThunk(data)).unwrap();
  }, [dispatch]);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    await dispatch(forgotPasswordThunk(data)).unwrap();
  }, [dispatch]);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    await dispatch(resetPasswordThunk(data)).unwrap();
  }, [dispatch]);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    // We haven't implemented updateProfileThunk yet, but here is a placeholder
    console.log("Mock update profile", data);
  }, []);

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearErrorAction());
  }, [dispatch]);

  return {
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
};