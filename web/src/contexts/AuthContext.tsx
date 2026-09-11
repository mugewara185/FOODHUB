import React, { type ReactNode, useCallback, useEffect } from 'react';
import type { AuthContextType, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData, UpdateProfileData } from '../data/types/auth';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import {
  loginThunk,
  signupThunk,
  forgotPasswordThunk,
  resetPasswordThunk,
  restoreAuthThunk,
  logout as logoutAction,
  clearError as clearErrorAction
} from '../features/auth/authSlice';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    import('../core/dev/logger/Logger').then(({ logger }) => {
      logger.info('AUTH', 'AuthProvider mounted, starting auth restoration', { event: 'MOUNT', source: 'AuthProvider' });
    });
    void dispatch(restoreAuthThunk());
  }, [dispatch]);

  return <>{children}</>;
};

// Facade hook that translates the old context signature into Redux actions
export const useAuth = (): AuthContextType => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading: isLoading, isInitialized, error } = useAppSelector((state) => state.auth);
  // console.log('useAuth:', { user, isAuthenticated });

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
    isInitialized,
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