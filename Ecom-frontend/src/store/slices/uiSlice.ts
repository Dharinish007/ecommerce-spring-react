import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ToastMessage } from "@/types/common.types";

interface UiState {
  toasts: ToastMessage[];
  isMobileMenuOpen: boolean;
  searchQuery: string;
}

const initialState: UiState = {
  toasts: [],
  isMobileMenuOpen: false,
  searchQuery: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<Omit<ToastMessage, "id"> & { id?: string }>
    ) => {
      const id = action.payload.id || Math.random().toString(36).substring(2, 9);
      state.toasts.push({
        id,
        type: action.payload.type,
        message: action.payload.message,
        durationMs: action.payload.durationMs || 4000,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleMobileMenu: (state, action: PayloadAction<boolean | undefined>) => {
      state.isMobileMenuOpen =
        action.payload !== undefined ? action.payload : !state.isMobileMenuOpen;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { addToast, removeToast, toggleMobileMenu, setSearchQuery } = uiSlice.actions;
export default uiSlice.reducer;
