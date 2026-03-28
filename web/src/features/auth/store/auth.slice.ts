// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { AuthAPI } from '../../../core/api/api.service';
// import { AuthState, User, LoginCredentials, SignupData } from '../types/auth.types';

// const initialState: AuthState = {
//   user: null,
//   isAuthenticated: false,
//   isLoading: false,
//   error: null,
//   permissions: [],
// };

// // Async thunks
// export const login = createAsyncThunk(
//   'auth/login',
//   async (credentials: LoginCredentials, { rejectWithValue }) => {
//     try {
//       const response = await AuthAPI.login(credentials);
//       // Store tokens
//       localStorage.setItem('access_token', response.accessToken);
//       localStorage.setItem('refresh_token', response.refreshToken);
//       return response.user;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Login failed');
//     }
//   }
// );

// export const register = createAsyncThunk(
//   'auth/register',
//   async (data: SignupData, { rejectWithValue }) => {
//     try {
//       const response = await AuthAPI.register(data);
//       localStorage.setItem('access_token', response.accessToken);
//       localStorage.setItem('refresh_token', response.refreshToken);
//       return response.user;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Registration failed');
//     }
//   }
// );

// export const logout = createAsyncThunk('auth/logout', async () => {
//   await AuthAPI.logout();
//   localStorage.removeItem('access_token');
//   localStorage.removeItem('refresh_token');
// });

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     setUser: (state, action: PayloadAction<User>) => {
//       state.user = action.payload;
//       state.isAuthenticated = true;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//     updatePermissions: (state, action: PayloadAction<string[]>) => {
//       state.permissions = action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     // Login
//     builder.addCase(login.pending, (state) => {
//       state.isLoading = true;
//       state.error = null;
//     });
//     builder.addCase(login.fulfilled, (state, action) => {
//       state.isLoading = false;
//       state.user = action.payload;
//       state.isAuthenticated = true;
//     });
//     builder.addCase(login.rejected, (state, action) => {
//       state.isLoading = false;
//       state.error = action.payload as string;
//     });

//     // Register
//     builder.addCase(register.pending, (state) => {
//       state.isLoading = true;
//       state.error = null;
//     });
//     builder.addCase(register.fulfilled, (state, action) => {
//       state.isLoading = false;
//       state.user = action.payload;
//       state.isAuthenticated = true;
//     });
//     builder.addCase(register.rejected, (state, action) => {
//       state.isLoading = false;
//       state.error = action.payload as string;
//     });

//     // Logout
//     builder.addCase(logout.fulfilled, (state) => {
//       state.user = null;
//       state.isAuthenticated = false;
//       state.permissions = [];
//     });
//   },
// });

// export const { setUser, clearError, updatePermissions } = authSlice.actions;
// export default authSlice.reducer;

// // Selectors
// export const selectUser = (state: RootState) => state.auth.user;
// export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
// export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
// export const selectAuthError = (state: RootState) => state.auth.error;
// export const selectPermissions = (state: RootState) => state.auth.permissions;