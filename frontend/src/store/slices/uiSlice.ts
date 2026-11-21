import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface UiState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  activeViewerMediaId: string | null;
  toasts: ToastMessage[];
}

const isBrowser = typeof window !== 'undefined';

const initialState: UiState = {
  theme: isBrowser ? ((localStorage.getItem('theme') as 'dark' | 'light') || 'dark') : 'dark',
  sidebarOpen: true,
  activeViewerMediaId: null,
  toasts: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openMediaViewer: (state, action: PayloadAction<string>) => {
      state.activeViewerMediaId = action.payload;
    },
    closeMediaViewer: (state) => {
      state.activeViewerMediaId = null;
    },
    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  openMediaViewer,
  closeMediaViewer,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
