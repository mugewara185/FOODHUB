import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData } from "../../data/types/auth";
import { authApi } from "../../services/api/authApi";
import { IS_DEV } from "../../core/config/app.config";

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  isLoggedIn: false,
  loading: false,
  isAuthenticated: false,
  isInitialized: false,
  error: null,
};

const AUTH_STORAGE_KEY = "zom2.auth.session";
const SESSION_ISOLATION_KEY = "zom2_dev_session_isolation";

const getStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    if (IS_DEV && window.localStorage.getItem(SESSION_ISOLATION_KEY) === "true") {
      return window.sessionStorage;
    }
  } catch (e) {}
  return window.localStorage;
};

const persistSession = (user: AuthUser | null): void => {
  const storage = getStorage();
  if (!storage) return;

  if (user && user.token) {
    // Only persist the token, not the entire PII payload
    const sessionData = { token: user.token };
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
  } else {
    storage.removeItem(AUTH_STORAGE_KEY);
  }
};

const readStoredSession = (): { token: string } | null => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { token?: string } | null;
    if (!parsed || !parsed.token) return null;

    return { token: parsed.token };
  } catch {
    return null;
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

// --- Async Thunks ---

export const loginThunk = createAsyncThunk<AuthUser, LoginCredentials, { rejectValue: string }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await authApi.login(credentials);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const signupThunk = createAsyncThunk<AuthUser, SignupData, { rejectValue: string }>(
  "auth/signup",
  async (data, { rejectWithValue }) => {
    try {
      return await authApi.signup(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const forgotPasswordThunk = createAsyncThunk<void, ForgotPasswordData, { rejectValue: string }>(
  "auth/forgotPassword",
  async (data, { rejectWithValue }) => {
    try {
      if (!data.email) return rejectWithValue("Email is required");
      await authApi.forgotPassword(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const resetPasswordThunk = createAsyncThunk<void, ResetPasswordData, { rejectValue: string }>(
  "auth/resetPassword",
  async (data, { rejectWithValue }) => {
    try {
      if (data.password !== data.confirmPassword) {
        return rejectWithValue("Passwords do not match");
      }
      await authApi.resetPassword(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const restoreAuthThunk = createAsyncThunk<AuthUser | null, void, { rejectValue: string }>(
  "auth/restore",
  async (_, { rejectWithValue }) => {
    // Dynamically import logger to avoid circular dependency issues at boot
    const { logger } = await import('../../core/dev/logger/Logger');
    const trace = logger.startTrace('AUTH', 'restoreAuthThunk started');
    
    try {
      const storedSession = readStoredSession();
      if (!storedSession?.token) {
        trace.info('No stored session found, skipping restore');
        trace.end('restoreAuthThunk completed (unauthenticated)');
        return null;
      }
      
      trace.debug('Stored session found, token extracted');
      trace.info('Calling /auth/me');
      
      const freshUser = await authApi.getMe(storedSession.token);
      
      trace.info('/auth/me completed', { data: { status: 200 } });
      trace.end('Authentication restored successfully');
      
      return freshUser;
    } catch (err) {
      trace.error('Restore auth failed', { error: err });
      trace.end('Authentication restoration failed');
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const toggleFavoriteThunk = createAsyncThunk<string[], string, { rejectValue: string, state: any }>(
  "auth/toggleFavorite",
  async (restaurantId, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.user?.token;
      if (!token) return rejectWithValue("Not authenticated");
      const updatedFavorites = await authApi.toggleFavorite(restaurantId, token);
      return updatedFavorites;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const updateProfileThunk = createAsyncThunk<AuthUser, any, { rejectValue: string, state: any }>(
  "auth/updateProfile",
  async (data, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.user?.token;
      if (!token) return rejectWithValue("Not authenticated");
      return await authApi.updateProfile(data, token);
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const addAddressThunk = createAsyncThunk<any[], any, { rejectValue: string, state: any }>(
  "auth/addAddress",
  async (data, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.user?.token;
      if (!token) return rejectWithValue("Not authenticated");
      return await authApi.addAddress(data, token);
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const removeAddressThunk = createAsyncThunk<any[], string, { rejectValue: string, state: any }>(
  "auth/removeAddress",
  async (addressId, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.user?.token;
      if (!token) return rejectWithValue("Not authenticated");
      return await authApi.removeAddress(addressId, token);
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthSession(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isLoggedIn = Boolean(action.payload);
      state.isAuthenticated = Boolean(action.payload);
      state.error = null;
      state.loading = false;
      persistSession(action.payload);
    },
    logout(state) {
      state.user = null;
      state.isLoggedIn = false;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      persistSession(null);
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isLoggedIn = true;
        state.isAuthenticated = true;
        persistSession(action.payload);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(signupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isLoggedIn = true;
        state.isAuthenticated = true;
        persistSession(action.payload);
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(restoreAuthThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreAuthThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload;
          state.isLoggedIn = true;
          state.isAuthenticated = true;
          persistSession(action.payload);
        } else {
          state.user = null;
          state.isLoggedIn = false;
          state.isAuthenticated = false;
          persistSession(null);
        }
      })
      .addCase(restoreAuthThunk.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
        state.user = null;
        state.isLoggedIn = false;
        state.isAuthenticated = false;
        persistSession(null);
      });

    builder.addCase(toggleFavoriteThunk.fulfilled, (state, action) => {
      if (state.user) {
        state.user.favoriteRestaurants = action.payload;
        persistSession(state.user);
      }
    });

    builder
      .addCase(updateProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        persistSession(action.payload);
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    builder.addCase(addAddressThunk.fulfilled, (state, action) => {
      if (state.user) {
        state.user.addresses = action.payload;
        persistSession(state.user);
      }
    });

    builder.addCase(removeAddressThunk.fulfilled, (state, action) => {
      if (state.user) {
        state.user.addresses = action.payload;
        persistSession(state.user);
      }
    });
  },
});

export const { logout, clearError, setAuthSession } = authSlice.actions;
export default authSlice.reducer;
