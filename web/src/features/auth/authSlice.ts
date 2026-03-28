import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthUser, LoginCredentials, SignupData, ForgotPasswordData, ResetPasswordData } from "../../data/types/auth";
import { users } from "../../data/factories/users";
import { fakeFetch } from "../../api/fakeApi";

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  isLoggedIn: false,
  loading: false,
  isAuthenticated: false,
  error: null,
};

// --- Async Thunks ---

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // Find matching mock user
      const found = users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password);
      if (!found) {
        return rejectWithValue("Invalid email or password");
      }
      
      const authUser: AuthUser = {
        ...found,
        token: "mock-jwt-token-" + Date.now(),
        refreshToken: "mock-refresh-token",
        expiresAt: Date.now() + 86400000,
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      } as AuthUser;

      return await fakeFetch(authUser, 800);
    } catch (err: any) {
      return rejectWithValue(err.message || "Login failed");
    }
  }
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (data: SignupData, { rejectWithValue }) => {
    try {
      // Simulate account creation
      const newUser: AuthUser = {
        id: "u_new_" + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "user",
        avatar: "https://i.pravatar.cc/150",
        token: "mock-jwt-token-new",
        refreshToken: "mock-refresh-token",
        expiresAt: Date.now() + 86400000,
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
      } as AuthUser;

      return await fakeFetch(newUser, 1000);
    } catch (err: any) {
      return rejectWithValue(err.message || "Signup failed");
    }
  }
);

export const forgotPasswordThunk = createAsyncThunk(
  "auth/forgotPassword",
  async (data: ForgotPasswordData, { rejectWithValue }) => {
    try {
      if (!data.email) return rejectWithValue("Email is required");
      return await fakeFetch({ success: true }, 800);
    } catch (err: any) {
      return rejectWithValue("Failed to send reset email");
    }
  }
);

export const resetPasswordThunk = createAsyncThunk(
  "auth/resetPassword",
  async (data: ResetPasswordData, { rejectWithValue }) => {
    try {
      if (data.password !== data.confirmPassword) {
        return rejectWithValue("Passwords do not match");
      }
      return await fakeFetch({ success: true }, 1000);
    } catch (err: any) {
      return rejectWithValue("Failed to reset password");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isLoggedIn = false;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
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
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Signup
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
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Forgot Password
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

    // Reset Password
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
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

