import { createSlice,type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  searchDrawerOpen: boolean;
  currentModal: string | null;
  toast: {
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  loading: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
  cartDrawerOpen: false,
  searchDrawerOpen: false,
  currentModal: null,
  toast: {
    open: false,
    message: '',
    type: 'info',
  },
  loading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleCartDrawer: (state) => {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.cartDrawerOpen = action.payload;
    },
    toggleSearchDrawer: (state) => {
      state.searchDrawerOpen = !state.searchDrawerOpen;
    },
    setSearchDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.searchDrawerOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.currentModal = action.payload;
    },
    closeModal: (state) => {
      state.currentModal = null;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: UIState['toast']['type'] }>) => {
      state.toast = {
        open: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      state.toast.open = false;
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.isLoading;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleCartDrawer,
  setCartDrawerOpen,
  toggleSearchDrawer,
  setSearchDrawerOpen,
  openModal,
  closeModal,
  showToast,
  hideToast,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectCartDrawerOpen = (state: RootState) => state.ui.cartDrawerOpen;
export const selectSearchDrawerOpen = (state: RootState) => state.ui.searchDrawerOpen;
export const selectCurrentModal = (state: RootState) => state.ui.currentModal;
export const selectToast = (state: RootState) => state.ui.toast;
export const selectLoading = (state: RootState, key: string) => state.ui.loading[key];